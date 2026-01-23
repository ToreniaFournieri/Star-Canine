#!/usr/bin/env node
// ============================================================================
// STAR CANINE - HEADLESS ENGINE FOR AI TESTING
// ============================================================================
// Run with: node headless_engine.js [seed]
// Example:  node headless_engine.js 12345
// ============================================================================

// ============================================================================
// SECTION 1: CONSTANTS & TYPE DEFINITIONS
// ============================================================================

const R = { N: 'NORMAL', E: 'ELITE', B: 'BOSS' };

const T = {
  L: { id: 'LONG',   name: '長距離武装' },
  M: { id: 'MID',    name: '中距離武装' },
  C: { id: 'CLOSE',  name: '近距離武装' },
  S: { id: 'SHIELD', name: 'シールド' },
  H: { id: 'HULL',   name: '耐久補助' },
  X: { id: 'MODULE', name: 'モジュール' },
};

const RANGE = { LONG: '長距離', MID: '中距離', CLOSE: '近距離' };
const RANK  = { NORMAL: '通常', ELITE: 'エリート', BOSS: 'ボス' };

// ============================================================================
// SECTION 2: SKILLS & ABILITIES
// ============================================================================

const SK = {
  GATE: { id: 'GATE',     name: '防壁',   desc: "ターン終了時、シールドを指定値まで再生成する。" },
  REG:  { id: 'REGEN',    name: '自己修復', desc: "毎ターン、耐久値を回復する。" },
  DEG:  { id: 'DEGEN',    name: '腐食',   desc: "毎ターン、耐久値が減少する。" },
  EXP:  { id: 'EXPLOSIVE', name: '自爆',  desc: "第4ターンに固定ダメージの自爆攻撃を行い、自壊する。" },
  OVR:  { id: 'OVERLOAD', name: '過負荷', desc: "第4ターン以降、攻撃ダメージが上昇する。" },
  DOR:  { id: 'DORMANT',  name: '休眠',   desc: "第4ターン以降、攻撃を停止する。" },
  CL:   { id: 'COUNTER_LONG', name: '迎撃', desc: "長距離攻撃を受けた際、長距離武装数×指定値で反撃する。" },
};

const AB = {
  SH:  { id: 'SHIELD',      name: 'シールド加算', format: (v) => `+${v}シールド` },
  AM:  { id: 'ALL_MID',     name: '中距離強化',   format: (v) => `中距離+${v}` },
  SIM: { id: 'SIMULTANEOUS', name: '同時攻撃',    format: () => '同時攻撃' },
  NR:  { id: 'NO_REPAIR',   name: '修復無効',     format: () => '修復無効' },
  LS:  { id: 'LIFE_STEAL',  name: '生命吸収',     format: () => '生命吸収' },
  GR:  { id: 'GROWTH',      name: '成長',         format: (v) => `成長+${v}` },
  SB:  { id: 'SHIELD_BREAK', name: 'シールド破壊', format: () => 'シールド破壊' },
  BF:  { id: 'BACKFIRE',    name: '反動',         format: (v) => `反動${v}` },
};

const BR = {
  expansion:     { name: '拡張',   desc: "装備スロット最大値+2。" },
  reinforcement: { name: '強化',   desc: "装備スロット最大値+1、耐久値最大値+50。" },
  boarding:      { name: '白兵戦', desc: "装備スロット最大値+1。第5・第6ターンを近距離に固定。" },
  skirmish:      { name: '遭遇戦', desc: "装備スロット最大値+1。第4ターンを中距離に変更。" },
  logistics:     { name: '兵站',   desc: "戦闘開始前に🚀 ランスを1基追加する。" },
  doctrine:      { name: '教義',   desc: "耐久値最大値+60。すべての武装ダメージ×1.2。" },
};

// ============================================================================
// SECTION 3: GAME DATA
// ============================================================================

