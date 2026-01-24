# STAR CANINE v0.9.1 - SPECIFICATION

Containing all game rules, data, and UI text.

-----

## 1. OVERVIEW

Deterministic, text-only roguelike spaceship game designed for LLM playability.

- **Objective:** Survive to rescue LAIKA
- **Combat:** 1v1, 6-turn battles with no randomness
- **Strategy:** Equipment loadout optimization
- **Deterministic design:** All random elements (item decks, reward rarities, boss rewards) are pre-shuffled at game start. No mid-game randomness.


-----

## 2. CONSTANTS & DATA

### 2.1 Type Constants

```javascript
// Rank
const R = { N: 'NORMAL', E: 'ELITE', B: 'BOSS' };

// Equipment Type
const T = {
  L: { id: 'LONG',   name: '長距離武装' },
  M: { id: 'MID',    name: '中距離武装' },
  C: { id: 'CLOSE',  name: '近距離武装' },
  S: { id: 'SHIELD', name: 'シールド' },
  H: { id: 'HULL',   name: '耐久補助' },
  X: { id: 'MODULE', name: 'モジュール' },
};

// Range (for UI display)
const RANGE = {
  LONG:  '長距離',
  MID:   '中距離',
  CLOSE: '近距離',
};

// Rank (for UI display)
const RANK = {
  NORMAL: '通常',
  ELITE:  'エリート',
  BOSS:   'ボス',
};
```

### 2.2 Enemy Skills

```javascript
const SK = {
  GATE: {
    id: 'GATE',
    name: '防壁',
    desc: "ターン終了時、シールドを指定値まで再生成する。",
  },
  REG: {
    id: 'REGEN',
    name: '自己修復',
    desc: "毎ターン、耐久値を回復する。",
  },
  DEG: {
    id: 'DEGEN',
    name: '腐食',
    desc: "毎ターン、耐久値が減少する。",
  },
  EXP: {
    id: 'EXPLOSIVE',
    name: '自爆',
    desc: "第4ターンに固定ダメージを相手に与える自爆攻撃を行い、自壊する。",
  },
  OVR: {
    id: 'OVERLOAD',
    name: '過負荷',
    desc: "第4ターン以降、攻撃ダメージが上昇する。",
  },
  DOR: {
    id: 'DORMANT',
    name: '休眠',
    desc: "第4ターン以降、攻撃を停止する。",
  },
  CL: {
    id: 'COUNTER_LONG',
    name: '迎撃',
    desc: "長距離攻撃を受けた際、長距離武装数×指定値で反撃する。",
  },
};
```

### 2.3 Equipment Abilities

```javascript
const AB = {
  SH: {
    id: 'SHIELD',
    name: 'シールド加算',
    desc: "戦闘開始時、シールド+N。",
    format: (v) => `+${v} シールド`,
  },
  AM: {
    id: 'ALL_MID',
    name: '中距離強化',
    desc: "中距離武装の最終ダメージ+N。",
    format: (v) => `中距離+${v}`,
  },
  SIM: {
    id: 'SIMULTANEOUS',
    name: '同時攻撃',
    desc: "撃破判定をターン終了時にまとめて行う。",
    format: () => '同時攻撃',
  },
  NR: {
    id: 'NO_REPAIR',
    name: '修復無効',
    desc: "戦闘終了後の耐久値回復を無効化する。",
    format: () => '修復無効',
  },
  LS: {
    id: 'LIFE_STEAL',
    name: '生命吸収',
    desc: "敵シールドが0の状態でダメージを与えた場合、武装威力分を回復する。",
    format: () => '生命吸収',
  },
  GR: {
    id: 'GROWTH',
    name: '成長',
    desc: "戦闘終了ごとに、この武装の威力が永久に+Nされる。",
    format: (v) => `成長+${v}`,
  },
  SB: {
    id: 'SHIELD_BREAK',
    name: 'シールド破壊',
    desc: "敵シールドを無視して耐久値に直接ダメージを与える。",
    format: () => 'シールド破壊',
  },
  BF: {
    id: 'BACKFIRE',
    name: '反動',
    desc: "この武装で攻撃した後、自機にNダメージ。",
    format: (v) => `反動${v}`,
  },
};
```

