import React, { useState, useEffect, useMemo } from ‘react’;

// ============================================================================
// SECTION 1: CONSTANTS & TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// SECTION 2: SKILLS & ABILITIES
// ============================================================================

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

// ============================================================================
// SECTION 3: GAME DATA (Positional Arrays)
// ============================================================================

// Schema: [slots, name, power, type, rarity, disposable, mult, ability]
const EQ = [
// === SCRAP (Dock currency) ===
[1, "🗑️ スクラップ", 0, T.X, 0, 0, null, null],

// === LONG (Missiles) ===
[1, "🚀 ランス", 40, T.L, 1, 1, null, null],
[2, "🚀🛡️ インターセプター", 50, T.L, 1, 1, null, [AB.SH, 10]],
[2, "🚀❗ ハープーン", 71, T.L, 1, 1, null, [AB.BF, 10]],
[2, "🚀⚠️ アイソレーション", 75, T.L, 1, 1, [T.L, 0.9], null],
[2, "🚀 ジャベリン", 60, T.L, 1, 1, null, null],
[1, "🚀 🚀 シューティングスター", 65, T.L, 2, 1, null, null],
[2, "🚀⚠️ サイレント", 90, T.L, 2, 1, [T.M, 0.0], null],
[1, "🚀 🚀 🔺 ギャンビット", 50, T.L, 2, 1, [T.L, 1.3], null],
[3, "🚀 🚀 🚀MOP", 100, T.L, 2, 1, null, null],
[1, "🔫 クァンタム・ディスプレーサー", 30, T.L, 3, 0, [T.C, 0.5], null],

// === MID (Fighters) ===
[1, "✈️ ドローン", 12, T.M, 1, 0, null, null],
[1, "✈️⚠️ スカベンジャー", 20, T.M, 1, 0, [T.M, 0.9], null],
[1, "✈️⤴️ ルーキー・ファイター", 5, T.M, 1, 0, null, [AB.GR, 2]],
[1, "✈️✈️ ブルーウルフ", 20, T.M, 2, 0, null, null],
[1, "✈️🔺 スクアドラル", 12, T.M, 2, 0, null, [AB.AM, 10]],

// === CLOSE (Beams) ===
[1, "⚡ クロウ", 15, T.C, 1, 0, null, null],
[1, "⚡🩸 ファング", 10, T.C, 1, 0, null, [AB.LS]],
[1, "⚡🛡️ アイアン・ビーム", 12, T.C, 1, 0, null, [AB.SH, 10]],
[1, "⚡ 🔺カジェル", 16, T.C, 2, 0, [T.C, 1.2], null],
[1, "⚡🪓 シールド・ブレイカー", 2, T.C, 2, 1, null, [AB.SB]],

// === SHIELD ===
[1, "🛡️ 装甲板", 25, T.S, 1, 0, null, null],
[1, "🛡️💥 エフェメラ・シールド", 45, T.S, 1, 1, null, null],
[1, "🛡️🛡️ イージス", 30, T.S, 2, 0, null, null],
[1, "🛡️ ⤴️ バリアー", 25, T.S, 3, 0, null, [AB.GR, 3]],

// === HULL ===
[1, "🔧 💥ダメージコントロール", 30, T.H, 1, 1, null, null],
[1, "🔧 自動修理装置", 15, T.H, 1, 0, null, null],

// === MODULE ===
[1, "🟫🔺 ダブルシールド", 0, T.X, 1, 0, [T.S, 2.0], null],
[2, "🔥🔺 弾頭最適化装置", 0, T.X, 3, 0, [T.L, 2.0], null],
[1, "🏗️🔺 スウォーム・ハンガー", 0, T.X, 3, 0, [T.M, 2.0], [AB.NR]],
[1, "💎🔺 プリズマティック・フォーカス", 0, T.X, 3, 0, [T.C, 2.0], [AB.SIM]],
];

// Schema: [difficulty, name, hull, shield, rank, attacks[L,M,C], skills[[SK,val],…]]
const EN = [
[1, "スカミッシャー", 40, 0, R.N, [0, 0, 10], []],
[2, "ドリフター", 51, 5, R.N, [20, 0, 10], [[SK.GATE, 5]]],
[3, "自己修復機", 40, 10, R.N, [0, 10, 15], [[SK.REG, 8]]],
[4, "ゾンビ", 25, 80, R.N, [0, 0, 20], [[SK.DEG, 5]]],
[5, "遺物哨戒機", 60, 30, R.N, [30, 30, 0], [[SK.DOR, 0]]],
[6, "特攻フリゲート", 10, 65, R.N, [0, 0, 0], [[SK.EXP, 180]]],
[7, "重装巡洋艦", 80, 80, R.N, [5, 10, 10], [[SK.EXP, 60]]],
[8, "シールド・ゲート", 55, 20, R.E, [10, 10, 5], [[SK.GATE, 20]]],
[9, "オーバーロード・エンフォーサー", 70, 30, R.E, [20, 20, 25], [[SK.OVR, 2.0]]],
[10, "セレスティアル・リーパー", 100, 60, R.B, [40, 20, 35], [[SK.CL, 10]]],
];