// Schema: [slots, name, power, type, rarity, disposable, mult, ability]
const EQ = [
  [1, "🗑️ スクラップ", 0, T.X, 0, 0, null, null],
  [1, "🚀 ランス", 40, T.L, 0, 1, null, null],
  [1, "🚀 メテオ", 45, T.L, 1, 1, null, null],
  [2, "🚀🛡️ インターセプター", 50, T.L, 1, 1, null, [AB.SH, 10]],
  [2, "🚀❗ ハープーン", 66, T.L, 1, 1, null, [AB.BF, 10]],
  [2, "🚀⚠️ アイソレーション", 75, T.L, 1, 1, [T.L, 0.9], null],
  [2, "🚀🔺 ジャベリン", 39, T.L, 1, 1, [T.L, 1.2], null],
  [2, "🚀🔺 ギャンビット", 55, T.L, 2, 1, [T.L, 1.3], null],
  [1, "🔫 クァンタム・ディスプレーサー", 40, T.L, 3, 0, [T.C, 0.5], null],
  [1, "✈️ ドローン", 12, T.M, 1, 0, null, null],
  [1, "✈️⚠️ スカベンジャー", 20, T.M, 1, 0, [T.M, 0.9], null],
  [1, "✈️🔺 スクアドラル", 8, T.M, 1, 0, [T.M, 1.2], null],
  [1, "✈️⤴️ ルーキー・ファイター", 5, T.M, 1, 0, null, [AB.GR, 2]],
  [1, "✈️✈️ ブルーウルフ", 20, T.M, 2, 0, null, null],
  [1, "⚡ クロウ", 10, T.C, 0, 0, null, null],
  [1, "⚡🩸 ファング", 8, T.C, 1, 0, null, [AB.LS]],
  [1, "⚡⚠️ スタティック・ブレード", 22, T.C, 1, 0, [T.C, 0.9], null],
  [1, "⚡🛡️ アイアン・ビーム", 5, T.C, 2, 0, null, [AB.SH, 10]],
  [1, "⚡ カジェル", 25, T.C, 2, 0, null, null],
  [1, "⚡🔺 ブースト・レーザー", 10, T.C, 1, 0, [T.C, 1.2], null],
  [1, "⚡🪓 シールド・ブレイカー", 3, T.C, 2, 1, null, [AB.SB]],
  [1, "🛡️ 装甲板", 14, T.S, 0, 0, null, null],
  [1, "🛡️ ヴェール", 17, T.S, 1, 0, null, null],
  [1, "🛡️⚠️ バルクヘッド", 25, T.S, 1, 0, [T.S, 0.9], null],
  [1, "🛡️💥 エフェメラ・シールド", 33, T.S, 1, 1, null, null],
  [1, "🛡️🛡️ イージス", 30, T.S, 2, 0, null, null],
  [1, "🛡️🔺 バリアー", 13, T.S, 2, 0, [T.S, 1.2], null],
  [1, "🔧 リペアラー", 10, T.H, 1, 0, null, null],
  [1, "🔧🔧 ベテラン・リペアラー", 15, T.H, 2, 0, null, null],
  [2, "🔥🔺 弾頭最適化装置", 0, T.X, 3, 0, [T.L, 2.0], null],
  [1, "🛫🔺 スウォーム・コア", 0, T.X, 3, 0, [T.L, 0.5], [AB.AM, 10]],
  [1, "🏗️🔺 スウォーム・ハンガー", 0, T.X, 3, 0, [T.M, 2.0], [AB.NR]],
  [1, "💎🔺 プリズマティック・フォーカス", 0, T.X, 3, 0, [T.C, 2.0], [AB.SIM]],
  [1, "🟫🔺 ダブルシールド", 0, T.X, 3, 0, [T.S, 2.0], null],
  [1, "♨️🔺 娯楽施設", 2, T.X, 2, 0, [T.H, 2.0], null],
];

// Schema: [difficulty, name, hull, shield, rank, attacks[L,M,C], skills]
const EN = [
  [1, "スカミッシャー", 30, 0, R.N, [0, 0, 10], []],
  [2, "ドリフター", 31, 5, R.N, [20, 0, 10], [[SK.GATE, 5]]],
  [3, "自己修復機", 40, 10, R.N, [0, 15, 5], [[SK.REG, 8]]],
  [4, "ゾンビ", 25, 80, R.N, [5, 20, 0], [[SK.DEG, 5]]],
  [5, "遺物哨戒機", 60, 30, R.N, [30, 30, 0], [[SK.DOR, 0]]],
  [5, "特攻フリゲート", 10, 100, R.N, [0, 0, 0], [[SK.EXP, 60]]],
  [6, "シールド・ゲート", 55, 20, R.E, [15, 15, 20], [[SK.GATE, 20]]],
  [8, "オーバーロード・エンフォーサー", 70, 30, R.E, [20, 20, 25], [[SK.OVR, 2.0]]],
  [9, "セレスティアル・リーパー", 100, 60, R.B, [40, 20, 35], [[SK.CL, 10]]],
];