### 2.4 Boss Rewards

```javascript
const BR = {
  expansion: {
    name: '拡張',
    desc: "装備スロット最大値+2。",
    effect: (p) => { p.max_slots += 2; },
  },
  reinforcement: {
    name: '強化',
    desc: "装備スロット最大値+1、耐久値最大値+50。",
    effect: (p) => { p.max_slots += 1; p.max_hull += 50; p.hull += 50; },
  },
  boarding: {
    name: '白兵戦',
    desc: "装備スロット最大値+1。第5・第6ターンを近距離に固定。",
    effect: (p) => { p.max_slots += 1; p.boarding = true; },
  },
  skirmish: {
    name: '遭遇戦',
    desc: "装備スロット最大値+1。第4ターンを中距離に変更。",
    effect: (p) => { p.max_slots += 1; p.skirmish = true; },
  },
  logistics: {
    name: '兵站',
    desc: "戦闘開始前に🚀 ランスを1基追加する。",
    effect: (p) => { p.logistics = true; },
  },
  doctrine: {
    name: '教義',
    desc: "耐久値最大値+60。すべての武装ダメージ×1.2。",
    effect: (p) => { p.max_hull += 60; p.hull += 60; p.doctrine = true; },
  },
};

```

-----

## 3. GAME DATA

### 3.1 Equipment

Schema: `[slots, name, power, type, rarity, disposable, mult, ability]`

- `mult`: `[target_type, multiplier]` or `null`
- `ability`: `[AB.*, value?]` or `null`
- `rarity`: 0 = not in reward decks (starting/special only), 1+ = reward pool

```javascript
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
  [1, "⚡🔺カジェル", 16, T.C, 2, 0, [T.C, 1.2], null],
  [1, "⚡🪓 シールド・ブレイカー", 2, T.C, 2, 1, null, [AB.SB]],

  // === SHIELD ===
  [1, "🛡️ 装甲板", 25, T.S, 1, 0, null, null],
  [1, "🛡️💥 エフェメラ・シールド", 45, T.S, 1, 1, null, null],
  [1, "🛡️🛡️ イージス", 35, T.S, 2, 0, null, null],
  [1, "🛡️ ⤴️ バリアー", 25, T.S, 3, 0, null, [AB.GR, 1]],

  // === HULL ===
  [1, "🔧 💥ダメージコントロール", 30, T.H, 1, 1, null, null],
  [1, "🔧 自動修理装置", 15, T.H, 1, 0, null, null],

  // === MODULE ===
  [1, "🟫🔺 ダブルシールド", 0, T.X, 1, 0, [T.S, 2.0], null],
  [2, "🔥🔺 弾頭最適化装置", 0, T.X, 3, 0, [T.L, 2.0], null],
  [1, "🏗️🔺 スウォーム・ハンガー", 0, T.X, 3, 0, [T.M, 2.0], [AB.NR]],
  [1, "💎🔺 プリズマティック・フォーカス", 0, T.X, 3, 0, [T.C, 2.0], [AB.SIM]]
];
```

### 3.2 Enemies

Schema: `[difficulty, name, hull, shield, rank, attacks, skills]`

- `attacks`: `[LONG, MID, CLOSE]`
- `skills`: `[[SK.*, value], ...]` (supports multiple)

```javascript
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
```

### 3.3 Stages

- Each ACT has 12 stages. ACT I(stage 1-12), ACT II(stage 13-24), ACT III(stage 25-36) and they have same stage layout(`ST`). 

Schema: `[rank, difficulty]`
- `rank`: `'N'` (Normal enemy), `'E'` (Elite enemy), `'B'` (Boss enemy), `'D'` (Dock)
- `difficulty`: Enemy difficulty level (0 for Dock)
- Stage number = array index + 1

