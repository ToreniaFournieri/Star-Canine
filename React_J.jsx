import React, { useState, useEffect, useMemo } from ‘react’;

// Constants & Type Definitions
const R = { N: ‘NORMAL’, E: ‘ELITE’, B: ‘BOSS’ };
const T = {
L: { id: ‘LONG’,   name: ‘長距離武装’ },
M: { id: ‘MID’,    name: ‘中距離武装’ },
C: { id: ‘CLOSE’,  name: ‘近距離武装’ },
S: { id: ‘SHIELD’, name: ‘シールド’ },
H: { id: ‘HULL’,   name: ‘耐久補助’ },
X: { id: ‘MODULE’, name: ‘モジュール’ },
};

const RANGE = { LONG: ‘長距離’, MID: ‘中距離’, CLOSE: ‘近距離’ };
const RANK  = { NORMAL: ‘通常’, ELITE: ‘エリート’, BOSS: ‘ボス’ };

const SK = {
GATE: { id: ‘GATE’,     name: ‘防壁’,   desc: “ターン終了時、シールドを指定値まで再生成する。” },
REG:  { id: ‘REGEN’,    name: ‘自己修復’, desc: “毎ターン、耐久値を回復する。” },
DEG:  { id: ‘DEGEN’,    name: ‘腐食’,   desc: “毎ターン、耐久値が減少する。” },
EXP:  { id: ‘EXPLOSIVE’, name: ‘自爆’,  desc: “第4ターンに固定ダメージの自爆攻撃を行い、自壊する。” },
OVR:  { id: ‘OVERLOAD’, name: ‘過負荷’, desc: “第4ターン以降、攻撃ダメージが上昇する。” },
DOR:  { id: ‘DORMANT’,  name: ‘休眠’,   desc: “第4ターン以降、攻撃を停止する。” },
CL:   { id: ‘COUNTER_LONG’, name: ‘迎撃’, desc: “長距離攻撃を受けた際、長距離武装数×指定値で反撃する。” },
};

const AB = {
SH:  { id: ‘SHIELD’,      name: ‘シールド加算’, format: (v) => `+${v}シールド` },
AM:  { id: ‘ALL_MID’,     name: ‘中距離強化’,   format: (v) => `中距離+${v}` },
SIM: { id: ‘SIMULTANEOUS’, name: ‘同時攻撃’,    format: () => ‘同時攻撃’ },
NR:  { id: ‘NO_REPAIR’,   name: ‘修復無効’,     format: () => ‘修復無効’ },
LS:  { id: ‘LIFE_STEAL’,  name: ‘生命吸収’,     format: () => ‘生命吸収’ },
GR:  { id: ‘GROWTH’,      name: ‘成長’,         format: (v) => `成長+${v}` },
SB:  { id: ‘SHIELD_BREAK’, name: ‘シールド破壊’, format: () => ‘シールド破壊’ },
BF:  { id: ‘BACKFIRE’,    name: ‘反動’,         format: (v) => `反動${v}` },
};

const BR = {
expansion:     { name: ‘拡張’,   desc: “装備スロット最大値+2。” },
reinforcement: { name: ‘強化’,   desc: “装備スロット最大値+1、耐久値最大値+50。” },
boarding:      { name: ‘白兵戦’, desc: “装備スロット最大値+1。第5・第6ターンを近距離に固定。” },
skirmish:      { name: ‘遭遇戦’, desc: “装備スロット最大値+1。第4ターンを中距離に変更。” },
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
stage: ‘ステージ’, act: ‘ACT’, hull: ‘耐久値’, shield: ‘シールド’,
slots: ‘スロット’, power: ‘威力’, attack: ‘攻撃力’,
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
opening: `> 遭難信号を受信。

> 送信元: LAIKA

「私よ。
K9が陥落した。
ソーラー・ベアが惑星を奪った。
私も捕らえられた。
あなたがここにいなかったことは知っている。

どうか…死なないで。」

> 信号途絶。

> K9へ航路設定中。`,   victory: `K9軌道を制圧。
> LAIKAを救出。

「帰ってきてくれたのね。」`,
defeat: ‘信号途絶’,
};