// Schema: [stage, type, difficulty, rank]
const ST = [
  [1, 'C', 1, R.N], [2, 'C', 2, R.N], [3, 'C', 6, R.E],
  [4, 'D', 0, null],
  [5, 'C', 3, R.N], [6, 'C', 4, R.N], [7, 'C', 8, R.E], [8, 'C', 5, R.N],
  [9, 'D', 0, null],
  [10, 'C', 9, R.B],
];

// ============================================================================
// SECTION 4: DATA PARSERS & HELPERS
// ============================================================================

const EQ_SCHEMA = ['slots', 'name', 'power', 'type', 'rarity', 'disposable', 'mult', 'ability'];
const EN_SCHEMA = ['difficulty', 'name', 'hull', 'shield', 'rank', 'attacks', 'skills'];
const ST_SCHEMA = ['stage', 'type', 'difficulty', 'rank'];

const parse = (schema, data) => data.map(row => {
  const obj = {};
  schema.forEach((key, i) => obj[key] = row[i]);
  return obj;
});

const equipmentList = parse(EQ_SCHEMA, EQ);
const enemyList = parse(EN_SCHEMA, EN);
const stageList = parse(ST_SCHEMA, ST);

const getAct = (stage) => Math.floor((stage - 1) / 10) + 1;
const getStageInAct = (stage) => ((stage - 1) % 10) + 1;
const getActScale = (act) => [1, 1.5, 2][act - 1] || 1;

const getTypeName = (type) => type?.name || String(type);
const getTypeId = (type) => type?.id || String(type);
const getRangeName = (range) => RANGE[range] || range;

const applyDamage = (dmg, shield, hull) => {
  const toShield = Math.min(shield, dmg);
  return {
    shield: Math.max(0, shield - dmg),
    hull: Math.max(0, hull - (dmg - toShield)),
  };
};

const hasAbility = (item, abilityType) => {
  if (!item.ability) return false;
  const ab = Array.isArray(item.ability) ? item.ability[0] : item.ability;
  return ab === abilityType || ab?.id === abilityType?.id;
};

const getAbilityValue = (item) => {
  if (!item.ability || !Array.isArray(item.ability)) return null;
  return item.ability[1];
};

const hasSkill = (enemy, skillType) => {
  return enemy.skills.some(([sk]) => sk === skillType || sk?.id === skillType?.id);
};

const getSkillValue = (enemy, skillType) => {
  const skill = enemy.skills.find(([sk]) => sk === skillType || sk?.id === skillType?.id);
  return skill ? skill[1] : null;
};

const getTurnOrder = (player) => {
  const base = ['LONG', 'MID', 'CLOSE', 'CLOSE', 'MID', 'LONG'];
  if (player.boarding) { base[4] = 'CLOSE'; base[5] = 'CLOSE'; }
  if (player.skirmish) { base[3] = 'MID'; }
  return base;
};

// ============================================================================
// SECTION 5: SEEDED PRNG SYSTEM
// ============================================================================

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

const seededShuffle = (array, rng) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

let gameRNG = null;
const initializeRNG = (seed) => { gameRNG = createPRNG(seed); return gameRNG; };
const getRNG = () => gameRNG;
const generateSeed = () => Math.floor(Math.random() * 0xFFFFFFFF);

// ============================================================================
// SECTION 6: ITEM & PLAYER MANAGEMENT
// ============================================================================

const createIdCounter = (start = 0) => {
  let counter = start;
  return {
    next: () => counter++,
    current: () => counter,
  };
};

const createItem = (name, idCounter) => {
  const base = equipmentList.find(e => e.name === name);
  if (!base) return null;
  return { ...base, id: idCounter.next() };
};

const createInitialPlayer = (seed) => {
  const actualSeed = seed !== null ? seed : generateSeed();
  initializeRNG(actualSeed);
  const idCounter = createIdCounter(0);

  return {
    seed: actualSeed,
    itemIdCounter: idCounter,
    max_hull: 200,
    hull: 200,
    max_slots: 6,
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
    logistics: false,
    boarding: false,
    skirmish: false,
    doctrine: false,
    bossRewardsAct1: ['expansion', 'reinforcement', 'boarding'],
    bossRewardsAct2: ['skirmish', 'logistics', 'doctrine'],
  };
};