```javascript
const ST = [
  ['N',1],
  ['N',2],
  ['N',3], 
  ['E',8], 
  ['N',4],
  ['D',0],
  ['N',5],
  ['E',9], 
  ['N',6], 
  ['N',7],
  ['D',0],
  ['B',10],
];
```

-----

## 4. PLAYER STATE

### 4.1 Initial State

1. Initialize randomness
- **Tetris-style item decks**: Each deck uses "bag randomizer"
  - One "bag" = 1 copy of each item type in that rarity
  - Multiple bags pre-shuffled and concatenated at game start (number of types is example)
  - Normal deck: 3 bags × 16 types = 48 cards
  - Elite deck: 3 bags × 9 types = 27 cards
  - Boss deck: 3 bags × 5 types = 15 cards
  - Guarantees: within each bag-length of draws, every item type appears exactly once

- **Reward decision decks**: Determine item rarity reward per enemy rank, rounded. 
  - Deck size = `rank` combats per ACT × 3 (reward choices) = ex. normal rank has 7 combats, then 21 cards
  - Normal rank:
    - ACT I:   95% NORMAL, 5% ELITE, 0 BOSS  (20,1,0)
    - ACT II:  80% NORMAL, 15% ELITE, 5% BOSS   (16,4,1)
    - ACT III:  60% NORMAL, 30% ELITE, 10% BOSS   (12,7,2)
  - Elite rank:
    - ACT I:   0% NORMAL, 100% ELITE, 0 BOSS  (0,6,0)
    - ACT II:  0% NORMAL, 90% ELITE, 10% BOSS   (0,5,1)
    - ACT III:  0% NORMAL, 67% ELITE, 33% BOSS   (0,4,2)
  - Boss rank: always BOSS

  - **Boss reward distribution**: The boss reward deck is created with one set at game start. 

2. Define

```javascript
const INITIAL_PLAYER = {
  max_hull: 200,
  hull: 200,
  max_slots: 6,
  inventory: [
    "🚀 ランス", "🚀 ランス", 
    "⚡ クロウ", "⚡ クロウ", 
    "🛡️ 装甲板",
    "🗑️ スクラップ", "🗑️ スクラップ"
  ],
  equipped: [],
  // Boss reward flags
  logistics: false,
  boarding: false,
  skirmish: false,
  doctrine: false,
  // Available rewards.
normalItemsDeck: [],
eliteItemsDeck: [],
bossItemsDeck: [],
bossRewards: [],
rewardRarityDecks: {}
};
```

### 4.2 Act Scaling

|ACT|Stages|Enemy Scale|
|---|------|-----------|
|I  |1-12  |×1.0       |
|II |13-24 |×1.5       |
|III|25-36 |×2.0       |


Scaling applies to enemy `hull`, `shield`, and all `attacks`.

-----

## 5. COMBAT RULES

### 5.1 Turn Sequence

Default: `LONG → MID → CLOSE → CLOSE → MID → LONG`

|Turn     |1|2|3|4    |5    |6    |
|---------|-|-|-|-----|-----|-----|
|Default  |L|M|C|C    |M    |L    |
|+Boarding|L|M|C|C    |**C**|**C**|
|+Skirmish|L|M|C|**M**|M    |L    |

### 5.2 Combat Initialization

1. **Sum Base Stats:** Total `power` per type (L/M/C/S/H)
1. **Apply Multipliers:** Multiply each type by all applicable `mult` values
1. **Apply Doctrine:** If active, all damage types ×1.2
1. **Add Flat Bonuses:** AB.SH → shield, AB.AM → MID damage
1. **Set Battle Pools:** `battle_shield`, `battle_hull`

### 5.3 Turn Resolution Order

**Player Phase:**