const EQ = [
[1, “🗑️ スクラップ”, 0, T.X, 0, 0, null, null],
[1, “🚀 ランス”, 40, T.L, 1, 1, null, null],
[2, “🚀🛡️ インターセプター”, 50, T.L, 1, 1, null, [AB.SH, 10]],
[2, “🚀❗ ハープーン”, 71, T.L, 1, 1, null, [AB.BF, 10]],
[2, “🚀⚠️ アイソレーション”, 75, T.L, 1, 1, [T.L, 0.9], null],
[2, “🚀 ジャベリン”, 60, T.L, 1, 1, null, null],
[1, “🚀 🚀 シューティングスター”, 65, T.L, 2, 1, null, null],
[2, “🚀⚠️ サイレント”, 90, T.L, 2, 1, [T.M, 0.0], null],
[1, “🚀 🚀 🔺 ギャンビット”, 50, T.L, 2, 1, [T.L, 1.3], null],
[3, “🚀 🚀 🚀MOP”, 100, T.L, 2, 1, null, null],
[1, “🔫 クァンタム・ディスプレーサー”, 30, T.L, 3, 0, [T.C, 0.5], null],
[1, “✈️ ドローン”, 12, T.M, 1, 0, null, null],
[1, “✈️⚠️ スカベンジャー”, 20, T.M, 1, 0, [T.M, 0.9], null],
[1, “✈️⤴️ ルーキー・ファイター”, 5, T.M, 1, 0, null, [AB.GR, 2]],
[1, “✈️✈️ ブルーウルフ”, 20, T.M, 2, 0, null, null],
[1, “✈️🔺 スクアドラル”, 12, T.M, 2, 0, null, [AB.AM, 10]],
[1, “⚡ クロウ”, 15, T.C, 1, 0, null, null],
[1, “⚡🩸 ファング”, 10, T.C, 1, 0, null, [AB.LS]],
[1, “⚡🛡️ アイアン・ビーム”, 12, T.C, 1, 0, null, [AB.SH, 10]],
[1, “⚡ 🔺カジェル”, 16, T.C, 2, 0, [T.C, 1.2], null],
[1, “⚡🪓 シールド・ブレイカー”, 2, T.C, 2, 1, null, [AB.SB]],
[1, “🛡️ 装甲板”, 25, T.S, 1, 0, null, null],
[1, “🛡️💥 エフェメラ・シールド”, 45, T.S, 1, 1, null, null],
[1, “🛡️🛡️ イージス”, 30, T.S, 2, 0, null, null],
[1, “🛡️ ⤴️ バリアー”, 25, T.S, 3, 0, null, [AB.GR, 3]],
[1, “🔧 💥ダメージコントロール”, 30, T.H, 1, 1, null, null],
[1, “🔧 自動修理装置”, 15, T.H, 1, 0, null, null],
[1, “🟫🔺 ダブルシールド”, 0, T.X, 1, 0, [T.S, 2.0], null],
[2, “🔥🔺 弾頭最適化装置”, 0, T.X, 3, 0, [T.L, 2.0], null],
[1, “🏗️🔺 スウォーム・ハンガー”, 0, T.X, 3, 0, [T.M, 2.0], [AB.NR]],
[1, “💎🔺 プリズマティック・フォーカス”, 0, T.X, 3, 0, [T.C, 2.0], [AB.SIM]],
];