// Schema: [rank, difficulty]
// rank: 'N' (Normal), 'E' (Elite), 'B' (Boss), 'D' (Dock)
// 12 stages per ACT: ACT I(1-12), ACT II(13-24), ACT III(25-36)
const ST = [
['N', 1],
['N', 2],
['N', 3],
['E', 8],
['N', 4],
['D', 0],
['N', 5],
['E', 9],
['N', 6],
['N', 7],
['D', 0],
['B', 10],
];

// ============================================================================
// SECTION 4: UI TEXT & STORY
// ============================================================================

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

// ============================================================================
// SECTION 5: DATA PARSERS & HELPERS
// ============================================================================

const EQ_SCHEMA = ['slots', 'name', 'power', 'type', 'rarity', 'disposable', 'mult', 'ability'];
const EN_SCHEMA = ['difficulty', 'name', 'hull', 'shield', 'rank', 'attacks', 'skills'];
const ST_SCHEMA = ['rank', 'difficulty'];

const parse = (schema, data) => data.map(row => {
const obj = {};
schema.forEach((key, i) => obj[key] = row[i]);
return obj;
});

const equipmentList = parse(EQ_SCHEMA, EQ);
const enemyList = parse(EN_SCHEMA, EN);
const stageList = parse(ST_SCHEMA, ST);

// Game progression helpers
const getAct = (stage) => Math.floor((stage - 1) / 12) + 1;
const getStageInAct = (stage) => ((stage - 1) % 12) + 1;
const getActScale = (act) => [1, 1.5, 2][act - 1] || 1;

// Damage calculation
const applyDamage = (dmg, shield, hull) => {
const toShield = Math.min(shield, dmg);
return {
shield: Math.max(0, shield - dmg),
hull: Math.max(0, hull - (dmg - toShield)),
};
};

// Item management - uses sequential IDs for AI-friendly identification
let globalItemIdCounter = 0;

const createItem = (name, idCounter = null) => {
const base = equipmentList.find(e => e.name === name);
if (!base) return null;
const id = idCounter !== null ? idCounter.next() : globalItemIdCounter++;
return { ...base, id };
};

// ID counter factory for per-run sequential IDs
const createIdCounter = (start = 0) => {
let counter = start;
return {
  next: () => counter++,
  current: () => counter,
  reset: (val = 0) => { counter = val; },
};
};

// Display helpers
const getTypeName = (type) => type?.name || String(type);
const getTypeId = (type) => type?.id || String(type);
const getRangeName = (range) => RANGE[range] || range;

// Ability helpers
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

// Skill helpers
const hasSkill = (enemy, skillType) => {
return enemy.skills.some(([sk]) => sk === skillType || sk?.id === skillType?.id);
};

const getSkillValue = (enemy, skillType) => {
const skill = enemy.skills.find(([sk]) => sk === skillType || sk?.id === skillType?.id);
return skill ? skill[1] : null;
};

const formatSkills = (skills) => {
return skills.map(([sk, val]) => {
const valText = val !== 0 ? `: ${val}` : ‘’;
return `【${sk.name}${valText}】${sk.desc}`;
}).join(’ ’);
};

// Turn order with boss rewards
const getTurnOrder = (player) => {
const base = ['LONG', 'MID', 'CLOSE', 'CLOSE', 'MID', 'LONG'];
if (player.boarding) { base[4] = 'CLOSE'; base[5] = 'CLOSE'; }
if (player.skirmish) { base[3] = 'MID'; }
return base;
};

// Stage rank to enemy rank mapping
const STAGE_RANK_MAP = { 'N': R.N, 'E': R.E, 'B': R.B };
const getStageData = (stage) => {
const stageInAct = getStageInAct(stage);
return stageList[stageInAct - 1] || null;
};
const getEnemyRank = (stageRank) => STAGE_RANK_MAP[stageRank] || null;