1. Calculate damage for current range
1. `SHIELD_BREAK`: Set enemy shield to 0
1. Check `LIFE_STEAL` eligibility (enemy shield = 0?)
1. Apply damage to enemy (shield → hull)
1. `LIFE_STEAL`: Heal if eligible
1. `BACKFIRE`: Self-damage
1. `COUNTER_LONG`: Enemy counter-attack (LONG range only)
1. Victory check (skip if `SIMULTANEOUS`)

**Enemy Phase:**

1. `REGEN`: If enemy hull > 0, heal hull.  
1. `DEGEN`: Lose hull
1. `OVERLOAD`/`DORMANT`: Modify attack (turn 4+)
1. `EXPLOSIVE`: Add damage to Player hull, then set enemy hull to 0.  (turn 4)
1. Apply damage to player
1. Defeat check

**Turn End:**

1. `GATE`: Regenerate shield to value
1. If `SIMULTANEOUS`, Victory check. 

### 5.4 Post-Combat

1. Remove disposable items
1. Apply `GROWTH` to equipped items
1. Repair hull (unless `NO_REPAIR`) by HULL total × multipliers
1. Clamp hull to max_hull

### 5.5 Outcomes

|Result  |Condition                           |
|--------|------------------------------------|
|**クリア** |Stage 36 + enemy dead + player alive|
|**勝利**  |Enemy dead + player alive           |
|**敗北**  |Player dead (any cause)             |
|**敗北**  |Boss alive after turn 6             |
|**引き分け**|Player and Non-boss enemy alive after turn 6 |

**Note:** Mutual destruction = 敗北 (player must survive to rescue LAIKA)

-----

## 6. DOCK EVENT

Choose exactly ONE:

|Option|Name    |Effect                                        |
|------|--------|----------------------------------------------|
|1     |緊急修理    |Scrap N items → +30% max_hull (N = ACT number)|
|2     |緊急ミサイル製造|max_hull −10 → +1 🚀 ランス                       |
|3     |出港      |No effect                                     |

-----

## 7. REWARD SYSTEM

### 7.1 Victory Reward
Draw 3 items, choose 1. All 3 removed from decks permanently.
1. Draw 1 rarity from reward rarity deck (§4.1) → draw 1 item from that rarity's item deck
2. Draw 2 items from Normal item deck

Note: Unpicked items do not return to deck.

  
### 7.2 Boss Reward

- **Automatic:** Full hull repair
- **Choose 1:** From available pool (ACT I or ACT II list)
- **ACT III:** No bonus selection

-----

## 8. UI TEXT Display

### 8.1 Display

- Pre combat scene:
**a fatal turn prediction system** and **an enemy defeat turn prediction**
  - Display like this:Predicted sinking at Turn 3
    - Current hull and shield values
    - Enemy attack pattern for each turn
    - ACT scaling multipliers
    - Enemy abilities (OVERLOAD, DORMANT, EXPLOSIVE)
    - Boss reward effect: boarding, skirmish
    - **Intentional imperfection** Do not perfectly emulate the damages. ignore LIFE-STEAL, SHIELD_BREAK or repairing effect.

### 8.2 Scene Labels

```javascript
const UI = {
  // Buttons
  btn_start: '発進',
  btn_engage: '戦闘開始',
  btn_continue: '続行',
  btn_claim: '獲得',
  btn_restart: '再スタート',
  btn_repair: '修理',
  btn_fabricate: '製造',
  btn_leave: '出港',
  
  // Labels
  lbl_stage: 'ステージ',
  lbl_act: 'ACT',
  lbl_hull: '耐久値',
  lbl_shield: 'シールド',
  lbl_slots: 'スロット',
  lbl_power: '威力',
  lbl_attack: '攻撃力',
  lbl_equipped: '装備中',
  lbl_inventory: '装備一覧',
  lbl_reward: '報酬',
  lbl_boss_reward: 'ボス特典',
  lbl_preview: '予想攻撃力',
  
  // Results
  result_clear: '🎉 クリア 🎉',
  result_victory: '✓ 勝利',
  result_defeat: '✗ 敗北',
  result_draw: '— 引き分け —',
  
  // Combat log
  log_player_attack: '自機攻撃',
  log_enemy_attack: '敵艦攻撃',
  log_damage: 'ダメージ',
  log_player_destroyed: '自機撃破を確認。',
  log_enemy_destroyed: '敵艦撃破を確認。',
  log_combat_end: '=== 戦闘終了 ===',
  log_repair: '戦闘後処理',
  
  // Dock
  dock_title: 'ドック',
  dock_repair_title: '緊急修理',
  dock_repair_desc: (n) => `アイテムを${n}個廃棄して、耐久値を30%回復する`,
  dock_fabricate_title: '緊急ミサイル製造',
  dock_fabricate_desc: '耐久値最大値を永久に−10して、🚀 ランスを1つ獲得する',
  dock_leave_title: 'ドックを出る',
  dock_leave_desc: '何もせずに次のステージへ進む',
};
```