// ============================================================================
// SECTION 7: COMBAT ENGINE
// ============================================================================

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
  const longCount = equippedItems.filter(i => getTypeId(i.type) === 'LONG').length;

  let pShield = Math.round(stats.final.SHIELD);
  let pHull = Math.round(player.hull);
  let eShield = Math.round(enemy.shield);
  let eHull = Math.round(enemy.hull);

  log.push(`=== ACT ${getAct(player.stage)} | ステージ ${player.stage} | ${enemy.name} ===`);
  log.push(`自機: ${pHull}HP | シールド:${pShield}`);
  log.push(`敵艦: ${eHull}HP | シールド:${eShield}`);
  log.push(`攻撃力: 長${Math.round(stats.final.LONG)} 中${Math.round(stats.final.MID)} 近${Math.round(stats.final.CLOSE)}`);
  log.push('');

  for (let turn = 0; turn < 6; turn++) {
    const range = turns[turn];
    log.push(`--- T${turn + 1}: ${getRangeName(range)} ---`);

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
            break;
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
      log.push(`  迎撃: ${counterDmg}ダメージ → ${beforeCounter}HP → ${pHull}HP`);
      if (pHull <= 0) {
        log.push(`  自機撃破を確認。`);
        break;
      }
    }

    if (!hasSimultaneous && eHull <= 0) {
      log.push(`  敵艦撃破を確認。`);
      break;
    }

    if (hasSkill(enemy, SK.REG)) {
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

    if (turn === 3 && hasSkill(enemy, SK.EXP)) {
      const expVal = getSkillValue(enemy, SK.EXP);
      eDmg += expVal;
      log.push(`  自爆: +${expVal}ダメージ`);
    }

    if (eDmg > 0) {
      const beforeEnemyAtk = pHull;
      const eDmgResult = applyDamage(eDmg, pShield, pHull);
      pShield = Math.round(eDmgResult.shield);
      pHull = Math.round(eDmgResult.hull);
      log.push(`  敵艦攻撃: ${eDmg}ダメージ → ${beforeEnemyAtk}HP → ${pHull}HP`);
    }

    if (turn === 3 && hasSkill(enemy, SK.EXP)) {
      eHull = 0;
      log.push(`  自爆: 敵艦自壊`);
    }

    if (hasSimultaneous) {
      if (eHull <= 0) log.push(`  敵艦撃破（同時）`);
      if (pHull <= 0) log.push(`  自機撃破（同時）`);
      if (eHull <= 0 || pHull <= 0) break;
    } else if (pHull <= 0) {
      log.push(`  自機撃破を確認。`);
      break;
    }

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

  log.push(`=== 戦闘終了 ===`);

  return { log, pHull, pShield, eHull, hasNoRepair, hullRepair: stats.final.HULL };
};

// ============================================================================
// SECTION 8: AI DECISION ENGINE
// ============================================================================