// ============================================================================
// SECTION 5.5: SEEDED PRNG SYSTEM
// ============================================================================

// Mulberry32 PRNG - Fast, high-quality 32-bit PRNG
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
  getState: () => state,
  setState: (s) => { state = s >>> 0; },
};
};

// Seeded Fisher-Yates shuffle
const seededShuffle = (array, rng) => {
const result = [...array];
for (let i = result.length - 1; i > 0; i--) {
  const j = Math.floor(rng.next() * (i + 1));
  [result[i], result[j]] = [result[j], result[i]];
}
return result;
};

// Global RNG instance
let gameRNG = null;

const initializeRNG = (seed) => {
gameRNG = createPRNG(seed);
return gameRNG;
};

const getRNG = () => gameRNG;

const generateSeed = () => Math.floor(Math.random() * 0xFFFFFFFF);

// ============================================================================
// SECTION 6: INITIAL STATE
// ============================================================================

// Helper to create bag-randomized item decks
const createItemDeck = (rarity, numBags, rng) => {
const itemsOfRarity = equipmentList.filter(e => e.rarity === rarity);
const deck = [];
for (let bag = 0; bag < numBags; bag++) {
  const shuffledBag = seededShuffle(itemsOfRarity.map(e => e.name), rng);
  deck.push(...shuffledBag);
}
return deck;
};

// Helper to create reward rarity decks
const createRarityDeck = (normalCount, eliteCount, bossCount, rng) => {
const deck = [];
for (let i = 0; i < normalCount; i++) deck.push(1); // rarity 1 = normal
for (let i = 0; i < eliteCount; i++) deck.push(2);  // rarity 2 = elite
for (let i = 0; i < bossCount; i++) deck.push(3);   // rarity 3 = boss
return seededShuffle(deck, rng);
};

const createInitialPlayer = (seed = null) => {
// Initialize seed
const actualSeed = seed !== null ? seed : generateSeed();
initializeRNG(actualSeed);
const rng = getRNG();

// Create ID counter for this run
const idCounter = createIdCounter(0);

// Create item decks (bag randomizer system)
// 3 bags per rarity level
const normalItemsDeck = createItemDeck(1, 3, rng);
const eliteItemsDeck = createItemDeck(2, 3, rng);
const bossItemsDeck = createItemDeck(3, 3, rng);

// Create reward rarity decks for each rank per ACT
// Normal rank: 7 combats × 3 choices = 21 cards per ACT
const normalRarityDecks = {
  1: createRarityDeck(20, 1, 0, rng),   // ACT I: 95% normal, 5% elite
  2: createRarityDeck(16, 4, 1, rng),   // ACT II: 80% normal, 15% elite, 5% boss
  3: createRarityDeck(12, 7, 2, rng),   // ACT III: 60% normal, 30% elite, 10% boss
};
// Elite rank: 2 combats × 3 choices = 6 cards per ACT
const eliteRarityDecks = {
  1: createRarityDeck(0, 6, 0, rng),    // ACT I: 100% elite
  2: createRarityDeck(0, 5, 1, rng),    // ACT II: 90% elite, 10% boss
  3: createRarityDeck(0, 4, 2, rng),    // ACT III: 67% elite, 33% boss
};

// Boss reward pool - shuffled at game start
const allBossRewards = ['expansion', 'reinforcement', 'boarding', 'skirmish', 'logistics', 'doctrine'];
const bossRewards = seededShuffle(allBossRewards, rng);

return {
  // Seed system
  seed: actualSeed,
  itemIdCounter: idCounter,

  // Core stats
  max_hull: 200,
  hull: 200,
  max_slots: 6,

  // Inventory with sequential IDs
  inventory: [
    createItem("🚀 ランス", idCounter),
    createItem("🚀 ランス", idCounter),
    createItem("⚡ クロウ", idCounter),
    createItem("⚡ クロウ", idCounter),
    createItem("🛡️ 装甲板", idCounter),
    createItem("🗑️ スクラップ", idCounter),
    createItem("🗑️ スクラップ", idCounter),
  ],
  equipped: [],

  // Boss reward flags
  logistics: false,
  boarding: false,
  skirmish: false,
  doctrine: false,

  // Item decks (pre-shuffled)
  normalItemsDeck,
  eliteItemsDeck,
  bossItemsDeck,

  // Reward rarity decks (per rank, per act)
  normalRarityDecks,
  eliteRarityDecks,

  // Boss rewards pool (shuffled)
  bossRewards,
};
};

// ============================================================================
// SECTION 7: COMBAT ENGINE
// ============================================================================

