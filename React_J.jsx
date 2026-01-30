import React, { useState, useEffect, useMemo } from 'react';

// Import master data
import { T, AB, EQ, EQ_SCHEMA } from './src/data/equipmentData.js';
import { R, SK, EN, EN_SCHEMA } from './src/data/enemyData.js';
import { ST, ST_SCHEMA, STAGES_PER_ACT } from './src/data/stageData.js';
import { PLAYER_INITIAL, STARTING_INVENTORY, ACT_SCALE, ACT_ATTACK_SCALE, BOSS_REWARD_KEYS } from './src/data/gameConfig.js';

// Constants & Type Definitions
const VERSION = 'v0.9.1';

const RANGE = { LONG: ‘長距離’, MID: ‘中距離’, CLOSE: ‘近距離’ };
const RANK  = { NORMAL: '通常', ELITE: 'エリート', BOSS: 'ボス' };

const BR = {
expansion:     { name: ‘拡張’,   desc: “装備スロット最大値+2。” },
reinforcement: { name: ‘強化’,   desc: “装備スロット最大値+1、耐久値最大値+50。” },
boarding:      { name: ‘白兵戦’, desc: “装備スロット最大値+1。第5・第6ターンを近距離に固定。” },
skirmish:      { name: ‘遭遇戦’, desc: “装備スロット最大値+1。第3ターンを中距離に変更。” },
logistics:     { name: ‘兵站’,   desc: “戦闘開始前に🚀 ランスを1基追加する。” },
doctrine:      { name: ‘教義’,   desc: “耐久値最大値+60。すべての武装ダメージ×1.2。” },
};

const UI = {
btn: {
start: ‘発進’, engage: ‘戦闘開始’, continue: ‘続行’,
claim: ‘獲得’, restart: ‘再スタート’, repair: ‘修理’,
fabricate: ‘製造’, leave: ‘出港’,
},
label: {
stage: ‘ステージ’, act: ‘ACT’, hull: ‘HP’, shield: ‘シールド’,
slots: ‘装備枠’, power: ‘威力’, attack: ‘攻撃力’,
equipped: ‘装備中’, inventory: ‘装備一覧’,
reward: ‘報酬’, bossReward: ‘ボス特典’, preview: ‘予想攻撃力’,
long: ‘長距離’, mid: ‘中距離’, close: ‘近距離’,
},
result: {
clear: ‘🎉 クリア 🎉’, victory: ‘✓ 勝利’,
defeat: ‘✗ 敗北’, draw: ‘— 引き分け —’,
},
dock: {
title: ‘ドック’,
repair: { title: ‘緊急修理’, desc: (n) => `アイテムを${n}個廃棄して、耐久値を30%回復する` },
fabricate: { title: ‘緊急ミサイル製造’, desc: ‘耐久値最大値を永久に−10して、🚀 ランスを1つ獲得する’ },
leave: { title: ‘ドックを出る’, desc: ‘何もせずに次のステージへ進む’ },
},
};

const STORY = {
opening: `>艦船ID：STAR CANINE

> 指揮権限：艦長

> 救難信号を検知
> 発信元：惑星K9
> 送信者ID：ライカ

「私よ。
K9は陥落した。
ソーラーベアの艦隊が惑星を占拠した。
私も連れて行かれた。
あなたがここにいなかったことは分かってる。
でも、きっと戻ってくるとも信じてる。

お願い……死なないで…」

> 信号途絶
> K9軌道上よりソーラーベア帝国の識別信号を確認

> 惑星K9へ進路を設定しました`,   victory: `LAIKAを救出

「帰ってきてくれたのね。」`,
defeat: '信号途絶',
};

// Helpers

const parse = (schema, data) => data.map(row => {
const obj = {};
schema.forEach((key, i) => obj[key] = row[i]);
return obj;
});

const equipmentList = parse(EQ_SCHEMA, EQ);
const enemyList = parse(EN_SCHEMA, EN);
const stageList = parse(ST_SCHEMA, ST);

const getAct = (stage) => Math.floor((stage - 1) / STAGES_PER_ACT) + 1;
const getStageInAct = (stage) => ((stage - 1) % STAGES_PER_ACT) + 1;
const getActScale = (act) => ACT_SCALE[act - 1] || 1;
const getActAttackScale = (act) => ACT_ATTACK_SCALE[act - 1] || 1;

const applyDamage = (dmg, shield, hull) => {
const toShield = Math.min(shield, dmg);
return {
shield: Math.max(0, shield - dmg),
hull: Math.max(0, hull - (dmg - toShield)),
};
};

let globalItemIdCounter = 0;

const createItem = (name, idCounter = null) => {
const base = equipmentList.find(e => e.name === name);
if (!base) return null;
const id = idCounter !== null ? idCounter.next() : globalItemIdCounter++;
return { …base, id };
};

const createIdCounter = (start = 0) => {
let counter = start;
return {
next: () => counter++,
current: () => counter,
reset: (val = 0) => { counter = val; },
};
};

const getTypeName = (type) => type?.name || String(type);
const getTypeId = (type) => type?.id || String(type);
const getRangeName = (range) => RANGE[range] || range;

const hasAbility = (item, abilityType) => {
if (!item.ability) return false;
const ab = Array.isArray(item.ability) ? item.ability[0] : item.ability;
return ab === abilityType || ab?.id === abilityType?.id;
};

const getAbilityValue = (item) => {
if (!item.ability || !Array.isArray(item.ability)) return null;
return item.ability[1];
};

const formatAbility = (ability) => {
if (!ability) return ‘’;
const [ab, value] = Array.isArray(ability) ? ability : [ability, null];
return ab.format ? ab.format(value) : ab.name;
};

const formatMult = (mult) => {
if (!mult) return ‘’;
const [target, value] = mult;
return `${getTypeName(target)}×${value}`;
};

const hasSkill = (enemy, skillType) => {
return enemy.skills.some(([sk]) => sk === skillType || sk?.id === skillType?.id);
};

const getSkillValue = (enemy, skillType) => {
const skill = enemy.skills.find(([sk]) => sk === skillType || sk?.id === skillType?.id);
return skill ? skill[1] : null;
};

const getTurnOrder = (player) => {
const base = [‘LONG’, ‘MID’, ‘CLOSE’, ‘CLOSE’, ‘MID’, ‘LONG’];
if (player.boarding) { base[4] = ‘CLOSE’; base[5] = ‘CLOSE’; }
if (player.skirmish) { base[2] = ‘MID’; }
return base;
};

const STAGE_RANK_MAP = { ‘N’: R.N, ‘E’: R.E, ‘B’: R.B };
const getStageData = (stage) => {
const stageInAct = getStageInAct(stage);
return stageList[stageInAct - 1] || null;
};
const getEnemyRank = (stageRank) => STAGE_RANK_MAP[stageRank] || null;

const createPRNG = (seed) => {
let state = seed >>> 0;
return {
next: () => {
state = (state + 0x6D2B79F5) | 0;
let t = state;
t = Math.imul(t ^ (t >>> 15), t | 1);
t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
},
nextInt: function(min, max) {
return min + Math.floor(this.next() * (max - min + 1));
},
};
};

const seededShuffle = (array, rng) => {
const result = […array];
for (let i = result.length - 1; i > 0; i–) {
const j = Math.floor(rng.next() * (i + 1));
[result[i], result[j]] = [result[j], result[i]];
}
return result;
};

let gameRNG = null;

const initializeRNG = (seed) => {
gameRNG = createPRNG(seed);
return gameRNG;
};