const AI = {
  // Analyze enemy and recommend strategy
  analyzeEnemy: (enemy, turnOrder) => {
    const dominated = [];
    const analysis = [];

    // Check which ranges enemy attacks
    const enemyRanges = [];
    if (enemy.attacks[0] > 0) enemyRanges.push({ range: 'LONG', dmg: enemy.attacks[0] });
    if (enemy.attacks[1] > 0) enemyRanges.push({ range: 'MID', dmg: enemy.attacks[1] });
    if (enemy.attacks[2] > 0) enemyRanges.push({ range: 'CLOSE', dmg: enemy.attacks[2] });

    analysis.push(`Enemy HP: ${enemy.hull}, Shield: ${enemy.shield}, Total: ${enemy.hull + enemy.shield}`);
    analysis.push(`Enemy attacks: L:${enemy.attacks[0]} M:${enemy.attacks[1]} C:${enemy.attacks[2]}`);

    // Check skills
    if (hasSkill(enemy, SK.GATE)) {
      analysis.push(`Has GATE(${getSkillValue(enemy, SK.GATE)}): Shield regenerates each turn`);
    }
    if (hasSkill(enemy, SK.REG)) {
      analysis.push(`Has REGEN(${getSkillValue(enemy, SK.REG)}): Heals each turn`);
    }
    if (hasSkill(enemy, SK.EXP)) {
      analysis.push(`Has EXPLOSIVE(${getSkillValue(enemy, SK.EXP)}): Explodes T4, must kill before!`);
    }
    if (hasSkill(enemy, SK.CL)) {
      analysis.push(`Has COUNTER_LONG(${getSkillValue(enemy, SK.CL)}): Counters LONG attacks!`);
    }
    if (hasSkill(enemy, SK.DOR)) {
      analysis.push(`Has DORMANT: Stops attacking after T3`);
    }
    if (hasSkill(enemy, SK.OVR)) {
      analysis.push(`Has OVERLOAD(${getSkillValue(enemy, SK.OVR)}): Damage increases after T3`);
    }

    return analysis;
  },

  // Calculate expected damage for a loadout
  simulateCombat: (player, enemy, itemIds) => {
    const items = itemIds.map(id => player.inventory.find(i => i.id === id)).filter(Boolean);
    const stats = calculateBattleStats(player, items);
    const turns = getTurnOrder(player);

    let totalDamage = 0;
    let totalEnemyDamage = 0;
    let killTurn = -1;
    let eHp = enemy.hull + enemy.shield;

    for (let t = 0; t < 6; t++) {
      const range = turns[t];
      const dmg = stats.final[range];
      totalDamage += dmg;
      eHp -= dmg;

      if (eHp <= 0 && killTurn === -1) {
        killTurn = t + 1;
      }

      // Estimate enemy damage (simplified)
      const eDmg = enemy.attacks[['LONG', 'MID', 'CLOSE'].indexOf(range)];
      if (killTurn === -1) {
        totalEnemyDamage += eDmg;
      }
    }

    return {
      totalDamage,
      totalEnemyDamage,
      killTurn,
      stats: {
        long: Math.round(stats.final.LONG),
        mid: Math.round(stats.final.MID),
        close: Math.round(stats.final.CLOSE),
        shield: Math.round(stats.final.SHIELD),
      },
      slots: items.reduce((sum, i) => sum + i.slots, 0),
    };
  },

  // Choose best equipment loadout
  chooseEquipment: (player, enemy) => {
    const reasoning = [];
    const turnOrder = getTurnOrder(player);

    reasoning.push('=== AI ANALYZING ===');
    reasoning.push(...AI.analyzeEnemy(enemy, turnOrder));
    reasoning.push('');
    reasoning.push(`Turn order: ${turnOrder.join('→')}`);
    reasoning.push(`Available slots: ${player.max_slots}`);
    reasoning.push('');

    // Get usable items (not scrap)
    const usableItems = player.inventory.filter(i =>
      getTypeId(i.type) !== 'MODULE' || i.power > 0 || i.mult || i.ability
    );

    // Try different combinations (greedy approach)
    let bestLoadout = [];
    let bestScore = -Infinity;
    let bestSim = null;

    // Strategy 1: Maximize damage for kill turn
    const byType = {
      LONG: usableItems.filter(i => getTypeId(i.type) === 'LONG'),
      MID: usableItems.filter(i => getTypeId(i.type) === 'MID'),
      CLOSE: usableItems.filter(i => getTypeId(i.type) === 'CLOSE'),
      SHIELD: usableItems.filter(i => getTypeId(i.type) === 'SHIELD'),
      HULL: usableItems.filter(i => getTypeId(i.type) === 'HULL'),
    };

    // Simple greedy: prioritize weapons for early turns
    const candidates = [];

    // Add all missiles (LONG) - turn 1 and 6
    byType.LONG.forEach(i => candidates.push({ item: i, priority: 10 }));

    // Add CLOSE weapons - turn 3 and 4
    byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 8 }));

    // Add shields
    byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 5 }));

    // Add MID
    byType.MID.forEach(i => candidates.push({ item: i, priority: 6 }));

    // Sort by priority and fit into slots
    candidates.sort((a, b) => b.priority - a.priority);

    let usedSlots = 0;
    const selected = [];

    for (const c of candidates) {
      if (usedSlots + c.item.slots <= player.max_slots) {
        selected.push(c.item.id);
        usedSlots += c.item.slots;
      }
    }

    const sim = AI.simulateCombat(player, enemy, selected);

    reasoning.push('=== AI STRATEGY ===');
    reasoning.push(`Selected ${selected.length} items using ${usedSlots}/${player.max_slots} slots`);
    reasoning.push(`Expected damage: L:${sim.stats.long} M:${sim.stats.mid} C:${sim.stats.close}`);
    reasoning.push(`Expected shield: ${sim.stats.shield}`);
    reasoning.push(`Kill turn: ${sim.killTurn > 0 ? 'T' + sim.killTurn : 'Cannot kill in 6 turns'}`);
    reasoning.push(`Expected damage taken: ~${sim.totalEnemyDamage}`);
    reasoning.push('');

    reasoning.push('=== AI DECISION ===');
    reasoning.push(`Equip items: [${selected.join(', ')}]`);

    return { itemIds: selected, reasoning, simulation: sim };
  },

  // Choose reward item
  chooseReward: (player, options, enemy) => {
    const reasoning = [];
    reasoning.push('=== AI REWARD ANALYSIS ===');

    // Score each option
    const scored = options.map((item, idx) => {
      let score = 0;
      const notes = [];

      // Base value from power
      score += item.power * 2;
      notes.push(`Power: ${item.power}`);

      // Prefer non-disposable
      if (!item.disposable) {
        score += 20;
        notes.push('Permanent (+20)');
      }

      // Value abilities
      if (item.ability) {
        if (hasAbility(item, AB.LS)) { score += 30; notes.push('Life steal (+30)'); }
        if (hasAbility(item, AB.GR)) { score += 25; notes.push('Growth (+25)'); }
        if (hasAbility(item, AB.SH)) { score += 15; notes.push('Shield bonus (+15)'); }
        if (hasAbility(item, AB.SB)) { score += 20; notes.push('Shield break (+20)'); }
      }

      // Prefer efficient slot usage
      if (item.slots === 1) {
        score += 10;
        notes.push('1-slot efficient (+10)');
      }

      reasoning.push(`Option ${idx}: ${item.name}`);
      reasoning.push(`  Score: ${score} (${notes.join(', ')})`);

      return { item, score, idx };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    reasoning.push('');
    reasoning.push(`=== AI DECISION ===`);
    reasoning.push(`Choose: ${best.item.name} (score: ${best.score})`);

    return { choice: best.item.name, reasoning };
  },

  // Choose boss reward
  chooseBossReward: (player, available) => {
    const reasoning = [];
    reasoning.push('=== AI BOSS REWARD ANALYSIS ===');

    const scores = {
      expansion: 80,      // +2 slots is very strong
      reinforcement: 70,  // +1 slot +50 HP
      boarding: 60,       // +1 slot + close combat turns
      skirmish: 55,       // +1 slot + mid turn
      logistics: 50,      // Free missile each fight
      doctrine: 75,       // +60 HP + 1.2x damage
    };

    available.forEach(id => {
      reasoning.push(`${BR[id].name}: ${BR[id].desc} (score: ${scores[id]})`);
    });

    const best = available.reduce((a, b) => scores[a] > scores[b] ? a : b);

    reasoning.push('');
    reasoning.push(`=== AI DECISION ===`);
    reasoning.push(`Choose: ${BR[best].name}`);

    return { choice: best, reasoning };
  },

  // Choose dock action
  chooseDockAction: (player, stage) => {
    const reasoning = [];
    const act = getAct(stage);
    const scrapCost = act;
    const hpPercent = player.hull / player.max_hull;

    reasoning.push('=== AI DOCK ANALYSIS ===');
    reasoning.push(`HP: ${player.hull}/${player.max_hull} (${Math.round(hpPercent * 100)}%)`);
    reasoning.push(`Repair cost: ${scrapCost} items for +${Math.floor(player.max_hull * 0.3)} HP`);
    reasoning.push(`Fabricate: -10 max HP for +1 missile`);

    // Find scrap items
    const scrappable = player.inventory.filter(i =>
      i.name.includes('スクラップ') || (i.power === 0 && getTypeId(i.type) === 'MODULE')
    );

    if (hpPercent < 0.5 && scrappable.length >= scrapCost) {
      // Need repair and have scrap
      const toScrap = scrappable.slice(0, scrapCost).map(i => i.id);
      reasoning.push('');
      reasoning.push('=== AI DECISION ===');
      reasoning.push(`REPAIR: Scrap items [${toScrap.join(', ')}] for HP recovery`);
      return { action: 'REPAIR', scrapIds: toScrap, reasoning };
    } else if (hpPercent > 0.8) {
      // Healthy, maybe fabricate
      reasoning.push('');
      reasoning.push('=== AI DECISION ===');
      reasoning.push('FABRICATE: Trade HP for missile (healthy enough)');
      return { action: 'FABRICATE', reasoning };
    } else {
      reasoning.push('');
      reasoning.push('=== AI DECISION ===');
      reasoning.push('LEAVE: Conserve resources');
      return { action: 'LEAVE', reasoning };
    }
  },
};

// ============================================================================
// SECTION 9: GAME LOOP
// ============================================================================

const runGame = (seed) => {
  const output = [];
  const log = (msg) => { output.push(msg); console.log(msg); };

  log('╔══════════════════════════════════════════════════════════════════╗');
  log('║           STAR CANINE - AI PLAYTHROUGH                          ║');
  log('╚══════════════════════════════════════════════════════════════════╝');
  log('');

  let player = createInitialPlayer(seed);
  log(`Seed: ${player.seed}`);
  log('');

  for (let stage = 1; stage <= 30; stage++) {
    const stageInAct = getStageInAct(stage);
    const stageData = stageList.find(s => s.stage === stageInAct);
    const act = getAct(stage);

    log('══════════════════════════════════════════════════════════════════');
    log(`STAGE ${stage} / 30 | ACT ${act}`);
    log('══════════════════════════════════════════════════════════════════');
    log('');

    if (stageData.type === 'D') {
      // DOCK SCENE
      log('[DOCK EVENT]');
      log(`HP: ${player.hull}/${player.max_hull}`);
      log('');

      const dockDecision = AI.chooseDockAction(player, stage);
      dockDecision.reasoning.forEach(r => log(r));
      log('');

      if (dockDecision.action === 'REPAIR') {
        const repair = Math.floor(player.max_hull * 0.3);
        player.inventory = player.inventory.filter(i => !dockDecision.scrapIds.includes(i.id));
        player.hull = Math.min(player.max_hull, player.hull + repair);
        log(`[RESULT] Repaired +${repair} HP → ${player.hull}/${player.max_hull}`);
      } else if (dockDecision.action === 'FABRICATE') {
        player.max_hull -= 10;
        player.hull = Math.max(1, player.hull - 10);
        const newMissile = createItem("🚀 ランス", player.itemIdCounter);
        player.inventory.push(newMissile);
        log(`[RESULT] Fabricated missile #${newMissile.id}, HP: ${player.hull}/${player.max_hull}`);
      } else {
        log('[RESULT] Left dock without action');
      }
      log('');
      continue;
    }

    // COMBAT SCENE
    const enemyBase = enemyList.find(e => e.difficulty === stageData.difficulty && e.rank === stageData.rank);
    const scale = getActScale(act);
    const enemy = {
      ...enemyBase,
      hull: Math.round(enemyBase.hull * scale),
      shield: Math.round(enemyBase.shield * scale),
      attacks: enemyBase.attacks.map(a => Math.round(a * scale)),
    };

    // Add logistics missile
    if (player.logistics) {
      const logisticsMissile = createItem("🚀 ランス", player.itemIdCounter);
      player.inventory.push(logisticsMissile);
      log(`[LOGISTICS] Added temporary missile #${logisticsMissile.id}`);
    }

    log('[GAME STATE]');
    log(`Player: ${player.hull}/${player.max_hull} HP | Slots: ${player.max_slots}`);
    log(`Enemy: ${enemy.name} (${RANK[enemy.rank]}) | ${enemy.hull} HP | ${enemy.shield} Shield`);
    log(`Enemy attacks: L:${enemy.attacks[0]} M:${enemy.attacks[1]} C:${enemy.attacks[2]}`);
    log('');

    log('[INVENTORY]');
    player.inventory.forEach(item => {
      const typeStr = getTypeName(item.type);
      const dispStr = item.disposable ? ' 💥' : '';
      log(`  #${item.id} [${item.slots}] ${item.name} | ${typeStr} | Power:${item.power}${dispStr}`);
    });
    log('');

    // AI chooses equipment
    const equipDecision = AI.chooseEquipment(player, enemy);
    equipDecision.reasoning.forEach(r => log(r));
    log('');

    // Execute combat
    player.equipped = equipDecision.itemIds;
    const equippedItems = player.inventory.filter(i => player.equipped.includes(i.id));

    log('[COMBAT LOG]');
    const combatResult = runCombat({ ...player, stage }, enemy, equippedItems);
    combatResult.log.forEach(l => log(l));
    log('');

    // Determine outcome
    let outcome;
    if (stage === 30 && combatResult.eHull <= 0 && combatResult.pHull > 0) {
      outcome = 'CLEAR';
    } else if (combatResult.eHull <= 0 && combatResult.pHull > 0) {
      outcome = 'VICTORY';
    } else if (combatResult.pHull <= 0) {
      outcome = 'DEFEAT';
    } else if (enemy.rank === R.B) {
      outcome = 'DEFEAT';
    } else {
      outcome = 'DRAW';
    }

    log(`[RESULT] ${outcome} | HP: ${combatResult.pHull}/${player.max_hull}`);
    log('');

    if (outcome === 'DEFEAT') {
      log('╔══════════════════════════════════════════════════════════════════╗');
      log('║                      GAME OVER                                   ║');
      log(`║  Final Stage: ${stage}                                               ║`);
      log(`║  Seed: ${player.seed}                                         ║`);
      log('╚══════════════════════════════════════════════════════════════════╝');
      return { success: false, stage, seed: player.seed, output };
    }

    if (outcome === 'CLEAR') {
      log('╔══════════════════════════════════════════════════════════════════╗');
      log('║                   🎉 VICTORY! LAIKA RESCUED! 🎉                  ║');
      log(`║  Seed: ${player.seed}                                         ║`);
      log('╚══════════════════════════════════════════════════════════════════╝');
      return { success: true, stage: 30, seed: player.seed, output };
    }

    // Post-combat processing
    let newInventory = player.inventory.filter(i =>
      !(player.equipped.includes(i.id) && i.disposable)
    );

    // Growth
    newInventory.forEach(item => {
      if (player.equipped.includes(item.id) && hasAbility(item, AB.GR)) {
        const growthVal = getAbilityValue(item);
        item.power += growthVal;
        log(`[GROWTH] ${item.name} +${growthVal} → Power:${item.power}`);
      }
    });

    // Repair
    let finalHull = combatResult.pHull;
    if (finalHull > 0 && !combatResult.hasNoRepair && combatResult.hullRepair > 0) {
      const repairAmount = Math.round(combatResult.hullRepair);
      finalHull = Math.min(player.max_hull, finalHull + repairAmount);
      log(`[REPAIR] +${repairAmount} HP → ${finalHull}/${player.max_hull}`);
    }

    player.hull = finalHull;
    player.inventory = newInventory;
    player.equipped = [];

    // REWARD SCENE
    if (outcome === 'VICTORY' || outcome === 'DRAW') {
      const rarityMap = { NORMAL: 1, ELITE: 2, BOSS: 3 };
      const targetRarity = rarityMap[enemy.rank] || 1;
      const pool = equipmentList.filter(e => e.rarity === targetRarity);
      const options = seededShuffle(pool, getRNG()).slice(0, 3);

      log('[REWARD OPTIONS]');
      options.forEach((item, idx) => {
        log(`  ${idx}: ${item.name} | ${getTypeName(item.type)} | Power:${item.power}`);
      });
      log('');

      const rewardDecision = AI.chooseReward(player, options, enemy);
      rewardDecision.reasoning.forEach(r => log(r));
      log('');

      const newItem = createItem(rewardDecision.choice, player.itemIdCounter);
      player.inventory.push(newItem);
      log(`[ACQUIRED] #${newItem.id} ${newItem.name}`);
      log('');

      // Boss reward
      if (enemy.rank === R.B) {
        player.hull = player.max_hull;
        log('[BOSS BONUS] Full HP restore');

        const bossRewards = act === 1 ? player.bossRewardsAct1 :
                           act === 2 ? player.bossRewardsAct2 : [];

        if (bossRewards.length > 0) {
          const bossDecision = AI.chooseBossReward(player, bossRewards);
          bossDecision.reasoning.forEach(r => log(r));
          log('');

          const chosen = bossDecision.choice;
          switch (chosen) {
            case 'expansion':
              player.max_slots += 2;
              break;
            case 'reinforcement':
              player.max_slots += 1;
              player.max_hull += 50;
              player.hull += 50;
              break;
            case 'boarding':
              player.max_slots += 1;
              player.boarding = true;
              break;
            case 'skirmish':
              player.max_slots += 1;
              player.skirmish = true;
              break;
            case 'logistics':
              player.logistics = true;
              break;
            case 'doctrine':
              player.max_hull += 60;
              player.hull += 60;
              player.doctrine = true;
              break;
          }

          if (act === 1) {
            player.bossRewardsAct1 = player.bossRewardsAct1.filter(r => r !== chosen);
          } else if (act === 2) {
            player.bossRewardsAct2 = player.bossRewardsAct2.filter(r => r !== chosen);
          }

          log(`[BOSS REWARD] ${BR[chosen].name}: ${BR[chosen].desc}`);
          log('');
        }
      }
    }
  }

  return { success: false, stage: 30, seed: player.seed, output };
};

// ============================================================================
// SECTION 10: MAIN
// ============================================================================

const main = () => {
  const args = process.argv.slice(2);
  const seed = args[0] ? parseInt(args[0], 10) : null;

  const result = runGame(seed);

  console.log('');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('FINAL RESULT');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log(`Success: ${result.success}`);
  console.log(`Final Stage: ${result.stage}`);
  console.log(`Seed: ${result.seed}`);
};

main();