const calculateBattleStats = (player, equippedItems) => {
// Base stats by type
const base = { LONG: 0, MID: 0, CLOSE: 0, SHIELD: 0, HULL: 0 };
equippedItems.forEach(item => {
const typeId = getTypeId(item.type);
if (base.hasOwnProperty(typeId)) {
base[typeId] += item.power;
}
});

// Multipliers
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

// Apply doctrine
if (player.doctrine) {
mult.LONG *= 1.2;
mult.MID *= 1.2;
mult.CLOSE *= 1.2;
}

// Calculate final values
const final = {
LONG: base.LONG * mult.LONG,
MID: base.MID * mult.MID,
CLOSE: base.CLOSE * mult.CLOSE,
SHIELD: base.SHIELD * mult.SHIELD,
HULL: base.HULL * mult.HULL,
};

// Flat bonuses from abilities
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

// Check special abilities
const hasSimultaneous = equippedItems.some(i => hasAbility(i, AB.SIM));
const hasNoRepair = equippedItems.some(i => hasAbility(i, AB.NR));
const longCount = equippedItems.filter(i => getTypeId(i.type) === ‘LONG’).length;

// Battle state
let pShield = Math.round(stats.final.SHIELD);
let pHull = Math.round(player.hull);
let eShield = Math.round(enemy.shield);
let eHull = Math.round(enemy.hull);

// Header
log.push(`=== ACT ${getAct(player.stage)} | ${UI.label.stage} ${player.stage} | ${enemy.name} ===`);
log.push(`自機: ${pHull}HP | シールド:${pShield}`);
log.push(`敵艦: ${eHull}HP | シールド:${eShield}`);
log.push(`${UI.label.attack}: 長${Math.round(stats.final.LONG)} 中${Math.round(stats.final.MID)} 近${Math.round(stats.final.CLOSE)}`);
log.push(’’);

// Combat loop
let battleOver = false;
for (let turn = 0; turn < 6 && !battleOver; turn++) {
const range = turns[turn];
log.push(`--- T${turn + 1}: ${getRangeName(range)} ---`);

// === PLAYER PHASE ===
const pDmg = stats.final[range];
const rangeItems = equippedItems.filter(i => getTypeId(i.type) === range);

if (pDmg > 0) {
  const beforeHull = eHull;

  // SHIELD_BREAK
  if (rangeItems.some(i => hasAbility(i, AB.SB))) {
    if (eShield > 0) {
      log.push(`  シールド破壊: 敵シールド ${eShield} → 0`);
      eShield = 0;
    }
  }

  // Check LIFE_STEAL eligibility before damage
  const canLifeSteal = rangeItems.some(i => hasAbility(i, AB.LS)) && eShield === 0;

  // Apply damage
  const dmgResult = applyDamage(pDmg, eShield, eHull);
  eShield = Math.round(dmgResult.shield);
  eHull = Math.round(dmgResult.hull);
  log.push(`  自機攻撃: ${Math.round(pDmg)}ダメージ → ${beforeHull}HP → ${eHull}HP`);

  // LIFE_STEAL
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

  // BACKFIRE
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
        battleOver = true;
      }
    }
  }
} else {
  log.push(`  ${getRangeName(range)}武装なし`);
}
if (battleOver) continue;

// COUNTER_LONG
if (range === 'LONG' && hasSkill(enemy, SK.CL) && longCount > 0) {
  const counterVal = getSkillValue(enemy, SK.CL);
  const counterDmg = Math.round(counterVal * longCount);
  const beforeCounter = pHull;
  const counterResult = applyDamage(counterDmg, pShield, pHull);
  pShield = Math.round(counterResult.shield);
  pHull = Math.round(counterResult.hull);
  log.push(`  迎撃: ${counterDmg}ダメージ (長距離武装${longCount}基) → ${beforeCounter}HP → ${pHull}HP`);
  if (pHull <= 0) {
    log.push(`  自機撃破を確認。`);
    battleOver = true;
  }
}
if (battleOver) continue;

// Victory check (skip if simultaneous)
if (!hasSimultaneous && eHull <= 0) {
  log.push(`  敵艦撃破を確認。`);
  battleOver = true;
  continue;
}

// === ENEMY PHASE ===

// REGEN
if (hasSkill(enemy, SK.REG)) {
  const regenVal = getSkillValue(enemy, SK.REG);
  eHull += regenVal;
  log.push(`  自己修復: +${regenVal}HP → ${eHull}HP`);
}