const EN = [
[1, “スカミッシャー”, 40, 0, R.N, [0, 0, 10], []],
[2, “ドリフター”, 51, 5, R.N, [20, 0, 10], [[SK.GATE, 5]]],
[3, “自己修復機”, 40, 10, R.N, [0, 10, 15], [[SK.REG, 8]]],
[4, “ゾンビ”, 25, 80, R.N, [0, 0, 20], [[SK.DEG, 5]]],
[5, “遺物哨戒機”, 60, 30, R.N, [30, 30, 0], [[SK.DOR, 0]]],
[6, “特攻フリゲート”, 10, 65, R.N, [0, 0, 0], [[SK.EXP, 180]]],
[7, “重装巡洋艦”, 80, 80, R.N, [5, 10, 10], [[SK.EXP, 60]]],
[8, “シールド・ゲート”, 55, 20, R.E, [10, 10, 5], [[SK.GATE, 20]]],
[9, “オーバーロード・エンフォーサー”, 70, 30, R.E, [20, 20, 25], [[SK.OVR, 2.0]]],
[10, “セレスティアル・リーパー”, 100, 60, R.B, [40, 20, 35], [[SK.CL, 10]]],
];

const ST = [
[‘N’, 1],
[‘N’, 2],
[‘N’, 3],
[‘E’, 8],
[‘N’, 4],
[‘D’, 0],
[‘N’, 5],
[‘E’, 9],
[‘N’, 6],
[‘N’, 7],
[‘D’, 0],
[‘B’, 10],
];

// Helpers
const EQ_SCHEMA = [‘slots’, ‘name’, ‘power’, ‘type’, ‘rarity’, ‘disposable’, ‘mult’, ‘ability’];
const EN_SCHEMA = [‘difficulty’, ‘name’, ‘hull’, ‘shield’, ‘rank’, ‘attacks’, ‘skills’];
const ST_SCHEMA = [‘rank’, ‘difficulty’];

const parse = (schema, data) => data.map(row => {
const obj = {};
schema.forEach((key, i) => obj[key] = row[i]);
return obj;
});

const equipmentList = parse(EQ_SCHEMA, EQ);
const enemyList = parse(EN_SCHEMA, EN);
const stageList = parse(ST_SCHEMA, ST);

const getAct = (stage) => Math.floor((stage - 1) / 12) + 1;
const getStageInAct = (stage) => ((stage - 1) % 12) + 1;
const getActScale = (act) => [1, 1.5, 2][act - 1] || 1;

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
if (player.skirmish) { base[3] = ‘MID’; }
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

const normalItemsDeck = createItemDeck(1, 3, rng);
const eliteItemsDeck = createItemDeck(2, 3, rng);
const bossItemsDeck = createItemDeck(3, 3, rng);

const normalRarityDecks = {
1: createRarityDeck(20, 1, 0, rng),
2: createRarityDeck(16, 4, 1, rng),
3: createRarityDeck(12, 7, 2, rng),
};
const eliteRarityDecks = {
1: createRarityDeck(0, 6, 0, rng),
2: createRarityDeck(0, 5, 1, rng),
3: createRarityDeck(0, 4, 2, rng),
};

const allBossRewards = [‘expansion’, ‘reinforcement’, ‘boarding’, ‘skirmish’, ‘logistics’, ‘doctrine’];
const bossRewards = seededShuffle(allBossRewards, rng);

return {
seed: actualSeed,
itemIdCounter: idCounter,
max_hull: 200,
hull: 200,
max_slots: 6,
inventory: [
createItem(“🚀 ランス”, idCounter),
createItem(“🚀 ランス”, idCounter),
createItem(“⚡ クロウ”, idCounter),
createItem(“⚡ クロウ”, idCounter),
createItem(“🛡️ 装甲板”, idCounter),
createItem(“🗑️ スクラップ”, idCounter),
createItem(“🗑️ スクラップ”, idCounter),
],
equipped: [],
logistics: false,
boarding: false,
skirmish: false,
doctrine: false,
normalItemsDeck,
eliteItemsDeck,
bossItemsDeck,
normalRarityDecks,
eliteRarityDecks,
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
if (hasAbility(item, AB.AM)) final.MID += getAbilityValue(item);
});

return { base, mult, final };
};