const getRNG = () => gameRNG;
const generateSeed = () => Math.floor(Math.random() * 0xFFFFFFFF);

const createItemDeck = (rarity, numBags, rng) => {
const itemsOfRarity = equipmentList.filter(e => e.rarity === rarity);
const deck = [];
for (let bag = 0; bag < numBags; bag++) {
const shuffledBag = seededShuffle(itemsOfRarity.map(e => e.name), rng);
deck.push(…shuffledBag);
}
return deck;
};

const createRarityDeck = (normalCount, eliteCount, bossCount, rng) => {
const deck = [];
for (let i = 0; i < normalCount; i++) deck.push(1);
for (let i = 0; i < eliteCount; i++) deck.push(2);
for (let i = 0; i < bossCount; i++) deck.push(3);
return seededShuffle(deck, rng);
};

const createInitialPlayer = (seed = null) => {
const actualSeed = seed !== null ? seed : generateSeed();
initializeRNG(actualSeed);
const rng = getRNG();
const idCounter = createIdCounter(0);

const normalItemsDeck = createItemDeck(1, 1, rng);  // 1 bag with auto-refill
const eliteItemsDeck = createItemDeck(2, 1, rng);   // 1 bag with auto-refill
const bossItemsDeck = createItemDeck(3, 1, rng);    // 1 bag with auto-refill

// Helper to draw from deck (refill if empty)
const drawFromDeck = (deck, rarity) => {
if (deck.length === 0) {
// Refill deck when empty
const itemsOfRarity = equipmentList.filter(e => e.rarity === rarity);
const newBag = seededShuffle(itemsOfRarity.map(e => e.name), rng);
deck.push(…newBag);
console.log(`Refilled rarity ${rarity} deck with ${newBag.length} items`);
}
const drawn = deck.shift();
console.log(`Drew "${drawn}" from rarity ${rarity} deck (${deck.length} remaining)`);
return drawn;
};

// Pre-allocate ALL stage rewards (Tetris-style)
const stageRewards = {};

console.log(‘Starting stage rewards allocation…’);
try {
for (let stage = 1; stage <= 36; stage++) {
const stageData = getStageData(stage);
console.log(`Stage ${stage}:`, stageData);
if (!stageData || stageData.rank === ‘D’) continue; // Skip dock stages

```
  const act = getAct(stage);
  const enemyRank = getEnemyRank(stageData.rank);
  console.log(`  ACT: ${act}, Rank: ${enemyRank}`);
  
  // Determine 3 rarity slots for this stage
  let raritySlots = [];
  
  if (enemyRank === R.B) {
    // Boss: always [3, 3, 3]
    raritySlots = [3, 3, 3];
  } else if (enemyRank === R.E) {
    // Elite base: [2, 2, 2]
    raritySlots = [2, 2, 2];
    
    // Upgrade some Elite → Boss based on ACT
    if (act === 2) {
      // ACT II: 90% Elite, 10% Boss (0,5,1 ratio)
      if (rng.next() < 0.167) raritySlots[2] = 3; // ~1/6 chance
    } else if (act === 3) {
      // ACT III: 67% Elite, 33% Boss (0,4,2 ratio)
      raritySlots[1] = 3; // Upgrade second slot
      if (rng.next() < 0.5) raritySlots[2] = 3; // 50% for third
    }
  } else {
    // Normal base: [1, 1, 1]
    raritySlots = [1, 1, 1];
    
    // Upgrade Normal → Elite/Boss based on ACT
    if (act === 1) {
      // ACT I: 95% Normal, 5% Elite (20,1,0 ratio)
      if (rng.next() < 0.048) raritySlots[0] = 2; // ~1/21 chance
    } else if (act === 2) {
      // ACT II: 90% Normal, 10% Elite (19,2,0 ratio)
      if (rng.next() < 0.095) raritySlots[0] = 2; // ~2/21 chance
      if (rng.next() < 0.095) raritySlots[1] = 2;
    } else if (act === 3) {
      // ACT III: 75% Normal, 20% Elite, 5% Boss (16,4,1 ratio)
      if (rng.next() < 0.19) raritySlots[0] = 2; // ~4/21 for Elite
      if (rng.next() < 0.19) raritySlots[1] = 2;
      if (rng.next() < 0.19) raritySlots[2] = 2;
      // Some Elite → Boss (1/21 total Boss)
      if (raritySlots[0] === 2 && rng.next() < 0.25) raritySlots[0] = 3;
    }
  }

  console.log(`  Rarity slots: ${raritySlots}`);

  // Draw 3 items based on rarity slots
  const items = [];
  for (let i = 0; i < 3; i++) {
    const rarity = raritySlots[i];
    let itemName;
    
    if (rarity === 3) {
      itemName = drawFromDeck(bossItemsDeck, 3);
    } else if (rarity === 2) {
      itemName = drawFromDeck(eliteItemsDeck, 2);
    } else {
      itemName = drawFromDeck(normalItemsDeck, 1);
    }
    
    const item = equipmentList.find(e => e.name === itemName);
    if (item) items.push(item);
  }

  console.log(`  Items: ${items.map(i => i.name).join(', ')}`);
  stageRewards[stage] = items;
}
```

} catch (error) {
console.error(‘Error allocating stage rewards:’, error);
}
console.log(‘Stage rewards allocation complete:’, Object.keys(stageRewards).length, ‘stages’);

const bossRewards = seededShuffle([...BOSS_REWARD_KEYS], rng);

return {
seed: actualSeed,
itemIdCounter: idCounter,
max_hull: PLAYER_INITIAL.max_hull,
hull: PLAYER_INITIAL.hull,
max_slots: PLAYER_INITIAL.max_slots,
inventory: STARTING_INVENTORY.map(name => createItem(name, idCounter)),
equipped: [],
logistics: false,
boarding: false,
skirmish: false,
doctrine: false,
stageRewards, // Pre-allocated rewards for all stages
bossRewards,
};
};

const calculateBattleStats = (player, equippedItems) => {
const base = { LONG: 0, MID: 0, CLOSE: 0, SHIELD: 0, HULL: 0 };
equippedItems.forEach(item => {
const typeId = getTypeId(item.type);
if (base.hasOwnProperty(typeId)) {
base[typeId] += item.power;
}
});

const mult = { LONG: 1, MID: 1, CLOSE: 1, SHIELD: 1, HULL: 1 };
equippedItems.forEach(item => {
if (item.mult) {
const [target, value] = item.mult;
const targetId = getTypeId(target);
if (mult.hasOwnProperty(targetId)) {
mult[targetId] *= value;
}
}
});

if (player.doctrine) {
mult.LONG *= 1.2;
mult.MID *= 1.2;
mult.CLOSE *= 1.2;
}

const final = {
LONG: base.LONG * mult.LONG,
MID: base.MID * mult.MID,
CLOSE: base.CLOSE * mult.CLOSE,
SHIELD: base.SHIELD * mult.SHIELD,
HULL: base.HULL * mult.HULL,
};

equippedItems.forEach(item => {
if (hasAbility(item, AB.SH)) final.SHIELD += getAbilityValue(item);
if (hasAbility(item, AB.OVERDRIVE)) final.SHIELD += 80;
if (hasAbility(item, AB.AM)) {
// ALL_MID: Add value × number of MID weapons
const midCount = equippedItems.filter(i => getTypeId(i.type) === ‘MID’).length;
final.MID += getAbilityValue(item) * midCount;
}

```
// MAVERICK: Double damage if this is the only item of its type
if (hasAbility(item, AB.MV)) {
  const itemTypeId = getTypeId(item.type);
  const sameTypeCount = equippedItems.filter(i => getTypeId(i.type) === itemTypeId).length;
  if (sameTypeCount === 1) {
    // Only this item of this type - double it
    final[itemTypeId] += item.power * mult[itemTypeId];
  }
}
```

});

return { base, mult, final };
};

const runCombat = (player, enemy, equippedItems) => {
const log = [];
const turns = getTurnOrder(player);
const stats = calculateBattleStats(player, equippedItems);

const hasSimultaneous = equippedItems.some(i => hasAbility(i, AB.SIM));
const hasNoRepair = equippedItems.some(i => hasAbility(i, AB.NR));
const hasCapacitor = equippedItems.some(i => hasAbility(i, AB.CAPACITOR));
const hasOverdrive = equippedItems.some(i => hasAbility(i, AB.OVERDRIVE));
const hasBerserker = equippedItems.some(i => hasAbility(i, AB.BERSERKER));
const longCount = equippedItems.filter(i => getTypeId(i.type) === ‘LONG’).length;

let pShield = Math.round(stats.final.SHIELD);
let pHull = Math.round(player.hull);

// Apply OVERDRIVE
if (hasOverdrive) {
pHull = Math.max(1, pHull - 30);
log.push(`緊急過負荷: 耐久値-30 → ${pHull}HP, シールド+80`);
}

// Apply BERSERKER multiplier if hull < 50%
let berserkerMult = 1;
if (hasBerserker && pHull < player.max_hull * 0.5) {
berserkerMult = 1.3;
log.push(`バーサーカー発動: 全ダメージ×1.3`);
}

let eShield = Math.round(enemy.shield);
let eHull = Math.round(enemy.hull);

log.push(`=== ACT ${getAct(player.stage)} | ${UI.label.stage} ${player.stage} | ${enemy.name} ===`);
log.push(`自機: ${pHull}HP | シールド:${pShield}`);
log.push(`敵艦: ${eHull}HP | シールド:${eShield}`);
log.push(`${UI.label.attack}: 長${Math.round(stats.final.LONG * berserkerMult)} 中${Math.round(stats.final.MID * berserkerMult)} 近${Math.round(stats.final.CLOSE * berserkerMult)}`);
log.push(’’);

for (let turn = 0; turn < 6; turn++) {
const range = turns[turn];
log.push(`--- T${turn + 1}: ${getRangeName(range)} ---`);

```
let pDmg = Math.round(stats.final[range] * berserkerMult);
const rangeItems = equippedItems.filter(i => getTypeId(i.type) === range);

if (pDmg > 0) {
  const beforeHull = eHull;

  if (rangeItems.some(i => hasAbility(i, AB.SB))) {
    if (eShield > 0) {
      log.push(`  シールド破壊: 敵シールド ${eShield} → 0`);
      eShield = 0;
    }
  }

  const canLifeSteal = rangeItems.some(i => hasAbility(i, AB.LS)) && eShield === 0;

  const dmgResult = applyDamage(pDmg, eShield, eHull);
  eShield = Math.round(dmgResult.shield);
  eHull = Math.round(dmgResult.hull);
  log.push(`  自機攻撃: ${pDmg}ダメージ → ${beforeHull}HP → ${eHull}HP`);

  if (canLifeSteal) {
    let totalHeal = 0;
    rangeItems.filter(i => hasAbility(i, AB.LS)).forEach(item => {
      const itemMult = stats.mult[range] || 1;
      totalHeal += Math.round(item.power * itemMult * 0.5); // 50% of weapon power
    });
    if (totalHeal > 0) {
      const beforeHeal = pHull;
      pHull = Math.min(player.max_hull, pHull + totalHeal);
      log.push(`  生命吸収: +${totalHeal}HP → ${beforeHeal}HP → ${pHull}HP`);
    }
  }

  const backfireItems = rangeItems.filter(i => hasAbility(i, AB.BF));
  if (backfireItems.length > 0) {
    let totalBackfire = backfireItems.reduce((sum, i) => sum + (getAbilityValue(i) || 0), 0);
    if (totalBackfire > 0) {
      const beforeBackfire = pHull;
      const bfResult = applyDamage(totalBackfire, pShield, pHull);
      pShield = Math.round(bfResult.shield);
      pHull = Math.round(bfResult.hull);
      log.push(`  反動: ${totalBackfire}ダメージ → ${beforeBackfire}HP → ${pHull}HP`);
      if (pHull <= 0) {
        log.push(`  自機撃破（反動）。`);
      }
    }
  }
} else {
  log.push(`  ${getRangeName(range)}武装なし`);
}

if (range === 'LONG' && hasSkill(enemy, SK.CL) && longCount > 0) {
  const counterVal = getSkillValue(enemy, SK.CL);
  const counterDmg = Math.round(counterVal * longCount);
  const beforeCounter = pHull;
  const counterResult = applyDamage(counterDmg, pShield, pHull);
  pShield = Math.round(counterResult.shield);
  pHull = Math.round(counterResult.hull);
  log.push(`  迎撃: ${counterDmg}ダメージ (長距離武装${longCount}基) → ${beforeCounter}HP → ${pHull}HP`);
}

if (!hasSimultaneous && eHull <= 0) {
  log.push(`  敵艦撃破を確認。`);
  log.push('');
  break;
}

if (hasSkill(enemy, SK.REG) && eHull > 0) {
  const regenVal = getSkillValue(enemy, SK.REG);
  const beforeRegen = eHull;
  eHull = Math.min(enemy.hull, eHull + regenVal);
  log.push(`  自己修復: +${regenVal}HP → ${beforeRegen}HP → ${eHull}HP`);
}

if (hasSkill(enemy, SK.DEG)) {
  const degenVal = getSkillValue(enemy, SK.DEG);
  eHull -= degenVal;
  log.push(`  腐食: -${degenVal}HP → ${eHull}HP`);
  if (eHull <= 0) {
    log.push(`  敵艦撃破（腐食）。`);
    log.push('');
    break;
  }
}

let eDmg = enemy.attacks[['LONG', 'MID', 'CLOSE'].indexOf(range)];

if (turn >= 3) {
  if (hasSkill(enemy, SK.OVR)) {
    const ovrVal = getSkillValue(enemy, SK.OVR);
    eDmg = Math.round(eDmg * ovrVal);
    log.push(`  過負荷: 攻撃力 ×${ovrVal}`);
  }
  if (hasSkill(enemy, SK.DOR)) {
    const dorVal = getSkillValue(enemy, SK.DOR);
    eDmg = Math.round(eDmg * dorVal);
    if (dorVal === 0) log.push(`  休眠: 攻撃停止`);
  }
}

// EXPLOSIVE (turn 4) - deals damage then self-destructs
if (turn === 3 && hasSkill(enemy, SK.EXP)) {
  const expVal = getSkillValue(enemy, SK.EXP);
  const beforeExplosion = pHull;
  const expResult = applyDamage(expVal, pShield, pHull);
  pShield = Math.round(expResult.shield);
  pHull = Math.round(expResult.hull);
  log.push(`  自爆: ${expVal}ダメージ → ${beforeExplosion}HP → ${pHull}HP`);
  eHull = 0;
  log.push(`  敵艦自壊`);
  log.push('');
  break;
} else if (eDmg > 0) {
  const beforeEnemyAtk = pHull;
  const eDmgResult = applyDamage(eDmg, pShield, pHull);
  pShield = Math.round(eDmgResult.shield);
  pHull = Math.round(eDmgResult.hull);
  log.push(`  敵艦攻撃: ${eDmg}ダメージ → ${beforeEnemyAtk}HP → ${pHull}HP`);
}

if (hasSkill(enemy, SK.GATE) && eHull > 0) {
  const gateVal = getSkillValue(enemy, SK.GATE);
  if (eShield < gateVal) {
    const beforeGate = eShield;
    eShield = gateVal;
    log.push(`  防壁作動: シールド ${beforeGate} → ${eShield}`);
  }
}

// Check victory/defeat at turn end with Simultaneous
if (hasSimultaneous) {
  if (eHull <= 0 || pHull <= 0) {
    if (eHull <= 0 && pHull <= 0) {
      log.push(`  自機撃破（同時）`);
      log.push(`  敵艦撃破（同時）`);
    } else if (eHull <= 0) {
      log.push(`  敵艦撃破を確認。`);
    } else if (pHull <= 0) {
      log.push(`  自機撃破を確認。`);
    }
    log.push('');
    break;
  }
} else if (pHull <= 0) {
  log.push(`  自機撃破を確認。`);
  log.push('');
  break;
}

log.push('');
```

}

log.push(`=== 戦闘終了 ===`);

return { log, pHull, pShield, eHull, hasNoRepair, hasCapacitor, battleShield: pShield, hullRepair: stats.final.HULL };
};

// Main Component
export default function Game() {
const [scene, setScene] = useState(‘start’);
const [stage, setStage] = useState(1);
const [player, setPlayer] = useState(null);

const startGame = (seed = null) => {
setPlayer(createInitialPlayer(seed));
setScene(‘main’);
};

const advance = (nextScene) => {
setStage(s => s + 1);
setScene(nextScene);
};

const restart = () => {
setStage(1);
setPlayer(null);
setScene(‘start’);
};

const scenes = {
start:  <StartScene onStart={startGame} />,
main:   <MainScene stage={stage} setScene={setScene} />,
combat: <CombatScene player={player} setPlayer={setPlayer} stage={stage} setScene={setScene} advance={advance} />,
reward: <RewardScene player={player} setPlayer={setPlayer} stage={stage} advance={advance} />,
dock:   <DockScene player={player} setPlayer={setPlayer} stage={stage} advance={advance} />,
end:    <EndScene player={player} stage={stage} onRestart={restart} />,
};

return (
<div className="min-h-screen bg-black text-green-400 font-mono p-4">
{scenes[scene]}
</div>
);
}

function StartScene({ onStart }) {
const [seedInput, setSeedInput] = useState(’’);

const handleStart = () => {
const seed = seedInput.trim() !== ‘’ ? parseInt(seedInput, 10) : null;
const validSeed = !isNaN(seed) && seed >= 0 ? seed : null;
onStart(validSeed);
};

return (
<div className="max-w-4xl mx-auto">
<h1 className="text-4xl font-bold mb-6 text-center">STAR CANINE</h1>
<pre className="text-xs mb-6 whitespace-pre-wrap">{STORY.opening}</pre>

```
  <div className="mb-4">
    <label className="block text-sm mb-2">シード (空欄で自動生成):</label>
    <input
      type="text"
      value={seedInput}
      onChange={(e) => setSeedInput(e.target.value)}
      placeholder="例: 12345"
      className="bg-black border border-green-700 text-green-400 px-3 py-2 w-48 font-mono"
    />
  </div>

  <button onClick={handleStart} className="bg-green-700 px-4 py-2 hover:bg-green-600">
    {UI.btn.start}
  </button>
</div>
```

);
}

function MainScene({ stage, setScene }) {
useEffect(() => {
const stageData = getStageData(stage);

```
if (!stageData) {
  setScene('end');
  return;
}

setScene(stageData.rank === 'D' ? 'dock' : 'combat');
```

}, [stage, setScene]);

return (
<div className="text-center">
{UI.label.stage} {stage} 処理中…
</div>
);
}

function CombatScene({ player, setPlayer, stage, setScene, advance }) {
const [phase, setPhase] = useState(‘prep’);
const [log, setLog] = useState([]);
const [result, setResult] = useState(null);

const [tempPlayer, setTempPlayer] = useState(() => {
if (player.logistics) {
return {
…player,
inventory: […player.inventory, createItem(“🚀ランス”, player.itemIdCounter)],
};
}
return { …player };
});

const act = getAct(stage);
const scale = getActScale(act);
const attackScale = getActAttackScale(act);
const stageData = getStageData(stage);
const enemyRank = getEnemyRank(stageData?.rank);
const enemyBase = enemyList.find(e => e.difficulty === stageData?.difficulty && e.rank === enemyRank);

const enemy = useMemo(() => {
if (!enemyBase) return null;
return {
…enemyBase,
hull: Math.round(enemyBase.hull * scale),
shield: Math.round(enemyBase.shield * scale),
attacks: enemyBase.attacks.map(a => Math.round(a * attackScale)),
};
}, [enemyBase, scale, attackScale]);

if (!enemy) return <div>エラー: 敵艦データが見つかりません</div>;

const equippedItems = tempPlayer.inventory.filter(i => tempPlayer.equipped.includes(i.id));
const unequippedItems = tempPlayer.inventory.filter(i => !tempPlayer.equipped.includes(i.id));

// Calculate used slots with COMPACT ability
const hasCompact = equippedItems.some(i => hasAbility(i, AB.COMPACT));
const usedSlots = equippedItems.reduce((sum, i) => {
// COMPACT only affects OTHER items with 2+ slots
if (hasCompact && !hasAbility(i, AB.COMPACT) && i.slots >= 2) {
return sum + 1;
}
return sum + i.slots;
}, 0);

const toggleEquip = (item) => {
const isEquipped = tempPlayer.equipped.includes(item.id);
if (isEquipped) {
setTempPlayer({
…tempPlayer,
equipped: tempPlayer.equipped.filter(id => id !== item.id),
});
} else {
// Check if COMPACT is equipped
const willHaveCompact = hasAbility(item, AB.COMPACT) || equippedItems.some(i => hasAbility(i, AB.COMPACT));
// COMPACT only compresses OTHER items with 2+ slots
const itemSlots = willHaveCompact && !hasAbility(item, AB.COMPACT) && item.slots >= 2 ? 1 : item.slots;

```
  if (usedSlots + itemSlots <= tempPlayer.max_slots) {
    setTempPlayer({
      ...tempPlayer,
      equipped: [...tempPlayer.equipped, item.id],
    });
  }
}
```

};

const preview = useMemo(() => {
const stats = calculateBattleStats(tempPlayer, equippedItems);

```
// Apply BERSERKER if conditions met
let berserkerMult = 1;
const hasBerserker = equippedItems.some(i => hasAbility(i, AB.BERSERKER));
if (hasBerserker && tempPlayer.hull < tempPlayer.max_hull * 0.5) {
  berserkerMult = 1.3;
}

return {
  long: Math.round(stats.final.LONG * berserkerMult),
  mid: Math.round(stats.final.MID * berserkerMult),
  close: Math.round(stats.final.CLOSE * berserkerMult),
  shield: Math.round(stats.final.SHIELD),
  berserkerActive: berserkerMult > 1,
};
```

}, [tempPlayer, equippedItems]);

// Simplified prediction - intentionally imperfect per spec
const prediction = useMemo(() => {
const turns = getTurnOrder(tempPlayer);
const hasSimultaneous = equippedItems.some(i => hasAbility(i, AB.SIM));
let simHull = Math.round(tempPlayer.hull);
let simShield = Math.round(preview.shield);
let simEnemyHull = Math.round(enemy.hull);
let simEnemyShield = Math.round(enemy.shield);

```
// Apply OVERDRIVE to player hull
const hasOverdrive = equippedItems.some(i => hasAbility(i, AB.OVERDRIVE));
if (hasOverdrive) {
  simHull = Math.max(1, simHull - 30);
}

let totalDamageDealt = 0;
let totalDamageTaken = 0;

for (let turn = 0; turn < 6; turn++) {
  const range = turns[turn];
  let pDmg = preview[range.toLowerCase()] || 0;
  
  // Apply player damage to enemy
  if (pDmg > 0) {
    const toShield = Math.min(simEnemyShield, pDmg);
    simEnemyShield = Math.max(0, simEnemyShield - pDmg);
    simEnemyHull = Math.max(0, simEnemyHull - (pDmg - toShield));
    totalDamageDealt += pDmg;
  }
  
  // Check if enemy is defeated (without SIMULTANEOUS)
  if (!hasSimultaneous && simEnemyHull <= 0) {
    return { 
      type: 'victory', 
      turn: turn + 1, 
      damageDealt: totalDamageDealt, 
      damageTaken: totalDamageTaken 
    };
  }
  
  // Enemy regen
  if (hasSkill(enemy, SK.REG)) {
    const regenVal = getSkillValue(enemy, SK.REG);
    simEnemyHull = Math.min(enemy.hull, simEnemyHull + regenVal);
  }
  
  // Enemy degen
  if (hasSkill(enemy, SK.DEG)) {
    const degenVal = getSkillValue(enemy, SK.DEG);
    simEnemyHull -= degenVal;
    if (simEnemyHull <= 0) {
      return { 
        type: 'victory', 
        turn: turn + 1, 
        damageDealt: totalDamageDealt, 
        damageTaken: totalDamageTaken 
      };
    }
  }
  
  // Enemy gate
  if (hasSkill(enemy, SK.GATE)) {
    const gateVal = getSkillValue(enemy, SK.GATE);
    if (simEnemyShield < gateVal) {
      simEnemyShield = gateVal;
    }
  }
  
  // Calculate enemy damage
  let eDmg = enemy.attacks[['LONG', 'MID', 'CLOSE'].indexOf(range)];
  
  // Apply OVERLOAD/DORMANT (turn 4+)
  if (turn >= 3 && hasSkill(enemy, SK.OVR)) {
    const ovrVal = getSkillValue(enemy, SK.OVR);
    eDmg = Math.round(eDmg * ovrVal);
  }
  if (turn >= 3 && hasSkill(enemy, SK.DOR)) {
    const dorVal = getSkillValue(enemy, SK.DOR);
    eDmg = Math.round(eDmg * dorVal);
  }
  
  // EXPLOSIVE (turn 4)
  if (turn === 3 && hasSkill(enemy, SK.EXP)) {
    const expVal = getSkillValue(enemy, SK.EXP);
    eDmg = expVal;
  }
  
  // Apply damage to player
  if (eDmg > 0) {
    const toShield = Math.min(simShield, eDmg);
    simShield = Math.max(0, simShield - eDmg);
    simHull = Math.max(0, simHull - (eDmg - toShield));
    totalDamageTaken += eDmg;
  }
  
  // With SIMULTANEOUS: check both deaths at turn end
  if (hasSimultaneous) {
    if (simEnemyHull <= 0 && simHull <= 0) {
      // Both dead - defeat (player must survive)
      return { 
        type: 'defeat', 
        turn: turn + 1, 
        damageDealt: totalDamageDealt, 
        damageTaken: totalDamageTaken 
      };
    } else if (simEnemyHull <= 0) {
      // Only enemy dead - victory
      return { 
        type: 'victory', 
        turn: turn + 1, 
        damageDealt: totalDamageDealt, 
        damageTaken: totalDamageTaken 
      };
    } else if (simHull <= 0) {
      // Only player dead - defeat
      return { 
        type: 'defeat', 
        turn: turn + 1, 
        damageDealt: totalDamageDealt, 
        damageTaken: totalDamageTaken 
      };
    }
  } else {
    // Without SIMULTANEOUS: check player death
    if (simHull <= 0) {
      return { 
        type: 'defeat', 
        turn: turn + 1, 
        damageDealt: totalDamageDealt, 
        damageTaken: totalDamageTaken 
      };
    }
  }
}

// Survived all turns
return { 
  type: simEnemyHull > 0 ? 'draw' : 'victory', 
  turn: 6, 
  damageDealt: totalDamageDealt, 
  damageTaken: totalDamageTaken 
};
```

}, [tempPlayer, preview, enemy, equippedItems]);

const startCombat = () => {
setPlayer(tempPlayer);

```
const combatResult = runCombat(
  { ...tempPlayer, stage },
  enemy,
  equippedItems
);

let newInventory = tempPlayer.inventory.filter(i => 
  !(tempPlayer.equipped.includes(i.id) && i.disposable)
);

newInventory.forEach(item => {
  if (tempPlayer.equipped.includes(item.id) && hasAbility(item, AB.GR)) {
    const growthVal = getAbilityValue(item);
    item.power += growthVal;
    combatResult.log.push(`${item.name} 成長: +${growthVal} → ${item.power}`);
  }
});

let finalHull = combatResult.pHull;
if (finalHull > 0 && !combatResult.hasNoRepair) {
  const baseRepair = Math.round(combatResult.hullRepair);
  let totalRepair = baseRepair;
  const repairParts = [];
  
  if (baseRepair > 0) {
    repairParts.push(`耐久補助+${baseRepair}`);
  }
  
  // Add CAPACITOR repair
  if (combatResult.hasCapacitor && combatResult.battleShield > 0) {
    const capacitorRepair = Math.floor(combatResult.battleShield * 0.3); // 30% conversion
    totalRepair += capacitorRepair;
    combatResult.log.push(`キャパシタ蓄積: シールド${combatResult.battleShield} → +${capacitorRepair}HP回復`);
    repairParts.push(`キャパシタ+${capacitorRepair}`);
  }
  
  if (totalRepair > 0) {
    finalHull = Math.min(tempPlayer.max_hull, finalHull + totalRepair);
    combatResult.log.push(`戦闘後処理: ${repairParts.join(', ')} = +${totalRepair}HP回復 → ${finalHull}HP`);
  }
}

const newEquipped = tempPlayer.equipped.filter(id => newInventory.some(i => i.id === id));
setPlayer({
  ...tempPlayer,
  hull: finalHull,
  inventory: newInventory,
  equipped: newEquipped,
});

let combatOutcome = 'defeat';
if (stage === 36 && combatResult.eHull <= 0 && finalHull > 0) {
  combatOutcome = 'clear';
} else if (combatResult.eHull <= 0 && finalHull > 0) {
  combatOutcome = 'victory';
} else if (finalHull <= 0) {
  combatOutcome = 'defeat';
} else if (enemy.rank === R.B) {
  combatOutcome = 'defeat';
} else {
  combatOutcome = 'draw';
}

setLog(combatResult.log);
setResult(combatOutcome);
setPhase('battle');
```

};

const handleContinue = () => {
if (result === ‘clear’ || result === ‘defeat’) {
setScene(‘end’);
} else if (result === ‘victory’) {
setScene(‘reward’);
} else {
advance(‘main’);
}
};

const activeBonuses = [
tempPlayer.boarding && ‘白兵戦’,
tempPlayer.skirmish && ‘遭遇戦’,
tempPlayer.logistics && ‘兵站’,
tempPlayer.doctrine && ‘教義’,
].filter(Boolean);

if (phase === ‘prep’) {
return (
<div className="max-w-6xl mx-auto">
<h2 className="text-xl mb-2">{UI.label.stage} {stage} | {UI.label.act} {act}</h2>
<div className="text-xs text-green-600 mb-2">{VERSION} シード: {tempPlayer.seed}</div>

```
    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
      <div>
        <div className="font-bold">スターキャナイン</div>
        <div>{UI.label.hull}: {Math.round(tempPlayer.hull)}/{tempPlayer.max_hull}</div>
        <div>{UI.label.slots}: {usedSlots}/{tempPlayer.max_slots}</div>
        {activeBonuses.length > 0 && (
          <div className="text-xs mt-1">{UI.label.bossReward}: {activeBonuses.join(' ')}</div>
        )}
        <div className="mt-2 p-2 bg-green-900 bg-opacity-30 border border-green-700">
          <div className="font-bold mb-1">{UI.label.preview}:</div>
          <div className="text-xs">{UI.label.long}: {preview.long}</div>
          <div className="text-xs">{UI.label.mid}: {preview.mid}</div>
          <div className="text-xs">{UI.label.close}: {preview.close}</div>
          <div className="text-xs">{UI.label.shield}: {preview.shield}</div>
          {preview.berserkerActive && (
            <div className="text-xs text-yellow-400 mt-1">バーサーカー発動中</div>
          )}
        </div>
      </div>
      
      <div>
        <div className="font-bold">{enemy.name} ({RANK[enemy.rank]})</div>
        <div>HP:{enemy.hull} {UI.label.shield}:{enemy.shield}</div>
        <div>{UI.label.attack}: 長{enemy.attacks[0]} 中{enemy.attacks[1]} 近{enemy.attacks[2]}</div>
        {enemy.skills.length > 0 && (
          <div className="text-xs mt-1">
            {enemy.skills.map(([sk, val], i) => (
              <div key={i}>【{sk.name}: {val}】{sk.desc}</div>
            ))}
          </div>
        )}
        
        {/* Prediction Display - only show if victory or defeat */}
        {(prediction.type === 'victory' || prediction.type === 'defeat') && (
          <div className="mt-2 p-2 bg-opacity-30 border text-xs space-y-1"
               style={{
                 backgroundColor: prediction.type === 'victory' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                 borderColor: prediction.type === 'victory' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
               }}>
            <div className={`font-bold ${prediction.type === 'victory' ? 'text-green-400' : 'text-red-400'}`}>
              {prediction.type === 'victory' 
                ? `簡易予測 ✓ T${prediction.turn}で撃破`
                : `簡易予測 ⚠️ T${prediction.turn}で沈没`}
            </div>
            <div>与ダメージ量: {prediction.damageDealt}</div>
            <div>被ダメージ量: {prediction.damageTaken}</div>
          </div>
        )}
      </div>
    </div>

    <div className="mb-4">
      <div className="font-bold mb-2">{UI.label.equipped} ({usedSlots}/{tempPlayer.max_slots})</div>
      {equippedItems.map(item => (
        <ItemRow key={item.id} item={item} equipped onClick={() => toggleEquip(item)} hasCompact={hasCompact} />
      ))}
    </div>

    <div className="mb-4">
      <div className="font-bold mb-2">{UI.label.inventory}</div>
      {unequippedItems.map(item => (
        <ItemRow key={item.id} item={item} onClick={() => toggleEquip(item)} hasCompact={hasCompact} />
      ))}
    </div>

    <button onClick={startCombat} className="bg-red-700 px-4 py-2 hover:bg-red-600">
      {UI.btn.engage}
    </button>

    {/* DEBUG: Show all stage rewards */}
    <div className="mt-8 p-4 bg-gray-900 border border-yellow-600 text-xs">
      <div className="text-yellow-400 font-bold mb-2">🔧 DEBUG: Pre-allocated Stage Rewards (All 36 Stages)</div>
      <div className="max-h-96 overflow-y-auto">
        {tempPlayer.stageRewards ? (
          (() => {
            const allStages = [];
            for (let i = 1; i <= 36; i++) {
              const stageData = getStageData(i);
              if (stageData?.rank === 'D') {
                allStages.push(
                  <div key={i} className="mb-1 text-gray-500">
                    <span className="text-gray-600">S{i}:</span> [DOCK - no rewards]
                  </div>
                );
              } else if (tempPlayer.stageRewards[i]) {
                const enemyRank = getEnemyRank(stageData.rank);
                const stageColor = enemyRank === R.B ? 'text-orange-400' : 
                                  enemyRank === R.E ? 'text-yellow-400' : 
                                  'text-green-400';
                const labelColor = enemyRank === R.B ? 'text-orange-600' : 
                                  enemyRank === R.E ? 'text-yellow-600' : 
                                  'text-green-600';
                
                allStages.push(
                  <div key={i} className={`mb-1 ${stageColor}`}>
                    <span className={labelColor}>S{i}:</span> {tempPlayer.stageRewards[i].map(item => {
                      const itemColor = item.rarity === 3 ? 'text-orange-400' : 
                                       item.rarity === 2 ? 'text-yellow-400' : 
                                       'text-green-400';
                      return <span key={item.name} className={itemColor}>{item.name}, </span>;
                    })}
                  </div>
                );
              } else {
                allStages.push(
                  <div key={i} className="mb-1 text-red-400">
                    <span className="text-red-600">S{i}:</span> MISSING
                  </div>
                );
              }
            }
            return allStages;
          })()
        ) : (
          <div className="text-red-400">stageRewards not initialized (using old system)</div>
        )}
      </div>
    </div>
  </div>
);
```

}

return (
<div className="max-w-4xl mx-auto">
<pre className="text-xs mb-4 whitespace-pre-wrap h-96 overflow-y-auto bg-black border border-green-700 p-2">{log.join(’\n’)}</pre>

```
  {result && (
    <div className="mb-4 text-center text-xl">
      {UI.result[result]}
    </div>
  )}
  
  <button onClick={handleContinue} className="bg-green-700 px-4 py-2 hover:bg-green-600">
    {UI.btn.continue}
  </button>
</div>
```

);
}

function RewardScene({ player, setPlayer, stage, advance }) {
const act = getAct(stage);
const stageData = getStageData(stage);
const enemyRank = getEnemyRank(stageData?.rank);
const isBoss = enemyRank === R.B;

// Get pre-allocated rewards for this stage
const drawnItems = player.stageRewards?.[stage] || [];

// Consume boss rewards at scene entry
const availableBossRewards = useMemo(() => {
if (isBoss && act <= 2 && player.bossRewards.length > 0) {
return player.bossRewards.slice(0, Math.min(3, player.bossRewards.length));
}
return [];
}, [isBoss, act, player.bossRewards]);

const [selectedItem, setSelectedItem] = useState(null);
const [selectedBonus, setSelectedBonus] = useState(null);

const activeBonuses = [
player.boarding && ‘白兵戦’,
player.skirmish && ‘遭遇戦’,
player.logistics && ‘兵站’,
player.doctrine && ‘教義’,
].filter(Boolean);

const claim = () => {
const newPlayer = { …player };

```
// Add selected item to inventory
if (selectedItem) {
  newPlayer.inventory = [...player.inventory, createItem(selectedItem, player.itemIdCounter)];
}

// No need to update decks - rewards were pre-allocated at game start

if (isBoss) {
  newPlayer.hull = newPlayer.max_hull;

  // Remove all 3 shown boss rewards from the pool
  newPlayer.bossRewards = player.bossRewards.slice(availableBossRewards.length);

  if (selectedBonus) {
    switch (selectedBonus) {
      case 'expansion':
        newPlayer.max_slots += 2;
        break;
      case 'reinforcement':
        newPlayer.max_slots += 1;
        newPlayer.max_hull += 50;
        newPlayer.hull += 50;
        break;
      case 'boarding':
        newPlayer.max_slots += 1;
        newPlayer.boarding = true;
        break;
      case 'skirmish':
        newPlayer.max_slots += 1;
        newPlayer.skirmish = true;
        break;
      case 'logistics':
        newPlayer.logistics = true;
        break;
      case 'doctrine':
        newPlayer.max_hull += 60;
        newPlayer.hull += 60;
        newPlayer.doctrine = true;
        break;
    }
  }
}

setPlayer(newPlayer);
advance('main');
```

};

const canClaim = selectedItem && (!isBoss || !availableBossRewards.length || selectedBonus);

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-xl mb-2">{UI.label.reward}</h2>
<div className="text-xs text-green-600 mb-4">{VERSION} シード: {player.seed}</div>

```
  <div className="mb-4">
    <div className="font-bold mb-2">1つ選択:</div>
    {drawnItems.map(item => {
      const parts = [
        item.name,
        getTypeName(item.type),
      ];
      if (item.power > 0) parts.push(`威力:${item.power}`);
      if (item.disposable) parts.push('💥');
      if (item.mult) parts.push(formatMult(item.mult));
      if (item.ability) parts.push(formatAbility(item.ability));

      const rarityColors = {
        0: 'text-green-400',
        1: 'text-green-400',
        2: 'text-yellow-400',
        3: 'text-orange-400',
      };
      const textColor = rarityColors[item.rarity] || 'text-green-400';

      return (
        <div
          key={item.name}
          className={`text-xs cursor-pointer hover:bg-green-900 mb-1 ${textColor}`}
          onClick={() => setSelectedItem(item.name)}
        >
          {selectedItem === item.name ? '✓' : '○'} [{item.slots}] {parts.join(' ')}
        </div>
      );
    })}
  </div>

  {isBoss && availableBossRewards.length > 0 && (
    <div className="mb-4">
      <div className="font-bold mb-2">{UI.label.bossReward}:</div>
      {availableBossRewards.map(id => (
        <div
          key={id}
          className="text-sm cursor-pointer hover:bg-green-900 mb-1"
          onClick={() => setSelectedBonus(id)}
        >
          {selectedBonus === id ? '✓' : '○'} 【{BR[id].name}】{BR[id].desc}
        </div>
      ))}
    </div>
  )}

  <button
    onClick={claim}
    disabled={!canClaim}
    className={`px-4 py-2 mb-4 ${canClaim ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700 cursor-not-allowed'}`}
  >
    {UI.btn.claim}
  </button>

  <div className="mt-4 p-3 bg-green-900 bg-opacity-30 border border-green-700 text-sm">
    <div className="font-bold mb-2">スターキャナイン - 現在の状態</div>
    <div className="grid grid-cols-3 gap-2 mb-3">
      <div>{UI.label.hull}: {Math.round(player.hull)}/{player.max_hull}</div>
      <div>{UI.label.slots}: {player.max_slots}</div>
      {activeBonuses.length > 0 && (
        <div className="text-xs">{UI.label.bossReward}: {activeBonuses.join(' ')}</div>
      )}
    </div>
    
    <div className="font-bold mb-1">{UI.label.inventory} ({player.inventory.length}個):</div>
    {player.inventory.map(item => (
      <div key={item.id} className="text-xs mb-1">
        <span className="text-green-600">[{item.slots}]</span> {item.name} | {getTypeName(item.type)} {UI.label.power}:{item.power}{item.disposable ? ' 💥' : ''}{item.mult ? ' ' + formatMult(item.mult) : ''}{item.ability ? ' ' + formatAbility(item.ability) : ''}
      </div>
    ))}
  </div>
</div>
```

);
}

function DockScene({ player, setPlayer, stage, advance }) {
const act = getAct(stage);
const scrapCost = act;
const canRepair = player.inventory.length >= scrapCost;
const [repairScrapItems, setRepairScrapItems] = useState([]);
const [upgradeScrapItems, setUpgradeScrapItems] = useState([]);
const [selectedUpgradeItem, setSelectedUpgradeItem] = useState(null);

// Filter items that can be upgraded
const upgradeableItems = player.inventory.filter(item => {
// Can’t upgrade if already upgraded
if (item.upgraded) return false;
// Can’t upgrade zero-power items
if (item.power === 0) return false;
// Can’t upgrade scrap
if (item.name.includes(‘スクラップ’)) return false;
return true;
});

const canUpgrade = upgradeScrapItems.length === scrapCost && selectedUpgradeItem;

const toggleRepairScrap = (itemId) => {
if (repairScrapItems.includes(itemId)) {
setRepairScrapItems(repairScrapItems.filter(id => id !== itemId));
} else if (repairScrapItems.length < scrapCost) {
setRepairScrapItems([…repairScrapItems, itemId]);
}
};

const toggleUpgradeScrap = (itemId) => {
if (upgradeScrapItems.includes(itemId)) {
setUpgradeScrapItems(upgradeScrapItems.filter(id => id !== itemId));
} else if (upgradeScrapItems.length < scrapCost) {
setUpgradeScrapItems([…upgradeScrapItems, itemId]);
}
};

const handleRepair = () => {
if (repairScrapItems.length !== scrapCost) return;

```
const repair = Math.floor(player.max_hull * 0.3);
const newInventory = player.inventory.filter(i => !repairScrapItems.includes(i.id));

setPlayer({
  ...player,
  hull: Math.min(player.max_hull, player.hull + repair),
  inventory: newInventory,
  equipped: player.equipped.filter(id => newInventory.some(i => i.id === id)),
});
advance('main');
```

};

const handleUpgrade = () => {
if (!canUpgrade) return;

```
const newInventory = player.inventory.map(item => {
  if (item.id === selectedUpgradeItem) {
    const upgradedItem = { ...item };
    
    // Add + prefix to name if not already there
    if (!upgradedItem.name.endsWith('+')) {
      upgradedItem.name = upgradedItem.name + '+';
    }
    
    // Upgrade logic
    if (hasAbility(item, AB.GR)) {
      // Growth items: increment growth value
      const currentValue = getAbilityValue(item);
      upgradedItem.ability = [AB.GR, currentValue + 1];
    } else {
      // Regular items: power × 1.2 (rounded up)
      upgradedItem.power = Math.ceil(item.power * 1.2);
    }
    
    upgradedItem.upgraded = true;
    return upgradedItem;
  }
  return item;
}).filter(i => !upgradeScrapItems.includes(i.id));

setPlayer({
  ...player,
  inventory: newInventory,
  equipped: player.equipped.filter(id => newInventory.some(i => i.id === id)),
});
advance('main');
```

};

const handleFabricate = () => {
setPlayer({
…player,
max_hull: player.max_hull - 10,
hull: Math.max(1, player.hull - 10),
inventory: […player.inventory, createItem(“🚀ランス”, player.itemIdCounter)],
});
advance(‘main’);
};

const handleLeave = () => advance(‘main’);

const activeBonuses = [
player.boarding && ‘白兵戦’,
player.skirmish && ‘遭遇戦’,
player.logistics && ‘兵站’,
player.doctrine && ‘教義’,
].filter(Boolean);

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-xl mb-2">{UI.dock.title}</h2>
<div className="text-xs text-green-600 mb-4">{VERSION} シード: {player.seed}</div>

```
  <div className="mb-4 text-sm">
    <div className="font-bold mb-2">スターキャナイン</div>
    <div>{UI.label.hull}: {Math.round(player.hull)}/{player.max_hull}</div>
    <div>{UI.label.slots}: {player.max_slots}</div>
    {activeBonuses.length > 0 && (
      <div className="text-xs mt-1">{UI.label.bossReward}: {activeBonuses.join(' ')}</div>
    )}
  </div>

  <div className="mb-6 space-y-4">
    <div className="border border-green-700 p-3">
      <div className="font-bold mb-2">1. {UI.dock.repair.title}</div>
      <div className="text-sm mb-2">{UI.dock.repair.desc(scrapCost)}</div>
      {canRepair ? (
        <>
          <div className="text-xs mb-2">廃棄するアイテムを{scrapCost}個選択:</div>
          {player.inventory.map(item => (
            <div
              key={item.id}
              className={`text-xs mb-1 cursor-pointer hover:bg-green-900 ${repairScrapItems.includes(item.id) ? 'bg-red-900' : ''}`}
              onClick={() => toggleRepairScrap(item.id)}
            >
              {repairScrapItems.includes(item.id) ? '✗' : '○'} {item.name} | {getTypeName(item.type)} {UI.label.power}:{item.power}
            </div>
          ))}
          <button
            onClick={handleRepair}
            disabled={repairScrapItems.length !== scrapCost}
            className={`mt-2 px-4 py-2 ${repairScrapItems.length === scrapCost ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700 cursor-not-allowed'}`}
          >
            {UI.btn.repair} (+{Math.floor(player.max_hull * 0.3)}HP)
          </button>
        </>
      ) : (
        <div className="text-sm text-gray-500">アイテム不足（必要: {scrapCost}個）</div>
      )}
    </div>

    <div className="border border-green-700 p-3">
      <div className="font-bold mb-2">2. 装備強化</div>
      <div className="text-sm mb-2">アイテムを{scrapCost}個廃棄して、1つの装備を強化する</div>
      {upgradeableItems.length > 0 ? (
        <>
          <div className="text-xs mb-2">廃棄するアイテムを{scrapCost}個選択:</div>
          {player.inventory.map(item => (
            <div
              key={item.id}
              className={`text-xs mb-1 cursor-pointer hover:bg-green-900 ${upgradeScrapItems.includes(item.id) ? 'bg-red-900' : ''}`}
              onClick={() => toggleUpgradeScrap(item.id)}
            >
              {upgradeScrapItems.includes(item.id) ? '✗' : '○'} {item.name} | {getTypeName(item.type)} {UI.label.power}:{item.power}
            </div>
          ))}
          <div className="text-xs mt-2 mb-2">強化する装備を選択:</div>
          {upgradeableItems.map(item => {
            const previewPower = hasAbility(item, AB.GR) 
              ? `成長+${getAbilityValue(item)} → +${getAbilityValue(item) + 1}`
              : `威力${item.power} → ${Math.ceil(item.power * 1.2)}`;
            
            return (
              <div
                key={item.id}
                className={`text-xs mb-1 cursor-pointer hover:bg-green-900 ${selectedUpgradeItem === item.id ? 'bg-blue-900' : ''}`}
                onClick={() => setSelectedUpgradeItem(item.id)}
              >
                {selectedUpgradeItem === item.id ? '▶' : '○'} {item.name} ({previewPower})
              </div>
            );
          })}
          <button
            onClick={handleUpgrade}
            disabled={!canUpgrade}
            className={`mt-2 px-4 py-2 ${canUpgrade ? 'bg-blue-700 hover:bg-blue-600' : 'bg-gray-700 cursor-not-allowed'}`}
          >
            強化
          </button>
        </>
      ) : (
        <div className="text-sm text-gray-500">強化可能な装備なし</div>
      )}
    </div>

    <div className="border border-green-700 p-3">
      <div className="font-bold mb-2">3. {UI.dock.fabricate.title}</div>
      <div className="text-sm mb-2">{UI.dock.fabricate.desc}</div>
      <button onClick={handleFabricate} className="bg-yellow-700 px-4 py-2 hover:bg-yellow-600">
        {UI.btn.fabricate} (−10 最大HP)
      </button>
    </div>

    <div className="border border-green-700 p-3">
      <div className="font-bold mb-2">4. {UI.dock.leave.title}</div>
      <div className="text-sm mb-2">{UI.dock.leave.desc}</div>
      <button onClick={handleLeave} className="bg-green-700 px-4 py-2 hover:bg-green-600">
        {UI.btn.leave}
      </button>
    </div>
  </div>
</div>
```

);
}

function EndScene({ player, stage, onRestart }) {
const cleared = stage >= 36 && player.hull > 0;

const activeBonuses = [
player.boarding && ‘白兵戦’,
player.skirmish && ‘遭遇戦’,
player.logistics && ‘兵站’,
player.doctrine && ‘教義’,
].filter(Boolean);

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-2xl mb-4 text-center">
{cleared ? UI.result.clear : STORY.defeat}
</h2>

```
  {cleared && (
    <pre className="text-xs mb-4 whitespace-pre-wrap text-center">{STORY.victory}</pre>
  )}

  {!cleared && (
    <div className="mb-4 text-center">{UI.label.stage}: {stage}</div>
  )}

  <div className="mb-4 text-center text-green-600">
    <span className="text-xs">シード: </span>
    <span className="font-bold">{player.seed}</span>
  </div>

  <div className="mb-6 text-sm border border-green-700 p-4">
    <div className="font-bold mb-2 text-center">スターキャナイン - 最終状態</div>
    <div className="mb-2">{UI.label.hull}: {Math.round(player.hull)}/{player.max_hull}</div>
    <div className="mb-2">{UI.label.slots}: {player.max_slots}</div>
    {activeBonuses.length > 0 && (
      <div className="mb-3 text-xs">{UI.label.bossReward}: {activeBonuses.join(' ')}</div>
    )}

    <div className="font-bold mb-2">{UI.label.inventory} ({player.inventory.length}個):</div>
    {player.inventory.map(item => (
      <ItemRow key={item.id} item={item} />
    ))}
  </div>

  <div className="text-center">
    <button onClick={onRestart} className="bg-green-700 px-4 py-2 hover:bg-green-600">
      {UI.btn.restart}
    </button>
  </div>
</div>
```

);
}

function ItemRow({ item, equipped = false, onClick, showId = false, hasCompact = false }) {
const parts = [
item.name,
getTypeName(item.type),
];

// Only show power if it’s not 0
if (item.power > 0) {
parts.push(`${UI.label.power}:${item.power}`);
}

if (item.disposable) parts.push(‘💥’);
if (item.mult) parts.push(formatMult(item.mult));
if (item.ability) parts.push(formatAbility(item.ability));

const rarityColors = {
0: ‘text-green-400’,
1: ‘text-green-400’,
2: ‘text-yellow-400’,
3: ‘text-orange-400’,
};
const textColor = rarityColors[item.rarity] || ‘text-green-400’;

// Display effective slot count - COMPACT only affects OTHER items with 2+ slots
const displaySlots = hasCompact && !hasAbility(item, AB.COMPACT) && item.slots >= 2 ? 1 : item.slots;

return (
<div
className={`text-xs mb-1 ${textColor} ${onClick ? 'cursor-pointer hover:bg-green-900' : ''}`}
onClick={onClick}
>
{equipped && ’✓ ‘}[{displaySlots}] {parts.join(’ ’)}
</div>
);
}