// DEGEN
if (hasSkill(enemy, SK.DEG)) {
  const degenVal = getSkillValue(enemy, SK.DEG);
  eHull -= degenVal;
  log.push(`  腐食: -${degenVal}HP → ${eHull}HP`);
  if (eHull <= 0) {
    log.push(`  敵艦撃破（腐食）。`);
    battleOver = true;
  }
}
if (battleOver) continue;

// Enemy attack
let eDmg = enemy.attacks[['LONG', 'MID', 'CLOSE'].indexOf(range)];

// OVERLOAD / DORMANT (turn 4+)
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

// EXPLOSIVE (turn 4)
if (turn === 3 && hasSkill(enemy, SK.EXP)) {
  const expVal = getSkillValue(enemy, SK.EXP);
  eDmg += expVal;
  log.push(`  自爆: +${expVal}ダメージ`);
}

// Apply enemy damage
if (eDmg > 0) {
  const beforeEnemyAtk = pHull;
  const eDmgResult = applyDamage(eDmg, pShield, pHull);
  pShield = Math.round(eDmgResult.shield);
  pHull = Math.round(eDmgResult.hull);
  log.push(`  敵艦攻撃: ${eDmg}ダメージ → ${beforeEnemyAtk}HP → ${pHull}HP`);
}

// EXPLOSIVE self-destruct
if (turn === 3 && hasSkill(enemy, SK.EXP)) {
  eHull = 0;
  log.push(`  自爆: 敵艦自壊`);
}

// Simultaneous check
if (hasSimultaneous) {
  if (eHull <= 0) log.push(`  敵艦撃破（同時）`);
  if (pHull <= 0) log.push(`  自機撃破（同時）`);
  if (eHull <= 0 || pHull <= 0) battleOver = true;
} else if (pHull <= 0) {
  log.push(`  自機撃破を確認。`);
  battleOver = true;
}
if (battleOver) continue;

// GATE (turn end)
if (hasSkill(enemy, SK.GATE) && eHull > 0) {
  const gateVal = getSkillValue(enemy, SK.GATE);
  if (eShield < gateVal) {
    const beforeGate = eShield;
    eShield = gateVal;
    log.push(`  防壁作動: シールド ${beforeGate} → ${eShield}`);
  }
}

log.push('');

}

log.push(UI.result.defeat.includes(‘敗北’) ? ‘’ : ‘’);
log.push(`=== 戦闘終了 ===`);

return { log, pHull, pShield, eHull, hasNoRepair, hullRepair: stats.final.HULL };
};

// ============================================================================
// SECTION 8: MAIN GAME COMPONENT
// ============================================================================