const runCombat = (player, enemy, equippedItems) => {
const log = [];
const turns = getTurnOrder(player);
const stats = calculateBattleStats(player, equippedItems);

const hasSimultaneous = equippedItems.some(i => hasAbility(i, AB.SIM));
const hasNoRepair = equippedItems.some(i => hasAbility(i, AB.NR));
const longCount = equippedItems.filter(i => getTypeId(i.type) === ‘LONG’).length;

let pShield = Math.round(stats.final.SHIELD);
let pHull = Math.round(player.hull);
let eShield = Math.round(enemy.shield);
let eHull = Math.round(enemy.hull);

log.push(`=== ACT ${getAct(player.stage)} | ${UI.label.stage} ${player.stage} | ${enemy.name} ===`);
log.push(`自機: ${pHull}HP | シールド:${pShield}`);
log.push(`敵艦: ${eHull}HP | シールド:${eShield}`);
log.push(`${UI.label.attack}: 長${Math.round(stats.final.LONG)} 中${Math.round(stats.final.MID)} 近${Math.round(stats.final.CLOSE)}`);
log.push(’’);

for (let turn = 0; turn < 6; turn++) {
const range = turns[turn];
log.push(`--- T${turn + 1}: ${getRangeName(range)} ---`);

```
const pDmg = stats.final[range];
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
  log.push(`  自機攻撃: ${Math.round(pDmg)}ダメージ → ${beforeHull}HP → ${eHull}HP`);

  if (canLifeSteal) {
    let totalHeal = 0;
    rangeItems.filter(i => hasAbility(i, AB.LS)).forEach(item => {
      const itemMult = stats.mult[range] || 1;
      totalHeal += Math.round(item.power * itemMult);
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
  eHull += regenVal;
  log.push(`  自己修復: +${regenVal}HP → ${eHull}HP`);
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
    if (eHull <= 0) log.push(`  敵艦撃破（同時）`);
    if (pHull <= 0) log.push(`  自機撃破（同時）`);
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

return { log, pHull, pShield, eHull, hasNoRepair, hullRepair: stats.final.HULL };
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
inventory: […player.inventory, createItem(“🚀 ランス”, player.itemIdCounter)],
};
}
return { …player };
});

const act = getAct(stage);
const scale = getActScale(act);
const stageData = getStageData(stage);
const enemyRank = getEnemyRank(stageData?.rank);
const enemyBase = enemyList.find(e => e.difficulty === stageData?.difficulty && e.rank === enemyRank);

const enemy = useMemo(() => {
if (!enemyBase) return null;
return {
…enemyBase,
hull: Math.round(enemyBase.hull * scale),
shield: Math.round(enemyBase.shield * scale),
attacks: enemyBase.attacks.map(a => Math.round(a * scale)),
};
}, [enemyBase, scale]);

if (!enemy) return <div>エラー: 敵艦データが見つかりません</div>;

const equippedItems = tempPlayer.inventory.filter(i => tempPlayer.equipped.includes(i.id));
const unequippedItems = tempPlayer.inventory.filter(i => !tempPlayer.equipped.includes(i.id));
const usedSlots = equippedItems.reduce((sum, i) => sum + i.slots, 0);

const toggleEquip = (item) => {
const isEquipped = tempPlayer.equipped.includes(item.id);
if (isEquipped) {
setTempPlayer({
…tempPlayer,
equipped: tempPlayer.equipped.filter(id => id !== item.id),
});
} else {
if (usedSlots + item.slots <= tempPlayer.max_slots) {
setTempPlayer({
…tempPlayer,
equipped: […tempPlayer.equipped, item.id],
});
}
}
};

const preview = useMemo(() => {
const stats = calculateBattleStats(tempPlayer, equippedItems);
return {
long: Math.round(stats.final.LONG),
mid: Math.round(stats.final.MID),
close: Math.round(stats.final.CLOSE),
shield: Math.round(stats.final.SHIELD),
};
}, [tempPlayer, equippedItems]);

// Calculate if player will die and at which turn
const fatalData = useMemo(() => {
const turns = getTurnOrder(tempPlayer);
let simHull = Math.round(tempPlayer.hull);
let simShield = Math.round(preview.shield);
let totalDamageDealt = 0;
let totalDamageTaken = 0;

```
for (let turn = 0; turn < 6; turn++) {
  const range = turns[turn];
  let pDmg = preview[range.toLowerCase()];
  
  // Apply damage to enemy (for damage dealt tracking)
  if (pDmg > 0) {
    totalDamageDealt += pDmg;
  }
  
  let eDmg = enemy.attacks[['LONG', 'MID', 'CLOSE'].indexOf(range)];
  
  // Scale for ACT
  eDmg = Math.round(eDmg * getActScale(act));
  
  // Apply OVERLOAD/DORMANT (turn 4+)
  if (turn >= 3 && hasSkill(enemy, SK.OVR)) {
    const ovrVal = getSkillValue(enemy, SK.OVR);
    eDmg = Math.round(eDmg * ovrVal);
  }
  if (turn >= 3 && hasSkill(enemy, SK.DOR)) {
    const dorVal = getSkillValue(enemy, SK.DOR);
    eDmg = Math.round(eDmg * dorVal);
  }
  
  // Apply EXPLOSIVE damage (turn 4)
  if (turn === 3 && hasSkill(enemy, SK.EXP)) {
    const expVal = getSkillValue(enemy, SK.EXP);
    eDmg = expVal;
  }
  
  // Apply damage
  if (eDmg > 0) {
    const toShield = Math.min(simShield, eDmg);
    simShield = Math.max(0, simShield - eDmg);
    simHull = Math.max(0, simHull - (eDmg - toShield));
    totalDamageTaken += eDmg;
  }
  
  if (simHull <= 0) {
    return { turn: turn + 1, damageDealt: totalDamageDealt, damageTaken: totalDamageTaken };
  }
}
return null; // Player survives
```

}, [tempPlayer, preview, enemy, act]);

// Calculate which turn enemy will be defeated and damage taken
const defeatData = useMemo(() => {
const turns = getTurnOrder(tempPlayer);
let simEnemyHull = Math.round(enemy.hull);
let simEnemyShield = Math.round(enemy.shield);
let simPlayerHull = Math.round(tempPlayer.hull);
let simPlayerShield = Math.round(preview.shield);
let totalDamageTaken = 0;
let totalDamageDealt = 0;

```
for (let turn = 0; turn < 6; turn++) {
  const range = turns[turn];
  let pDmg = preview[range.toLowerCase()];
  
  // Apply damage to enemy
  if (pDmg > 0) {
    const toShield = Math.min(simEnemyShield, pDmg);
    simEnemyShield = Math.max(0, simEnemyShield - pDmg);
    simEnemyHull = Math.max(0, simEnemyHull - (pDmg - toShield));
    totalDamageDealt += pDmg;
  }
  
  if (simEnemyHull <= 0) {
    return { turn: turn + 1, damageDealt: totalDamageDealt, damageTaken: totalDamageTaken };
  }
  
  // Enemy regen (after player attack but before checking defeat)
  if (hasSkill(enemy, SK.REG)) {
    const regenVal = getSkillValue(enemy, SK.REG);
    simEnemyHull += regenVal;
  }
  
  // Enemy degen
  if (hasSkill(enemy, SK.DEG)) {
    const degenVal = getSkillValue(enemy, SK.DEG);
    simEnemyHull -= degenVal;
    if (simEnemyHull <= 0) {
      return { turn: turn + 1, damageDealt: totalDamageDealt, damageTaken: totalDamageTaken };
    }
  }
  
  // Enemy gate
  if (hasSkill(enemy, SK.GATE)) {
    const gateVal = getSkillValue(enemy, SK.GATE);
    if (simEnemyShield < gateVal) {
      simEnemyShield = gateVal;
    }
  }
  
  // Check if enemy is defeated - if so, enemy doesn't attack (unless simultaneous)
  const hasSimultaneous = equippedItems.some(i => hasAbility(i, AB.SIM));
  if (simEnemyHull <= 0 && !hasSimultaneous) {
    return { turn: turn + 1, damageDealt: totalDamageDealt, damageTaken: totalDamageTaken };
  }
  
  // Calculate enemy attack damage for this turn
  let eDmg = enemy.attacks[['LONG', 'MID', 'CLOSE'].indexOf(range)];
  eDmg = Math.round(eDmg * getActScale(act));
  
  if (turn >= 3 && hasSkill(enemy, SK.OVR)) {
    const ovrVal = getSkillValue(enemy, SK.OVR);
    eDmg = Math.round(eDmg * ovrVal);
  }
  if (turn >= 3 && hasSkill(enemy, SK.DOR)) {
    const dorVal = getSkillValue(enemy, SK.DOR);
    eDmg = Math.round(eDmg * dorVal);
  }
  
  if (turn === 3 && hasSkill(enemy, SK.EXP)) {
    const expVal = getSkillValue(enemy, SK.EXP);
    eDmg = expVal;
  }
  
  // Apply damage to player
  if (eDmg > 0) {
    const toShield = Math.min(simPlayerShield, eDmg);
    const toHull = eDmg - toShield;
    simPlayerShield = Math.max(0, simPlayerShield - eDmg);
    simPlayerHull = Math.max(0, simPlayerHull - toHull);
    totalDamageTaken += eDmg;
  }
  
  // Check if player dies after enemy attacks
  if (simPlayerHull <= 0 && hasSimultaneous) {
    return { turn: turn + 1, damageDealt: totalDamageDealt, damageTaken: totalDamageTaken };
  }
}
return null; // Enemy survives
```

}, [preview, enemy, tempPlayer, act]);

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
if (finalHull > 0 && !combatResult.hasNoRepair && combatResult.hullRepair > 0) {
  const repairAmount = Math.round(combatResult.hullRepair);
  finalHull = Math.min(tempPlayer.max_hull, finalHull + repairAmount);
  combatResult.log.push(`戦闘後処理: 耐久値+${repairAmount}回復 → ${finalHull}HP`);
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
<div className="text-xs text-green-600 mb-2">シード: {tempPlayer.seed}</div>

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
        {defeatData ? (
          <div className="text-xs mt-2 space-y-1">
            <div className="text-green-400 font-bold">概算予測✓ T{defeatData.turn}で撃破</div>
            <div className="text-green-300">与ダメージ量: {defeatData.damageDealt}</div>
            <div className="text-green-300">被ダメージ量: {defeatData.damageTaken}</div>
          </div>
        ) : fatalData && (
          <div className="text-xs mt-2 space-y-1">
            <div className="text-red-400 font-bold">概算予測 ⚠️ T{fatalData.turn}で沈没</div>
            <div className="text-red-300">与ダメージ量: {fatalData.damageDealt}</div>
            <div className="text-red-300">被ダメージ量: {fatalData.damageTaken}</div>
          </div>
        )}
      </div>
    </div>

    <div className="mb-4">
      <div className="font-bold mb-2">{UI.label.equipped} ({usedSlots}/{tempPlayer.max_slots})</div>
      {equippedItems.map(item => (
        <ItemRow key={item.id} item={item} equipped onClick={() => toggleEquip(item)} />
      ))}
    </div>

    <div className="mb-4">
      <div className="font-bold mb-2">{UI.label.inventory}</div>
      {unequippedItems.map(item => (
        <ItemRow key={item.id} item={item} onClick={() => toggleEquip(item)} />
      ))}
    </div>

    <button onClick={startCombat} className="bg-red-700 px-4 py-2 hover:bg-red-600">
      {UI.btn.engage}
    </button>
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

const [options, setOptions] = useState(() => {
const rewardItems = [];

```
const rarityDecks = stageData?.rank === 'N' ? player.normalRarityDecks :
                    stageData?.rank === 'E' ? player.eliteRarityDecks : null;

// Create mutable copies of decks for this draw
const normalDeck = [...player.normalItemsDeck];
const eliteDeck = [...player.eliteItemsDeck];
const bossDeck = [...player.bossItemsDeck];
const normalRarityDeck = stageData?.rank === 'N' ? [...(rarityDecks?.[act] || [])] : [];
const eliteRarityDeck = stageData?.rank === 'E' ? [...(rarityDecks?.[act] || [])] : [];

for (let i = 0; i < 3; i++) {
  // 1. Determine rarity for this item
  let rarity;
  if (isBoss) {
    rarity = 3;
  } else if (stageData?.rank === 'N' && normalRarityDeck.length > 0) {
    rarity = normalRarityDeck.shift();  // Consume from rarity deck
  } else if (stageData?.rank === 'E' && eliteRarityDeck.length > 0) {
    rarity = eliteRarityDeck.shift();  // Consume from rarity deck
  } else {
    rarity = stageData?.rank === 'E' ? 2 : 1;  // Fallback
  }

  // 2. Draw from appropriate item deck
  let deck;
  if (rarity === 3 && bossDeck.length > 0) {
    deck = bossDeck;
  } else if (rarity === 2 && eliteDeck.length > 0) {
    deck = eliteDeck;
  } else {
    deck = normalDeck;
  }

  if (deck.length > 0) {
    const itemName = deck.shift();  // Remove from deck permanently
    const item = equipmentList.find(e => e.name === itemName);
    if (item) rewardItems.push(item);
  }
}

return rewardItems;
```

});

const [selectedItem, setSelectedItem] = useState(null);
const [selectedBonus, setSelectedBonus] = useState(null);

const availableBossRewards = isBoss && act <= 2 ? player.bossRewards.slice(0, 3) : [];

const activeBonuses = [
player.boarding && ‘白兵戦’,
player.skirmish && ‘遭遇戦’,
player.logistics && ‘兵站’,
player.doctrine && ‘教義’,
].filter(Boolean);

const claim = () => {
const newPlayer = { …player };

```
if (selectedItem) {
  newPlayer.inventory = [...player.inventory, createItem(selectedItem, player.itemIdCounter)];
}

// Consume the 3 drawn items from decks
// We need to reconstruct what was drawn and remove it
const rarityDecks = stageData?.rank === 'N' ? player.normalRarityDecks :
                    stageData?.rank === 'E' ? player.eliteRarityDecks : null;

const normalDeck = [...player.normalItemsDeck];
const eliteDeck = [...player.eliteItemsDeck];
const bossDeck = [...player.bossItemsDeck];
const normalRarityDeck = stageData?.rank === 'N' ? [...(rarityDecks?.[act] || [])] : [];
const eliteRarityDeck = stageData?.rank === 'E' ? [...(rarityDecks?.[act] || [])] : [];

// Simulate the draw to know what was consumed
for (let i = 0; i < 3; i++) {
  let rarity;
  if (isBoss) {
    rarity = 3;
  } else if (stageData?.rank === 'N' && normalRarityDeck.length > 0) {
    rarity = normalRarityDeck.shift();
  } else if (stageData?.rank === 'E' && eliteRarityDeck.length > 0) {
    rarity = eliteRarityDeck.shift();
  } else {
    rarity = stageData?.rank === 'E' ? 2 : 1;
  }

  let deck;
  if (rarity === 3 && bossDeck.length > 0) {
    deck = bossDeck;
  } else if (rarity === 2 && eliteDeck.length > 0) {
    deck = eliteDeck;
  } else {
    deck = normalDeck;
  }

  if (deck.length > 0) {
    deck.shift();  // Remove the drawn item
  }
}

// Update player decks
newPlayer.normalItemsDeck = normalDeck;
newPlayer.eliteItemsDeck = eliteDeck;
newPlayer.bossItemsDeck = bossDeck;

// Update rarity decks
if (!isBoss) {
  if (stageData?.rank === 'N') {
    newPlayer.normalRarityDecks = { ...player.normalRarityDecks };
    newPlayer.normalRarityDecks[act] = normalRarityDeck;
  } else if (stageData?.rank === 'E') {
    newPlayer.eliteRarityDecks = { ...player.eliteRarityDecks };
    newPlayer.eliteRarityDecks[act] = eliteRarityDeck;
  }
}

if (isBoss) {
  newPlayer.hull = newPlayer.max_hull;

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

    newPlayer.bossRewards = player.bossRewards.filter(r => r !== selectedBonus);
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
<div className="text-xs text-green-600 mb-4">シード: {player.seed}</div>

```
  <div className="mb-4">
    <div className="font-bold mb-2">1つ選択:</div>
    {options.map(item => {
      const parts = [
        item.name,
        '|',
        getTypeName(item.type),
        `威力:${item.power}`,
      ];
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
          {selectedItem === item.name ? '✓' : '○'} [{item.slots}]{parts.join(' ')}
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
const [scrapItems, setScrapItems] = useState([]);

const toggleScrap = (itemId) => {
if (scrapItems.includes(itemId)) {
setScrapItems(scrapItems.filter(id => id !== itemId));
} else if (scrapItems.length < scrapCost) {
setScrapItems([…scrapItems, itemId]);
}
};

const handleRepair = () => {
if (scrapItems.length !== scrapCost) return;

```
const repair = Math.floor(player.max_hull * 0.3);
const newInventory = player.inventory.filter(i => !scrapItems.includes(i.id));

setPlayer({
  ...player,
  hull: Math.min(player.max_hull, player.hull + repair),
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
inventory: […player.inventory, createItem(“🚀 ランス”, player.itemIdCounter)],
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
<div className="text-xs text-green-600 mb-4">シード: {player.seed}</div>

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
              className={`text-xs mb-1 cursor-pointer hover:bg-green-900 ${scrapItems.includes(item.id) ? 'bg-red-900' : ''}`}
              onClick={() => toggleScrap(item.id)}
            >
              {scrapItems.includes(item.id) ? '✗' : '○'} {item.name} | {getTypeName(item.type)} {UI.label.power}:{item.power}
            </div>
          ))}
          <button
            onClick={handleRepair}
            disabled={scrapItems.length !== scrapCost}
            className={`mt-2 px-4 py-2 ${scrapItems.length === scrapCost ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700 cursor-not-allowed'}`}
          >
            {UI.btn.repair} (+{Math.floor(player.max_hull * 0.3)}HP)
          </button>
        </>
      ) : (
        <div className="text-sm text-gray-500">アイテム不足（必要: {scrapCost}個）</div>
      )}
    </div>

    <div className="border border-green-700 p-3">
      <div className="font-bold mb-2">2. {UI.dock.fabricate.title}</div>
      <div className="text-sm mb-2">{UI.dock.fabricate.desc}</div>
      <button onClick={handleFabricate} className="bg-yellow-700 px-4 py-2 hover:bg-yellow-600">
        {UI.btn.fabricate} (−10 最大HP)
      </button>
    </div>

    <div className="border border-green-700 p-3">
      <div className="font-bold mb-2">3. {UI.dock.leave.title}</div>
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

function ItemRow({ item, equipped = false, onClick, showId = true }) {
const parts = [
item.name,
‘|’,
getTypeName(item.type),
`${UI.label.power}:${item.power}`,
];

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

return (
<div
className={`text-xs mb-1 ${textColor} ${onClick ? 'cursor-pointer hover:bg-green-900' : ''}`}
onClick={onClick}
>
{equipped && ’✓ ‘}{showId && <span className="text-green-600">#{item.id} </span>}[{item.slots}] {parts.join(’ ’)}
</div>
);
}

function ItemInfo({ item }) {
const parts = [
item.name,
‘|’,
getTypeName(item.type),
`[${item.slots}]`,
`${UI.label.power}:${item.power}`,
];

if (item.disposable) parts.push(‘💥’);
if (item.mult) parts.push(formatMult(item.mult));
if (item.ability) parts.push(formatAbility(item.ability));

return <>{parts.join(’ ’)}</>;
}