### 8.2 Story Text

```javascript
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

> K9へ航路設定中。`,

  victory: `K9軌道を制圧。
LAIKAを救出。

「帰ってきてくれたのね。」`,

  defeat: '信号途絶',
};
```

-----

## 9. IMPLEMENTATION

### 9.1 Data Parser

```javascript
const parseData = (schema, data) => data.map(row => {
  const obj = {};
  schema.forEach((key, i) => obj[key] = row[i]);
  return obj;
});

// Schemas
const EQ_SCHEMA = ['slots', 'name', 'power', 'type', 'rarity', 'disposable', 'mult', 'ability'];
const EN_SCHEMA = ['difficulty', 'name', 'hull', 'shield', 'rank', 'attacks', 'skills'];
const ST_SCHEMA = ['rank', 'difficulty'];
```

### 9.2 Helper Functions

```javascript
// Act calculation
const getAct = (stage) => Math.floor((stage - 1) / 12) + 1;
const getStageInAct = (stage) => ((stage - 1) % 12) + 1;
const getActScale = (act) => [1, 1.5, 2][act - 1];

// Damage application
const applyDamage = (dmg, shield, hull) => {
  const toShield = Math.min(shield, dmg);
  return {
    shield: Math.max(0, shield - dmg),
    hull: Math.max(0, hull - (dmg - toShield)),
  };
};

// Item creation
const createItem = (name) => {
  const base = parseData(EQ_SCHEMA, EQ).find(e => e.name === name);
  return base ? { ...base, id: Math.random().toString(36).slice(2, 11) } : null;
};

// Type name lookup
const getTypeName = (type) => type?.name || type;
const getRankName = (rank) => RANK[rank] || rank;
const getRangeName = (range) => RANGE[range] || range;

// Skill description with value
const getSkillDesc = (skillKey, value) => {
  const sk = Object.values(SK).find(s => s.id === skillKey);
  return sk ? `【${sk.name}】${sk.desc}` : '';
};

// Ability description with value
const getAbilityDesc = (ability) => {
  if (!ability) return '';
  const [ab, value] = Array.isArray(ability) ? ability : [ability];
  return ab.format ? ab.format(value) : ab.name;
};
```

### 9.3 Turn Order Generator

```javascript
const getTurnOrder = (player) => {
  const base = ['LONG', 'MID', 'CLOSE', 'CLOSE', 'MID', 'LONG'];
  if (player.boarding) { base[4] = 'CLOSE'; base[5] = 'CLOSE'; }
  if (player.skirmish) { base[3] = 'MID'; }
  return base;
};
```

-----

## 10. CHANGELOG

|Version  |Changes                                                                               |
|---------|--------------------------------------------------------------------------------------|
|**0.9.0**|Items, Enemy and stage update. Changed the initialization way of Items and boss rewards.|
|0.8.7|Unified single-file spec. Positional array data. Multi-skill support. 休眠 skill rename.|
|0.8.6    |Added SHIELD_BREAK, BACKFIRE. New boss rewards. Dock rework.                          |
|0.8.4.1  |Initial stable release.                                                               |

-----

**END OF SPECIFICATION**