export default function Game() {
const [scene, setScene] = useState('start');
const [stage, setStage] = useState(1);
const [player, setPlayer] = useState(null);

const startGame = (seed = null) => {
setPlayer(createInitialPlayer(seed));
setScene('main');
};

const advance = (nextScene) => {
setStage(s => s + 1);
setScene(nextScene);
};

const restart = () => {
setStage(1);
setPlayer(null);
setScene('start');
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

// ============================================================================
// SECTION 9: SCENE COMPONENTS
// ============================================================================

function StartScene({ onStart }) {
const [seedInput, setSeedInput] = useState('');

const handleStart = () => {
const seed = seedInput.trim() !== '' ? parseInt(seedInput, 10) : null;
const validSeed = !isNaN(seed) && seed >= 0 ? seed : null;
onStart(validSeed);
};

return (
<div className="max-w-4xl mx-auto">
<pre className="text-xs mb-6 whitespace-pre-wrap">{STORY.opening}</pre>

{/* Seed Input */}
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
);
}

function MainScene({ stage, setScene }) {
useEffect(() => {
const stageData = getStageData(stage);

if (!stageData) {
  setScene('end');
  return;
}

// 'D' = Dock, otherwise combat ('N', 'E', 'B')
setScene(stageData.rank === 'D' ? 'dock' : 'combat');

}, [stage, setScene]);

return (
<div className="text-center">
{UI.label.stage} {stage} 処理中…
</div>
);
}

function CombatScene({ player, setPlayer, stage, setScene, advance }) {
const [phase, setPhase] = useState(‘prep’); // prep | battle
const [log, setLog] = useState([]);
const [result, setResult] = useState(null);

// Temp player state for pre-combat modifications
const [tempPlayer, setTempPlayer] = useState(() => {
if (player.logistics) {
return {
...player,
inventory: [...player.inventory, createItem("🚀 ランス", player.itemIdCounter)],
};
}
return { ...player };
});

// Get enemy data
const act = getAct(stage);
const scale = getActScale(act);
const stageData = getStageData(stage);
const enemyRank = getEnemyRank(stageData?.rank);
const enemyBase = enemyList.find(e => e.difficulty === stageData?.difficulty && e.rank === enemyRank);

const enemy = useMemo(() => {
if (!enemyBase) return null;
return {
...enemyBase,
hull: Math.round(enemyBase.hull * scale),
shield: Math.round(enemyBase.shield * scale),
attacks: enemyBase.attacks.map(a => Math.round(a * scale)),
};
}, [enemyBase, scale]);

if (!enemy) return <div>エラー: 敵艦データが見つかりません</div>;

// Equipment helpers
const equippedItems = tempPlayer.inventory.filter(i => tempPlayer.equipped.includes(i.id));
const unequippedItems = tempPlayer.inventory.filter(i => !tempPlayer.equipped.includes(i.id));
const usedSlots = equippedItems.reduce((sum, i) => sum + i.slots, 0);

const toggleEquip = (item) => {
const isEquipped = tempPlayer.equipped.includes(item.id);
if (isEquipped) {
setTempPlayer({
...tempPlayer,
equipped: tempPlayer.equipped.filter(id => id !== item.id),
});
} else {
if (usedSlots + item.slots <= tempPlayer.max_slots) {
setTempPlayer({
...tempPlayer,
equipped: [...tempPlayer.equipped, item.id],
});
}
}
};

// Battle stats preview
const preview = useMemo(() => {
const stats = calculateBattleStats(tempPlayer, equippedItems);
return {
long: Math.round(stats.final.LONG),
mid: Math.round(stats.final.MID),
close: Math.round(stats.final.CLOSE),
shield: Math.round(stats.final.SHIELD),
};
}, [tempPlayer, equippedItems]);

// Start combat
const startCombat = () => {
setPlayer(tempPlayer);

const combatResult = runCombat(
  { ...tempPlayer, stage },
  enemy,
  equippedItems
);

// Post-combat processing
let newInventory = tempPlayer.inventory.filter(i => 
  !(tempPlayer.equipped.includes(i.id) && i.disposable)
);

// GROWTH ability
newInventory.forEach(item => {
  if (tempPlayer.equipped.includes(item.id) && hasAbility(item, AB.GR)) {
    const growthVal = getAbilityValue(item);
    item.power += growthVal;
    combatResult.log.push(`${item.name} 成長: +${growthVal} → ${item.power}`);
  }
});

// Hull repair
let finalHull = combatResult.pHull;
if (finalHull > 0 && !combatResult.hasNoRepair && combatResult.hullRepair > 0) {
  const repairAmount = Math.round(combatResult.hullRepair);
  finalHull = Math.min(tempPlayer.max_hull, finalHull + repairAmount);
  combatResult.log.push(`戦闘後処理: 耐久値+${repairAmount}回復 → ${finalHull}HP`);
}

// Update player state
const newEquipped = tempPlayer.equipped.filter(id => newInventory.some(i => i.id === id));
setPlayer({
  ...tempPlayer,
  hull: finalHull,
  inventory: newInventory,
  equipped: newEquipped,
});

// Determine result
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

};

// Handle continue button
const handleContinue = () => {
if (result === ‘clear’ || result === ‘defeat’) {
setScene(‘end’);
} else if (result === ‘victory’) {
setScene(‘reward’);
} else {
advance(‘main’);
}
};

// Active boss rewards display
const activeBonuses = [
tempPlayer.boarding && ‘白兵戦’,
tempPlayer.skirmish && ‘遭遇戦’,
tempPlayer.logistics && ‘兵站’,
tempPlayer.doctrine && ‘教義’,
].filter(Boolean);

// === PREP PHASE ===
if (phase === 'prep') {
return (
<div className="max-w-6xl mx-auto">
<h2 className="text-xl mb-2">{UI.label.stage} {stage} | {UI.label.act} {act}</h2>
<div className="text-xs text-green-600 mb-2">シード: {tempPlayer.seed}</div>

    {/* Status Grid */}
    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
      {/* Player Status */}
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
      
      {/* Enemy Status */}
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
      </div>
    </div>

    {/* Equipped Items */}
    <div className="mb-4">
      <div className="font-bold mb-2">{UI.label.equipped} ({usedSlots}/{tempPlayer.max_slots})</div>
      {equippedItems.map(item => (
        <ItemRow key={item.id} item={item} equipped onClick={() => toggleEquip(item)} />
      ))}
    </div>

    {/* Inventory */}
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

}

// === BATTLE PHASE ===
return (
<div className="max-w-4xl mx-auto">
<pre className="text-xs mb-4 whitespace-pre-wrap">{log.join(’\n’)}</pre>

  {result && (
    <div className="mb-4 text-center text-xl">
      {UI.result[result]}
    </div>
  )}
  
  <button onClick={handleContinue} className="bg-green-700 px-4 py-2 hover:bg-green-600">
    {UI.btn.continue}
  </button>
</div>

);
}

function RewardScene({ player, setPlayer, stage, advance }) {
const act = getAct(stage);
const stageData = getStageData(stage);
const enemyRank = getEnemyRank(stageData?.rank);
const isBoss = enemyRank === R.B;

// Get 3 reward options from pre-shuffled decks
const [options, setOptions] = useState(() => {
const rarityDecks = stageData?.rank === 'N' ? player.normalRarityDecks :
                    stageData?.rank === 'E' ? player.eliteRarityDecks : null;

const rewardItems = [];
for (let i = 0; i < 3; i++) {
  let rarity;
  if (isBoss) {
    rarity = 3; // Boss always gives boss rarity items
  } else if (rarityDecks && rarityDecks[act]?.length > 0) {
    rarity = rarityDecks[act][0]; // Peek at first card
  } else {
    rarity = stageData?.rank === 'E' ? 2 : 1;
  }

  // Get item from appropriate deck
  let deck;
  if (rarity === 3 && player.bossItemsDeck.length > 0) {
    deck = player.bossItemsDeck;
  } else if (rarity === 2 && player.eliteItemsDeck.length > 0) {
    deck = player.eliteItemsDeck;
  } else {
    deck = player.normalItemsDeck;
  }

  if (deck.length > 0) {
    const itemName = deck[i % deck.length];
    const item = equipmentList.find(e => e.name === itemName);
    if (item && !rewardItems.find(r => r.name === item.name)) {
      rewardItems.push(item);
    }
  }
}

// Fallback if not enough unique items
while (rewardItems.length < 3) {
  const fallbackPool = equipmentList.filter(e =>
    e.rarity > 0 && !rewardItems.find(r => r.name === e.name)
  );
  if (fallbackPool.length > 0) {
    rewardItems.push(fallbackPool[0]);
  } else {
    break;
  }
}

return rewardItems;
});
const [selectedItem, setSelectedItem] = useState(null);
const [selectedBonus, setSelectedBonus] = useState(null);

// Get available boss rewards (first 3 from shuffled pool for ACT I/II)
const availableBossRewards = isBoss && act <= 2 ? player.bossRewards.slice(0, 3) : [];

// Active boss rewards
const activeBonuses = [
player.boarding && ‘白兵戦’,
player.skirmish && ‘遭遇戦’,
player.logistics && ‘兵站’,
player.doctrine && ‘教義’,
].filter(Boolean);

const claim = () => {
const newPlayer = { ...player };

// Add selected item
if (selectedItem) {
  newPlayer.inventory = [...player.inventory, createItem(selectedItem, player.itemIdCounter)];

  // Consume from appropriate deck
  const selectedItemData = options.find(o => o.name === selectedItem);
  if (selectedItemData) {
    const rarity = selectedItemData.rarity;
    if (rarity === 3) {
      newPlayer.bossItemsDeck = player.bossItemsDeck.filter(name => name !== selectedItem);
    } else if (rarity === 2) {
      newPlayer.eliteItemsDeck = player.eliteItemsDeck.filter(name => name !== selectedItem);
    } else {
      newPlayer.normalItemsDeck = player.normalItemsDeck.filter(name => name !== selectedItem);
    }
  }

  // Consume rarity cards (3 cards per reward choice)
  if (!isBoss && stageData?.rank === 'N') {
    newPlayer.normalRarityDecks = { ...player.normalRarityDecks };
    newPlayer.normalRarityDecks[act] = player.normalRarityDecks[act]?.slice(3) || [];
  } else if (!isBoss && stageData?.rank === 'E') {
    newPlayer.eliteRarityDecks = { ...player.eliteRarityDecks };
    newPlayer.eliteRarityDecks[act] = player.eliteRarityDecks[act]?.slice(3) || [];
  }
}

// Apply boss reward
if (isBoss) {
  newPlayer.hull = newPlayer.max_hull; // Full repair

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

    // Remove claimed reward from pool
    newPlayer.bossRewards = player.bossRewards.filter(r => r !== selectedBonus);
  }
}

setPlayer(newPlayer);
advance('main');

};

const canClaim = selectedItem && (!isBoss || !availableBossRewards.length || selectedBonus);

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-xl mb-2">{UI.label.reward}</h2>
<div className="text-xs text-green-600 mb-4">シード: {player.seed}</div>

  {/* Item Selection */}
  <div className="mb-4">
    <div className="font-bold mb-2">1つ選択:</div>
    {options.map(item => (
      <div
        key={item.name}
        className="text-xs cursor-pointer hover:bg-green-900 mb-1"
        onClick={() => setSelectedItem(item.name)}
      >
        {selectedItem === item.name ? '✓' : '○'} [{item.slots}] <ItemInfo item={item} />
      </div>
    ))}
  </div>

  {/* Boss Reward Selection */}
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

  {/* Player Status & Inventory */}
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
      <ItemRow key={item.id} item={item} />
    ))}
  </div>
