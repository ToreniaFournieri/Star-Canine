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
// SECTION 8: AI DECISION ENGINE (STRATEGIC VERSION)
// ============================================================================
// Strategy Guide:
// 1. Early game (Stage 1-2): 1 missile + offensive item. Build CLOSE/MID focus.
// 2. Shield-gate: Use 2 missiles to kill in one turn, else shield up for draw.
// 3. Zombie: Just shield and heal - it dies from DEGEN, safe stage.
// 4. Don't rely on LONG until you get LONG-related boss reward.
// 5. Save 2 missiles for boss stages (10, 20, 30). Full heal after boss!
// ============================================================================

const AI = {
  // Analyze enemy and recommend strategy
  analyzeEnemy: (enemy, turnOrder) => {
    const analysis = [];

    analysis.push(`Enemy HP: ${enemy.hull}, Shield: ${enemy.shield}, Total: ${enemy.hull + enemy.shield}`);
    analysis.push(`Enemy attacks: L:${enemy.attacks[0]} M:${enemy.attacks[1]} C:${enemy.attacks[2]}`);

    // Check skills
    if (hasSkill(enemy, SK.GATE)) {
      analysis.push(`Has GATE(${getSkillValue(enemy, SK.GATE)}): Shield regenerates each turn - BURST DAMAGE NEEDED`);
    }
    if (hasSkill(enemy, SK.REG)) {
      analysis.push(`Has REGEN(${getSkillValue(enemy, SK.REG)}): Heals each turn`);
    }
    if (hasSkill(enemy, SK.DEG)) {
      analysis.push(`Has DEGEN(${getSkillValue(enemy, SK.DEG)}): Self-damage - SAFE STAGE, TURTLE UP`);
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

  // Check if this is a boss stage (10, 20, 30)
  isBossStage: (stage) => {
    const stageInAct = getStageInAct(stage);
    return stageInAct === 10;
  },

  // Check how many stages until next boss
  stagesUntilBoss: (stage) => {
    const stageInAct = getStageInAct(stage);
    return 10 - stageInAct;
  },

  // Count missiles in inventory
  countMissiles: (player) => {
    return player.inventory.filter(i => getTypeId(i.type) === 'LONG' && i.disposable).length;
  },

  // Check if player has LONG-related boss reward
  hasLongBuff: (player) => {
    return player.logistics || player.doctrine;
  },

  // Choose best equipment loadout - STRATEGIC VERSION
  chooseEquipment: (player, enemy) => {
    const reasoning = [];
    const turnOrder = getTurnOrder(player);
    const stage = player.stage || 1;
    const stageInAct = getStageInAct(stage);
    const isBoss = AI.isBossStage(stage);
    const stagesUntilBoss = AI.stagesUntilBoss(stage);
    const missileCount = AI.countMissiles(player);
    const hasLongBuff = AI.hasLongBuff(player);

    reasoning.push('=== AI STRATEGIC ANALYSIS ===');
    reasoning.push(...AI.analyzeEnemy(enemy, turnOrder));
    reasoning.push('');
    reasoning.push(`Stage: ${stage} (${stageInAct}/10 in act) | Boss in: ${stagesUntilBoss} stages`);
    reasoning.push(`Turn order: ${turnOrder.join('→')}`);
    reasoning.push(`Available slots: ${player.max_slots}`);
    reasoning.push(`Missiles in stock: ${missileCount}`);
    reasoning.push(`Has LONG buff (logistics/doctrine): ${hasLongBuff}`);
    reasoning.push('');

    // Get usable items by type
    const usableItems = player.inventory.filter(i =>
      getTypeId(i.type) !== 'MODULE' || i.power > 0 || i.mult || i.ability
    );

    const byType = {
      LONG: usableItems.filter(i => getTypeId(i.type) === 'LONG'),
      MID: usableItems.filter(i => getTypeId(i.type) === 'MID'),
      CLOSE: usableItems.filter(i => getTypeId(i.type) === 'CLOSE'),
      SHIELD: usableItems.filter(i => getTypeId(i.type) === 'SHIELD'),
      HULL: usableItems.filter(i => getTypeId(i.type) === 'HULL'),
      MODULE: usableItems.filter(i => getTypeId(i.type) === 'MODULE'),
    };

    const missiles = byType.LONG.filter(i => i.disposable);
    const permanentLong = byType.LONG.filter(i => !i.disposable);

    const candidates = [];
    let usedSlots = 0;
    const selected = [];

    // ===== STRATEGY: ZOMBIE (DEGEN enemy) - TURTLE UP =====
    if (hasSkill(enemy, SK.DEG)) {
      reasoning.push('>>> ZOMBIE STRATEGY: Shield and heal, let it die from DEGEN <<<');

      // Prioritize shields and hull repair
      byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 100 }));
      byType.HULL.forEach(i => candidates.push({ item: i, priority: 90 }));

      // Add life-steal weapons if available
      byType.CLOSE.filter(i => hasAbility(i, AB.LS)).forEach(i =>
        candidates.push({ item: i, priority: 85 })
      );

      // Some offense to chip away
      byType.CLOSE.filter(i => !hasAbility(i, AB.LS)).forEach(i =>
        candidates.push({ item: i, priority: 30 })
      );
      byType.MID.forEach(i => candidates.push({ item: i, priority: 20 }));

      // NO missiles needed for zombie
      reasoning.push('Conserving missiles for later stages');
    }
    // ===== STRATEGY: OVERLOAD enemy - TRY TO WIN WITHOUT MISSILES =====
    else if (hasSkill(enemy, SK.OVR)) {
      const overloadMult = getSkillValue(enemy, SK.OVR);
      reasoning.push(`>>> OVERLOAD STRATEGY: Damage x${overloadMult} after T3 - prefer CLOSE/MID <<<`);

      const totalEnemyHP = enemy.hull + enemy.shield;

      // Distance-aware missile conservation for OVERLOAD
      let missilesToSave = 2;
      if (stagesUntilBoss >= 5) {
        missilesToSave = 1;
      }
      if (stagesUntilBoss >= 7) {
        missilesToSave = 1;
      }

      // Calculate damage without missiles
      const closeDamage = byType.CLOSE.reduce((sum, i) => sum + i.power, 0);
      const midDamage = byType.MID.reduce((sum, i) => sum + i.power, 0);
      const shieldValue = byType.SHIELD.reduce((sum, i) => sum + i.power, 0);

      // Turn order: LONG, MID, CLOSE, CLOSE, MID, LONG
      // Non-missile damage through 6 turns: MID + CLOSE + CLOSE + MID = 2*MID + 2*CLOSE
      const nonMissileDamage = midDamage * 2 + closeDamage * 2;

      reasoning.push(`CLOSE/MID damage: ${nonMissileDamage} vs ${totalEnemyHP} HP`);
      reasoning.push(`Saving ${missilesToSave} missiles for boss (${stagesUntilBoss} stages away)`);

      // Can we win without missiles?
      if (nonMissileDamage >= totalEnemyHP) {
        reasoning.push('CAN WIN WITHOUT MISSILES: Shield up and use CLOSE/MID');

        byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 100 }));
        byType.MID.forEach(i => candidates.push({ item: i, priority: 95 }));
        byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 80 }));
        byType.HULL.forEach(i => candidates.push({ item: i, priority: 70 }));
        // Don't use missiles
      } else {
        // Need missiles but try to use minimum
        const missilesDamage = missiles.reduce((sum, m) => sum + m.power, 0);
        const totalWithMissiles = nonMissileDamage + missilesDamage * 2; // 2 LONG turns

        reasoning.push(`With missiles: ${totalWithMissiles} vs ${totalEnemyHP} HP`);

        if (missileCount > missilesToSave) {
          // Use excess missiles only
          const excessMissiles = missiles.slice(0, missileCount - missilesToSave);
          reasoning.push(`Using ${excessMissiles.length} excess missiles, keeping ${missilesToSave}`);

          excessMissiles.forEach(i => candidates.push({ item: i, priority: 95 }));
          byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 100 }));
          byType.MID.forEach(i => candidates.push({ item: i, priority: 90 }));
          byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 70 }));
        } else {
          // Not enough missiles, fight defensively and hope for draw
          reasoning.push('LOW ON MISSILES: Defensive stance, might need to draw');

          byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 100 }));
          byType.HULL.forEach(i => candidates.push({ item: i, priority: 90 }));
          byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 80 }));
          byType.MID.forEach(i => candidates.push({ item: i, priority: 75 }));
        }
      }
    }
    // ===== STRATEGY: EXPLOSIVE enemy - KILL BY T4 OR DIE =====
    else if (hasSkill(enemy, SK.EXP)) {
      const explosiveDmg = getSkillValue(enemy, SK.EXP);
      reasoning.push(`>>> EXPLOSIVE STRATEGY: Must kill before T4 or take ${explosiveDmg} damage! <<<`);

      // All out attack
      missiles.forEach(i => candidates.push({ item: i, priority: 100 }));
      permanentLong.forEach(i => candidates.push({ item: i, priority: 95 }));
      byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 90 }));
      byType.MID.forEach(i => candidates.push({ item: i, priority: 85 }));
      byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 70 })); // Shield helps survive explosion
    }
    // ===== STRATEGY: DORMANT enemy - SHIELD UP FOR T1-T3, FREE AFTER =====
    else if (hasSkill(enemy, SK.DOR)) {
      // Calculate T1-T3 damage (LONG, MID, CLOSE)
      const t1t3Damage = enemy.attacks[0] + enemy.attacks[1] + enemy.attacks[2];
      reasoning.push(`Enemy damage T1-T3: ${t1t3Damage} (then stops)`);
      reasoning.push(`Current HP: ${player.hull}`);

      // Check if we can survive the burst with shields
      const totalEnemyHP = enemy.hull + enemy.shield;
      const closeDamage = byType.CLOSE.reduce((sum, i) => sum + i.power, 0);
      const shieldValue = byType.SHIELD.reduce((sum, i) => sum + i.power, 0);

      // Can we survive T1-T3 with shields?
      const canSurviveWithShields = (player.hull + shieldValue) >= t1t3Damage;

      if (canSurviveWithShields) {
        // Safe: shield up and enjoy free turns 4-6
        reasoning.push('>>> DORMANT STRATEGY: Heavy attacks T1-T3, then stops - SHIELD FIRST <<<');
        reasoning.push('Can survive burst with shields - shield up for free turns T4-T6');

        // Prioritize shields to survive the burst
        byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 100 }));
        byType.HULL.forEach(i => candidates.push({ item: i, priority: 90 }));

        // Life steal weapons are great here (heal during/after burst)
        byType.CLOSE.filter(i => hasAbility(i, AB.LS)).forEach(i =>
          candidates.push({ item: i, priority: 95 })
        );

        // Other offense - we have turns 4-6 for free damage
        byType.CLOSE.filter(i => !hasAbility(i, AB.LS)).forEach(i =>
          candidates.push({ item: i, priority: 70 })
        );
        byType.MID.forEach(i => candidates.push({ item: i, priority: 65 }));

        // Only use missiles if we have excess
        if (missileCount > 2) {
          missiles.slice(0, missileCount - 2).forEach(i =>
            candidates.push({ item: i, priority: 60 })
          );
        }
      } else {
        // Danger: can't survive the burst - BURST KILL instead
        reasoning.push('>>> DORMANT BURST STRATEGY: Cannot survive T1-T3 damage - kill fast! <<<');
        reasoning.push(`Cannot survive: ${player.hull} + ${shieldValue} < ${t1t3Damage} damage`);
        reasoning.push('Switch to burst-kill strategy with all available missiles');

        // Use missiles aggressively to kill before T3 ends
        let missilesToSave = 0;
        if (stagesUntilBoss <= 3) {
          missilesToSave = 2;
        } else if (stagesUntilBoss <= 5) {
          missilesToSave = 1;
        }

        const missilesToUse = Math.max(0, missileCount - missilesToSave);
        missiles.slice(0, missilesToUse).forEach(i =>
          candidates.push({ item: i, priority: 100 })
        );

        // Close range for quick kill
        byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 90 }));
        byType.MID.forEach(i => candidates.push({ item: i, priority: 80 }));

        // Minimal shields just for safety
        byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 30 }));
      }
    }
    // ===== STRATEGY: SHIELD-GATE (GATE enemy) - BURST OR DRAW =====
    else if (hasSkill(enemy, SK.GATE)) {
      const gateValue = getSkillValue(enemy, SK.GATE);
      const totalEnemyHP = enemy.hull + enemy.shield;
      const missilesNeeded = 2;

      // Distance-aware missile conservation
      let missilesToSaveForBoss = 2;
      if (stagesUntilBoss >= 5) {
        missilesToSaveForBoss = 1;
      }
      if (stagesUntilBoss >= 7) {
        missilesToSaveForBoss = 1;
      }

      reasoning.push('>>> SHIELD-GATE STRATEGY: Need burst damage or settle for draw <<<');
      reasoning.push(`Gate regenerates to ${gateValue} shield each turn`);

      // Calculate if 2 missiles can kill in T1
      const missileDamage = missiles.slice(0, 2).reduce((sum, m) => sum + m.power, 0);
      const canBurstKill = missileDamage >= totalEnemyHP;

      // Only use missiles if we have enough to spare for boss
      const canAffordMissiles = missileCount >= (missilesNeeded + missilesToSaveForBoss);

      if (canBurstKill && canAffordMissiles) {
        reasoning.push(`CAN BURST: 2 missiles (${missileDamage} dmg) vs ${totalEnemyHP} HP`);
        reasoning.push(`Missiles: ${missileCount} - using 2, saving ${missileCount - 2} for boss`);

        // Use exactly 2 missiles
        missiles.slice(0, 2).forEach(i => candidates.push({ item: i, priority: 100 }));

        // Fill rest with offense
        byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 50 }));
        byType.MID.forEach(i => candidates.push({ item: i, priority: 40 }));
        byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 30 }));
      } else {
        if (!canAffordMissiles) {
          reasoning.push(`SAVING MISSILES: Only ${missileCount} left, need ${missilesToSaveForBoss} for boss`);
        } else {
          reasoning.push(`CANNOT BURST: Missiles (${missileDamage} dmg) < ${totalEnemyHP} HP`);
        }
        reasoning.push('DRAW STRATEGY: Shield up and survive for draw');

        // Prioritize shields for draw
        byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 100 }));
        byType.HULL.forEach(i => candidates.push({ item: i, priority: 90 }));

        // Some offense
        byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 40 }));
        byType.MID.forEach(i => candidates.push({ item: i, priority: 30 }));

        // Don't waste missiles on draw
      }
    }
    // ===== STRATEGY: BOSS STAGE - ALL OUT ATTACK (SMART) =====
    else if (isBoss) {
      reasoning.push('>>> BOSS STRATEGY: Full offense! HP doesn\'t matter, full heal after boss <<<');
      reasoning.push('Even 1 HP remaining is fine - just need to WIN');

      const totalEnemyHP = enemy.hull + enemy.shield;
      const totalEnemyDmg = enemy.attacks.reduce((a, b) => a + b, 0);

      // Calculate our burst damage potential
      const missileDamage = missiles.reduce((sum, m) => sum + m.power, 0);
      const closeDamage = byType.CLOSE.reduce((sum, i) => sum + i.power, 0);
      const midDamage = byType.MID.reduce((sum, i) => sum + i.power, 0);
      const shieldValue = byType.SHIELD.reduce((sum, i) => sum + i.power, 0);

      // Account for counter-long damage
      let counterDmg = 0;
      if (hasSkill(enemy, SK.CL)) {
        const counterVal = getSkillValue(enemy, SK.CL);
        counterDmg = counterVal * missiles.length;
        reasoning.push(`COUNTER_LONG: Will take ${counterDmg} counter damage from ${missiles.length} missiles`);
      }

      // Total damage through 6 turns: L + M + C + C + M + L
      const totalOurDamage = missileDamage * 2 + midDamage * 2 + closeDamage * 2;
      reasoning.push(`Our max damage: ${totalOurDamage} vs ${totalEnemyHP} HP`);

      // Check if we can burst kill on T1
      if (missileDamage >= totalEnemyHP) {
        reasoning.push('CAN T1 KILL: All missiles!');
        missiles.forEach(i => candidates.push({ item: i, priority: 100 }));
        permanentLong.forEach(i => candidates.push({ item: i, priority: 95 }));
        byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 80 }));
        byType.MID.forEach(i => candidates.push({ item: i, priority: 70 }));
        byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 30 }));
      } else {
        // Need sustained damage - balance offense and defense
        reasoning.push('SUSTAINED FIGHT: Need shields to survive to deal damage');

        // Calculate how many turns we need to survive
        const turnsToKill = Math.ceil(totalEnemyHP / (totalOurDamage / 6));
        const expectedDamageTaken = Math.min(turnsToKill, 6) * (totalEnemyDmg / 3) + counterDmg;

        reasoning.push(`Estimated turns to kill: ${turnsToKill}, damage taken: ~${Math.round(expectedDamageTaken)}`);
        reasoning.push(`Current HP: ${player.hull}, Shield value: ${shieldValue}`);

        // Use ALL missiles - we need the damage
        missiles.forEach(i => candidates.push({ item: i, priority: 100 }));
        permanentLong.forEach(i => candidates.push({ item: i, priority: 95 }));

        // Shield break is valuable vs boss shield (60 shield!)
        byType.CLOSE.filter(i => hasAbility(i, AB.SB)).forEach(i =>
          candidates.push({ item: i, priority: 98 })
        );

        // Strong shields are important for survival
        byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 85 }));

        // Offense
        byType.CLOSE.filter(i => !hasAbility(i, AB.SB)).forEach(i =>
          candidates.push({ item: i, priority: 75 })
        );
        byType.MID.forEach(i => candidates.push({ item: i, priority: 70 }));

        // Hull repair for longer fights
        byType.HULL.forEach(i => candidates.push({ item: i, priority: 60 }));
      }
    }
    // ===== STRATEGY: EARLY GAME (Stage 1-9) - BUILD CLOSE/MID =====
    else if (stageInAct <= 9) {
      reasoning.push('>>> EARLY GAME STRATEGY: Focus on CLOSE/MID, conserve missiles for boss <<<');

      // Distance-aware missile conservation
      // Only save 2 if very close to boss or missile count is low
      // Otherwise, use missiles more aggressively early on
      let missilesToSave = 2;
      if (stagesUntilBoss >= 5 && missileCount >= 4) {
        // Plenty of time and plenty of missiles - use them!
        missilesToSave = 1;
      }
      if (stagesUntilBoss >= 7 && missileCount >= 5) {
        // Very early stage with lots of missiles - be aggressive
        missilesToSave = 1;
      }

      const missilesToUse = Math.max(0, missileCount - missilesToSave);

      reasoning.push(`Missiles: ${missileCount} total (${stagesUntilBoss} stages to boss), saving ${missilesToSave}, using ${missilesToUse}`);

      // Early stages (1-2): Use 1 missile + offense
      if (stageInAct <= 2 && missilesToUse >= 1) {
        reasoning.push('Stage 1-2: Use 1 missile + offensive item');
        missiles.slice(0, 1).forEach(i => candidates.push({ item: i, priority: 85 }));
      } else if (!hasLongBuff) {
        // Don't use LONG without buff
        reasoning.push('No LONG buff yet - avoiding missiles');
      } else {
        // With LONG buff, can use some missiles
        missiles.slice(0, missilesToUse).forEach(i => candidates.push({ item: i, priority: 70 }));
      }

      // Permanent LONG only with buff
      if (hasLongBuff) {
        permanentLong.forEach(i => candidates.push({ item: i, priority: 60 }));
      }

      // Prioritize CLOSE and MID
      byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 80 }));
      byType.MID.forEach(i => candidates.push({ item: i, priority: 75 }));

      // Life steal is great for sustain
      byType.CLOSE.filter(i => hasAbility(i, AB.LS)).forEach(i => {
        const existing = candidates.find(c => c.item.id === i.id);
        if (existing) existing.priority = 90;
      });

      // Shields for defense
      byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 50 }));
      byType.HULL.forEach(i => candidates.push({ item: i, priority: 45 }));
    }
    // ===== DEFAULT STRATEGY =====
    else {
      reasoning.push('>>> DEFAULT STRATEGY <<<');

      byType.CLOSE.forEach(i => candidates.push({ item: i, priority: 80 }));
      byType.MID.forEach(i => candidates.push({ item: i, priority: 70 }));
      missiles.forEach(i => candidates.push({ item: i, priority: 60 }));
      byType.SHIELD.forEach(i => candidates.push({ item: i, priority: 50 }));
    }

    // Add modules (multipliers) - always useful
    byType.MODULE.filter(i => i.mult || i.ability).forEach(i =>
      candidates.push({ item: i, priority: 55 })
    );

    // Sort by priority and fit into slots
    candidates.sort((a, b) => b.priority - a.priority);

    // Remove duplicates (same item might be added multiple times)
    const seen = new Set();
    const uniqueCandidates = candidates.filter(c => {
      if (seen.has(c.item.id)) return false;
      seen.add(c.item.id);
      return true;
    });

    for (const c of uniqueCandidates) {
      if (usedSlots + c.item.slots <= player.max_slots) {
        selected.push(c.item.id);
        usedSlots += c.item.slots;
      }
    }

    const sim = AI.simulateCombat(player, enemy, selected);

    reasoning.push('');
    reasoning.push('=== AI LOADOUT ===');
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

  // Calculate simple inventory build dominance (0-10 scale)
  getInventoryBuildBias: (inventory) => {
    let closeCount = 0;
    let midCount = 0;
    const coreCloseNames = ['ファング', 'カジェル'];
    const coreMidNames = ['ルーキー・ファイター', 'スカベンジャー'];

    for (const item of inventory) {
      const typeId = getTypeId(item.type);
      if (coreCloseNames.some(n => item.name.includes(n)) || typeId === 'CLOSE') {
        closeCount++;
      }
      if (coreMidNames.some(n => item.name.includes(n)) || typeId === 'MID') {
        midCount++;
      }
    }

    return { closeCount, midCount, closeBias: closeCount > midCount };
  },

  // Choose reward item - STRATEGIC VERSION
  chooseReward: (player, options, enemy) => {
    const reasoning = [];
    const stage = player.stage || 1;
    const hasLongBuff = AI.hasLongBuff(player);
    const buildBias = AI.getInventoryBuildBias(player.inventory);

    reasoning.push('=== AI REWARD ANALYSIS ===');
    reasoning.push(`Build focus: ${hasLongBuff ? 'LONG viable' : 'CLOSE/MID preferred'}`);
    if (buildBias.closeCount > 0 || buildBias.midCount > 0) {
      reasoning.push(`Inventory: ${buildBias.closeCount} CLOSE, ${buildBias.midCount} MID`);
    }

    // Score each option
    const scored = options.map((item, idx) => {
      let score = 0;
      const notes = [];
      const typeId = getTypeId(item.type);

      // Base value from power
      score += item.power * 2;
      notes.push(`Power: ${item.power}`);

      // Prefer non-disposable
      if (!item.disposable) {
        score += 20;
        notes.push('Permanent (+20)');
      } else {
        // Missiles are still useful
        if (typeId === 'LONG') {
          score += 15;
          notes.push('Missile (+15)');
        }
      }

      // STRATEGY: Prefer CLOSE/MID early game unless we have LONG buff
      if (!hasLongBuff && stage <= 9) {
        if (typeId === 'CLOSE') {
          score += 25;
          notes.push('CLOSE focus (+25)');
        } else if (typeId === 'MID') {
          score += 20;
          notes.push('MID focus (+20)');
        } else if (typeId === 'LONG' && !item.disposable) {
          score -= 10;
          notes.push('LONG without buff (-10)');
        }
      }

      // Value abilities
      if (item.ability) {
        if (hasAbility(item, AB.LS)) { score += 40; notes.push('Life steal (+40)'); }
        // Growth items need time to scale - only valuable before stage 12
        if (hasAbility(item, AB.GR)) {
          if (stage <= 11) {
            score += 30;
            notes.push('Growth (+30)');
          } else {
            score -= 8;
            notes.push('Growth - too late (-8)');
          }
        }
        if (hasAbility(item, AB.SH)) { score += 15; notes.push('Shield bonus (+15)'); }
        if (hasAbility(item, AB.SB)) { score += 25; notes.push('Shield break (+25)'); }
      }

      // Prefer efficient slot usage
      if (item.slots === 1) {
        score += 10;
        notes.push('1-slot efficient (+10)');
      }

      // WEAPON CAP STRATEGY: Don't need more than 6 strong weapons
      // Past 6, pivot to shields for survivability
      if (buildBias.closeCount >= 6 && typeId === 'CLOSE') {
        score -= 12;
        notes.push('CLOSE capped at 6 (-12)');
      }
      if (buildBias.midCount >= 6 && typeId === 'MID') {
        score -= 12;
        notes.push('MID capped at 6 (-12)');
      }

      // SHIELD PRIORITY when weapons are capped
      // Shields become critical for survivability
      if ((buildBias.closeCount >= 6 || buildBias.midCount >= 6) && typeId === 'SHIELD') {
        score += 18;
        notes.push('Shield - survivability critical (+18)');
      }

      // Build alignment bonus
      // Very conservative: only apply if build direction is clear
      if (buildBias.closeCount >= 2 && buildBias.midCount === 0) {
        // Strong CLOSE commitment
        if (typeId === 'CLOSE') {
          score += 8;
          notes.push('CLOSE committed (+8)');
        } else if (typeId === 'MID') {
          score -= 5;
          notes.push('Diverges from CLOSE (-5)');
        }
      } else if (buildBias.midCount >= 2 && buildBias.closeCount === 0) {
        // Strong MID commitment
        if (typeId === 'MID') {
          score += 8;
          notes.push('MID committed (+8)');
        } else if (typeId === 'CLOSE') {
          score -= 5;
          notes.push('Diverges from MID (-5)');
        }
      }

      // Multipliers are very valuable
      if (item.mult) {
        const [multType, multVal] = item.mult;
        const multTypeId = getTypeId(multType);
        if (multVal > 1) {
          score += 30;
          notes.push(`${multTypeId} multiplier (+30)`);

          // Extra value if it matches our build
          if (!hasLongBuff && (multTypeId === 'CLOSE' || multTypeId === 'MID')) {
            score += 15;
            notes.push('Matches build (+15)');
          }
        }
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

  // Choose boss reward - STRATEGIC VERSION
  chooseBossReward: (player, available) => {
    const reasoning = [];
    const act = getAct(player.stage || 10);

    reasoning.push('=== AI BOSS REWARD ANALYSIS ===');

    // Scores depend on current build
    const scores = {};

    // Act 1 rewards
    if (available.includes('expansion')) {
      scores.expansion = 85;  // +2 slots is very strong
      reasoning.push(`拡張 (expansion): +2 slots - VERY STRONG (score: 85)`);
    }
    if (available.includes('reinforcement')) {
      scores.reinforcement = 70;  // +1 slot +50 HP
      reasoning.push(`強化 (reinforcement): +1 slot +50 HP (score: 70)`);
    }
    if (available.includes('boarding')) {
      scores.boarding = 75;  // +1 slot + CLOSE turns - fits our CLOSE/MID strategy!
      reasoning.push(`白兵戦 (boarding): +1 slot + T5/T6 CLOSE - FITS CLOSE BUILD (score: 75)`);
    }

    // Act 2 rewards
    if (available.includes('skirmish')) {
      scores.skirmish = 65;  // +1 slot + mid turn
      reasoning.push(`遭遇戦 (skirmish): +1 slot + T4 MID (score: 65)`);
    }
    if (available.includes('logistics')) {
      scores.logistics = 80;  // Free missile each fight - enables LONG build!
      reasoning.push(`兵站 (logistics): Free missile each fight - ENABLES LONG BUILD (score: 80)`);
    }
    if (available.includes('doctrine')) {
      scores.doctrine = 82;  // +60 HP + 1.2x damage - very strong
      reasoning.push(`教義 (doctrine): +60 HP + 1.2x ALL damage - VERY STRONG (score: 82)`);
    }

    const best = available.reduce((a, b) => (scores[a] || 0) > (scores[b] || 0) ? a : b);

    reasoning.push('');
    reasoning.push(`=== AI DECISION ===`);
    reasoning.push(`Choose: ${BR[best].name}`);

    return { choice: best, reasoning };
  },

  // Choose dock action - STRATEGIC VERSION
  chooseDockAction: (player, stage) => {
    const reasoning = [];
    const act = getAct(stage);
    const stageInAct = getStageInAct(stage);
    const scrapCost = act;
    const hpPercent = player.hull / player.max_hull;
    const stagesUntilBoss = 10 - stageInAct;
    const missileCount = AI.countMissiles(player);
    const inventorySize = player.inventory.length;
    const inventoryThreshold = 2 * player.max_slots;

    reasoning.push('=== AI DOCK ANALYSIS ===');
    reasoning.push(`HP: ${player.hull}/${player.max_hull} (${Math.round(hpPercent * 100)}%)`);
    reasoning.push(`Stages until boss: ${stagesUntilBoss}`);
    reasoning.push(`Missiles in stock: ${missileCount}`);
    reasoning.push(`Inventory: ${inventorySize}/${inventoryThreshold} items`);
    reasoning.push(`Repair cost: ${scrapCost} items for +${Math.floor(player.max_hull * 0.3)} HP`);
    reasoning.push(`Fabricate: -10 max HP for +1 missile`);

    // Find scrap items (prioritize these for scrapping)
    const scrappable = player.inventory.filter(i =>
      i.name.includes('スクラップ') || (i.power === 0 && getTypeId(i.type) === 'MODULE')
    );

    // ===== NEW STRATEGY: AGGRESSIVE REPAIR IF LOW HP =====
    // TIER 1: Inventory bloat + low HP
    if (inventorySize > inventoryThreshold && hpPercent < 0.66) {
      reasoning.push(`Inventory bloated: ${inventorySize} > ${inventoryThreshold} items`);
      reasoning.push('Low HP: Aggressive repair needed');

      // Prefer scrapping low-priority items
      let toScrap = [];

      // First, use scrap items if available
      if (scrappable.length > 0) {
        toScrap = scrappable.slice(0, scrapCost);
      }

      // If not enough scrap, find other low-priority items
      if (toScrap.length < scrapCost) {
        const nonScrap = player.inventory.filter(i =>
          !toScrap.some(s => s.id === i.id) &&
          !i.name.includes('スクラップ')
        );
        const neededMore = scrapCost - toScrap.length;
        // Pick weakest non-scrap items
        nonScrap.sort((a, b) => a.power - b.power);
        toScrap = [...toScrap, ...nonScrap.slice(0, neededMore)];
      }

      if (toScrap.length >= scrapCost) {
        reasoning.push('');
        reasoning.push('=== AI DECISION ===');
        reasoning.push(`REPAIR: Inventory bloated + low HP, scrap items [${toScrap.slice(0, scrapCost).map(i => i.id).join(', ')}] for recovery`);
        return { action: 'REPAIR', scrapIds: toScrap.slice(0, scrapCost).map(i => i.id), reasoning };
      }
    }

    // TIER 2: Have scrap items + low HP
    if (scrappable.length > 0 && hpPercent < 0.66) {
      reasoning.push(`Have scrap items (${scrappable.length}) and low HP`);
      const toScrap = scrappable.slice(0, scrapCost).map(i => i.id);
      reasoning.push('');
      reasoning.push('=== AI DECISION ===');
      reasoning.push(`REPAIR: Low HP, scrap items [${toScrap.join(', ')}] for recovery`);
      return { action: 'REPAIR', scrapIds: toScrap, reasoning };
    }

    // ===== ORIGINAL STRATEGIES =====
    // STRATEGY: Prioritize having 2 missiles for boss
    if (missileCount < 2 && hpPercent > 0.6) {
      reasoning.push('');
      reasoning.push('=== AI DECISION ===');
      reasoning.push('FABRICATE: Need missiles for boss stage, HP is sufficient');
      return { action: 'FABRICATE', reasoning };
    }

    if (hpPercent > 0.75 && missileCount < 3) {
      // Healthy, fabricate for more missiles
      reasoning.push('');
      reasoning.push('=== AI DECISION ===');
      reasoning.push('FABRICATE: Healthy, stockpile missiles');
      return { action: 'FABRICATE', reasoning };
    }

    reasoning.push('');
    reasoning.push('=== AI DECISION ===');
    reasoning.push('LEAVE: Conserve resources');
    return { action: 'LEAVE', reasoning };
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

    // AI chooses equipment (pass stage info)
    player.stage = stage;
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