</div>

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
setScrapItems([...scrapItems, itemId]);
}
};

const handleRepair = () => {
if (scrapItems.length !== scrapCost) return;

const repair = Math.floor(player.max_hull * 0.3);
const newInventory = player.inventory.filter(i => !scrapItems.includes(i.id));

setPlayer({
  ...player,
  hull: Math.min(player.max_hull, player.hull + repair),
  inventory: newInventory,
  equipped: player.equipped.filter(id => newInventory.some(i => i.id === id)),
});
advance('main');

};

const handleFabricate = () => {
setPlayer({
...player,
max_hull: player.max_hull - 10,
hull: Math.max(1, player.hull - 10),
inventory: [...player.inventory, createItem("🚀 ランス", player.itemIdCounter)],
});
advance('main');
};

const handleLeave = () => advance(‘main’);

// Active boss rewards
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

  {/* Player Status */}
  <div className="mb-4 text-sm">
    <div className="font-bold mb-2">スターキャナイン</div>
    <div>{UI.label.hull}: {Math.round(player.hull)}/{player.max_hull}</div>
    <div>{UI.label.slots}: {player.max_slots}</div>
    {activeBonuses.length > 0 && (
      <div className="text-xs mt-1">{UI.label.bossReward}: {activeBonuses.join(' ')}</div>
    )}
  </div>

  <div className="mb-6 space-y-4">
    {/* Option 1: Repair */}
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

    {/* Option 2: Fabricate */}
    <div className="border border-green-700 p-3">
      <div className="font-bold mb-2">2. {UI.dock.fabricate.title}</div>
      <div className="text-sm mb-2">{UI.dock.fabricate.desc}</div>
      <button onClick={handleFabricate} className="bg-yellow-700 px-4 py-2 hover:bg-yellow-600">
        {UI.btn.fabricate} (−10 最大HP)
      </button>
    </div>

    {/* Option 3: Leave */}
    <div className="border border-green-700 p-3">
      <div className="font-bold mb-2">3. {UI.dock.leave.title}</div>
      <div className="text-sm mb-2">{UI.dock.leave.desc}</div>
      <button onClick={handleLeave} className="bg-green-700 px-4 py-2 hover:bg-green-600">
        {UI.btn.leave}
      </button>
    </div>
  </div>
</div>

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

  {cleared && (
    <pre className="text-xs mb-4 whitespace-pre-wrap text-center">{STORY.victory}</pre>
  )}

  {!cleared && (
    <div className="mb-4 text-center">{UI.label.stage}: {stage}</div>
  )}

  {/* Seed Display for Replay */}
  <div className="mb-4 text-center text-green-600">
    <span className="text-xs">シード: </span>
    <span className="font-bold">{player.seed}</span>
  </div>

  {/* Final Status */}
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

);
}

// ============================================================================
// SECTION 10: SHARED UI COMPONENTS
// ============================================================================

function ItemRow({ item, equipped = false, onClick, showId = true }) {
return (
<div
className={`text-xs mb-1 ${onClick ? 'cursor-pointer hover:bg-green-900' : ''}`}
onClick={onClick}
>
{equipped && '✓ '}{showId && <span className="text-green-600">#{item.id} </span>}[{item.slots}] <ItemInfo item={item} />
</div>
);
}

function ItemInfo({ item }) {
const parts = [
item.name,
‘|’,
getTypeName(item.type),
`${UI.label.power}:${item.power}`,
];

if (item.disposable) parts.push(‘💥’);
if (item.mult) parts.push(formatMult(item.mult));
if (item.ability) parts.push(formatAbility(item.ability));

return <>{parts.join(’ ’)}</>;
}
