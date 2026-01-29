# STAR CANINE v0.9.2 - SPECIFICATION

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
  L: { id: 'LONG',   name: '長' },
  M: { id: 'MID',    name: '中' },
  C: { id: 'CLOSE',  name: '近' },
  S: { id: 'SHIELD', name: '盾' },
  H: { id: 'HULL',   name: '回' },
  X: { id: 'MODULE', name: '機' },
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
    desc: "全ての中距離武装の最終ダメージ+N。",
    format: (v) => `全中距離武装+${v}`,
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
    desc: "敵シールドが0の状態でダメージを与えた場合、武装威力の50%を回復する。",
    format: () => '生命吸収(50%)',
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
  OVERDRIVE: {
    id: 'OVERDRIVE',
    name: '緊急過負荷',
    desc: "戦闘開始時、耐久値-30、シールド+80。",
    format: () => '緊急過負荷(HP-30,シールド+80)'
  },
  CAPACITOR: {
    id: 'CAPACITOR',
    name: 'キャパシタ蓄積',
    desc: "戦闘終了時、残存シールドの30%分、耐久値を回復する。",
    format: () => 'シールド変換30%'
  },
  COMPACT: {
    id: 'COMPACT',
    name: '圧縮設計',
    desc: "この装備以外の2スロット以上の装備を1スロットとして扱う。",
    format: () => 'スロット圧縮(自身除く)'
  },
  BERSERKER: {
    id: 'BERSERKER',
    name: 'バーサーカー',
    desc: "戦闘開始時、耐久値が最大値の50%未満なら全ダメージ×1.3。",
    format: () => 'HP半分以下で威力×1.3'
  },
  : {
  id: 'MAVERICK',
  name: '一匹狼',
  desc: "MIDがこの1機のみの場合威力倍増",
  format: () => `MIDがこの1機のみの場合威力倍増)`,
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
    desc: "装備スロット最大値+1。第3ターンを中距離に変更。",
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
  [1, "🚀ランス", 40, T.L, 1, 1, null, null],
  [2, "🚀🛡️インターセプター", 60, T.L, 1, 1, null, [AB.SH, 10]],
  [2, "🚀❗ハープーン", 71, T.L, 1, 1, null, [AB.BF, 10]],
  [2, "🚀⚠️アイソレーション", 85, T.L, 1, 1, [T.L, 0.9], null],
  [2, "🚀ジャベリン", 70, T.L, 1, 1, null, null],
  [1, "🚀シューティングスター", 70, T.L, 2, 1, null, null],
  [2, "🚀⚠️サイレント", 98, T.L, 2, 1, [T.M, 0.0], null],
  [1, "🚀🔺ギャンビット", 56, T.L, 2, 1, [T.L, 1.3], null],
  [3, "🚀🚀MOP", 135, T.L, 2, 1, null, null],
  [1, "🔫クァンタム・ディスプレーサー", 30, T.L, 3, 0, [T.C, 0.5], null],

  // === MID (Fighters) ===
  [1, "✈️ドローン", 14, T.M, 1, 0, null, null],
  [1, "✈️💥キラードローン", 25, T.M, 1, 1, null, null],
  [1, "✈️🐺マーバリック", 12, T.M, 1, 0, null, [AB.MV]],
  [1, "✈️⤴️ルーキー・ファイター", 10, T.M, 1, 0, null, [AB.GR, 1]],
  [1, "✈️ウイング", 22, T.M, 2, 0, null, null],
  [1, "✈️✈️ブルーウルフ", 33, T.M, 3, 0, null, [T.L, 0.9]],
  [1, "✈️🔺スクアドラル", 12, T.M, 2, 0, null, [AB.AM, 10]],

  // === CLOSE (Beams) ===
  [1, "⚡クロウ", 15, T.C, 1, 0, null, null],
  [1, "⚡💥ソウル", 30, T.C, 1, 1, null, null],
  [1, "⚡🩸ファング", 10, T.C, 1, 0, null, [AB.LS]],
  [1, "⚡🛡️アイアン・ビーム", 12, T.C, 1, 0, null, [AB.SH, 10]],
  [1, "⚡🔺カジェル", 16, T.C, 2, 0, [T.C, 1.2], null],
  [1, "⚡🪓シールド・ブレイカー", 2, T.C, 2, 0, null, [AB.SB]],
  [1, "⚡⚡️トールハンマー", 30, T.C, 3, 0, null, [T.M, 0.9]],

  // === SHIELD ===
  [1, "🛡️装甲板", 20, T.S, 1, 0, null, null],
  [1, "🛡️⚠️シェル", 28, T.S, 1, 0, null, T.L, 0.8],
  [1, "🛡️💥エフェメラ・シールド", 40, T.S, 1, 1, null, null],
  [1, "🛡️🛡️イージス", 30, T.S, 2, 0, null, null],
  [1, "🛡️🔋キャパシタ", 20, T.S, 2, 0, null, [AB.CAPACITOR]],
  [1, "🛡️⤴️バリアー", 23, T.S, 3, 0, null, [AB.GR, 1]],

  // === HULL ===
  [1, "🔧💥ダメージコントロール", 40, T.H, 1, 1, null, null],
  [1, "🔧自動修理装置", 15, T.H, 1, 0, null, null],

  // === MODULE ===
  [1, "🟫🔺傾斜防壁", 0, T.X, 1, 0, [T.S, 1.5], null],
  [1, "💉緊急防壁", 0, T.X, 2, 0, null, [AB.OVERDRIVE]],
  [2, "⚙️設備最適化", 0, T.X, 2, 0, null, [AB.COMPACT]],
  [1, "🔥バーサーカーコア", 0, T.X, 3, 0, null, [AB.BERSERKER]],
  [2, "🔥🔺弾頭最適化装置", 0, T.X, 3, 0, [T.L, 1.5], null],
  [1, "🏗️🔺スウォーム・ハンガー", 0, T.X, 3, 0, [T.M, 1.5], [AB.NR]],
  [1, "💎🔺プリズマティック・フォーカス", 0, T.X, 3, 0, [T.C, 1.5], [AB.SIM]]
];
```

### 3.2 Enemies

Schema: `[enemyId, name, hull, shield, rank, attacks, skills]`

- `attacks`: `[LONG, MID, CLOSE]`
- `skills`: `[[SK.*, value], ...]` (supports multiple)

```javascript
const EN = [
  [1, "スカミッシャー", 40, 0, R.N, [0, 0, 10], []],
  [2, "ドリフター", 51, 5, R.N, [20, 0, 10], []],
  [3, "自己修復機", 60, 10, R.N, [0, 10, 15], [[SK.REG, 8]]],
  [4, "ゾンビ", 25, 90, R.N, [0, 0, 20], [[SK.DEG, 5]]],
  [5, "遺物哨戒機", 80, 30, R.N, [30, 30, 0], [[SK.DOR, 0]]],
  [6, "特攻フリゲート", 20, 75, R.N, [0, 0, 0], [[SK.EXP, 180]]],
  [7, "投棄巡洋艦", 80, 80, R.N, [5, 10, 10], [[SK.GATE, 5]]],
  [8, "迎撃艇", 55, 15, R.N, [10, 5, 10], [[SK.CL, 6]]],
  [9, "レイダー", 70, 10, R.N, [15, 10, 10], [[SK.OVR, 1.3]]],
  

  [20, "スカウト", 70, 5, R.N, [10, 10, 10], [[SK.DOR, 0]]],
  [21, "ガンナー", 85, 10, R.N, [20, 10, 10], [[SK.CL, 8]]],
  [22, "リペア機", 95, 10, R.N, [10, 15, 10], [[SK.REG, 10]]],
  [23, "コラプター", 80, 15, R.N, [10, 10, 15], [[SK.DEG, 10]]],
  [24, "センチネル", 110, 20, R.N, [20, 15, 10], [[SK.GATE, 10]]],
  [25, "インターセプター", 90, 10, R.N, [20, 15, 15], [[SK.CL, 8], [SK.OVR, 1.3]]],
  [26, "オーバーローダー", 100, 10, R.N, [20, 20, 15], [[SK.OVR, 1.5]]],
  [27, "ボマー", 75, 15, R.N, [0, 0, 0], [[SK.EXP, 140]]],
  [28, "ストライカー", 115, 15, R.N, [25, 15, 15], [[SK.OVR, 1.4], [SK.GATE, 8]]],

  [40, "SBE 軌道作業艇", 110, 60, R.N, [15, 0, 10], [[SK.GATE, 40], [SK.DOR, 0]]],
  [41, "SBE 補給船", 105, 15, R.N, [15, 0, 10], [[SK.DOR, 0], [SK.REGEN, 60]]],
  [42, "SBE 監視艇", 95, 40, R.N, [25, 0, 20], [[SK.GATE, 20], [SK.CL, 20]]],
  [43, "SBE 巡察艦", 100, 10, R.N, [40, 20, 30], [[SK.REGEN, 20], [SK.DOR, 0]]],
  [44, "SBE 軽攻撃艇", 90, 20, R.N, [30, 25, 20], [[SK.OVR, 1.5], [SK.DEG, 10]]],
  [45, "SBE 突撃艇", 105, 20, R.N, [25, 30, 25], [[SK.OVR, 1.6], [SK.GATE, 10]]],
  [45, "SBE 護衛艦", 120, 25, R.N, [30, 25, 20], [[SK.GATE, 20], [SK.CL, 20]]],
  [46, "SBE 中型戦闘艦", 160, 40, R.N, [30, 30, 25], [[SK.OVR, 1.3], [SK.REGEN, 20]]],
  [47, "SBE 防衛艦", 180, 30, R.N, [25, 30, 25], [[SK.GATE, 20], [SK.REGEN, 5]]],
  [48, "SBE 襲撃艦", 135, 15, R.N, [35, 25, 25], [[SK.OVR, 2.0], [SK.CL, 10]]],


// Elite Enemies — Updated Names & IDs
  [60, "シールド・バスティオン", 100, 20, R.E, [10, 10, 5], [[SK.GATE, 20]]],
  [61, "オーバーロード・エンフォーサー", 120, 30, R.E, [20, 20, 25], [[SK.OVR, 2.0]]],
  
  [65, "バスティオン", 150, 35, R.E, [20, 20, 15], [[SK.GATE, 16], [SK.REGEN, 10]]],
  [66, "パニッシャー", 135, 20, R.E, [30, 25, 20], [[SK.OVR, 1.7], [SK.CL, 12]]],
  [67, "モルティス", 145, 25, R.E, [25, 25, 20], [[SK.DEG, 14], [SK.REGEN, 10]]],

  [70, "SBE 要塞巡洋艦", 140, 55, R.E, [35, 35, 25], [[SK.GATE, 24], [SK.REGEN, 16]]],
  // Execution Elite — Scaling Kill Threat
  [71, "SBE 強襲戦艦", 195, 35, R.E, [40, 25, 30], [[SK.OVR, 2.2], [SK.CL, 16]]],
  // Doomed Titan — Overbuilt, Self-Decaying Monster
  [72, "SBE 殲滅艦", 240, 50, R.E,[30, 25, 30], [[SK.DEG, 50], [SK.GATE, 100]]],
  
  [80, "ソーラー・ベア前衛艦", 150, 30, R.B, [35, 15, 20], [[SK.OVR, 1.6]]],
  [81, "ハル・リーヴァー", 250, 135, R.B, [25, 25, 30], [[SK.DEG, 30]]],
  [82, "トール・キング", 150, 55, R.B, [30, 30, 30], [[SK.GATE, 8], [SK.DOR, 0]]],
  [83, "ベルト・ウォーロード", 150, 35, R.B, [30, 20, 20], [[SK.OVR, 1.5]]],
  [84, "エコーズ", 170, 45, R.B, [40, 35, 30], [[SK.REGEN, 5], [SK.DOR, 0]]],
  [85, "皇子の元帥", 175, 55, R.B, [20, 20, 20], [[SK.OVR, 2.0], [SK.GATE, 6]]],
  [86, "SBE 若き皇子", 300, 100, R.B, [35, 30, 25], [[SK.OVR, 2.2]]],
  [87, "SBE ブラック・アーキビスト", 170, 75, R.B, [50, 25, 40], [[SK.CL, 12], [SK.GATE, 40]]],
  [88, "SBE チェイン・アドミラル", 185, 85, R.B, [25, 20, 30], [[SK.GATE, 40], [SK.REGEN, 40]]],
  
    [90, "セレスティアル・リーパー", 140, 60, R.B, [40, 20, 35], [[SK.CL, 10]]],
];
```

### 3.3 Stages
Schema:
[Act, Branch, Subtitle, StageLayout[]]

StageLayout: `[enemyId]`
- enemyId: Enemy difficulty level (0 for Dock)

```javascript
const ST = [
[1, "A", "IMPERIUM", [1,2,3,50,4,0,5,51,6,7,0,80]],
[1, "B", "PURSUIT",  [1,2,3,50,4,0,5,51,6,7,0,81]],
[1, "C", "RUIN",      [1,2,3,50,4,0,5,51,6,7,0,82]],
[2, "A", "ENCIRCLEMENT",[1,2,3,50,4,0,5,51,6,7,0,83]],
[2, "B", "HUNT",        [1,2,3,50,4,0,5,51,6,7,0,84]],
[2, "C", "FRACTURE",    [1,2,3,50,4,0,5,51,6,7,0,85]],
[3, "A", "IMPERIUM", [1,2,3,50,4,0,5,51,6,7,0,86]],
[3, "B", "LIBERATION",[1,2,3,50,4,0,5,51,6,7,0,87]],
[3, "C", "RECKONING",[1,2,3,50,4,0,5,51,6,7,0,88]],
];
```

-----

## 4. PLAYER STATE

### 4.1 Initial State

1. Initialize randomness
- **Initialize stage path**: For each ACT, choose one branch (A–C) from ST. Assign its StageLayout as the active route.

- **Tetris-style item decks**: Each deck uses "bag randomizer"
  - One "bag" = 1 copy of each item type in that rarity
  - Multiple bags pre-shuffled and concatenated at game start (number of types is example)
  - if it empties, refill. 
  - Guarantees: within each bag-length of draws, every item type appears exactly once

- **Reward decision decks**: Determine item rarity reward per enemy rank, rounded. 
  - Normal rank:
    - ACT I:   95% NORMAL, 5% ELITE, 0 BOSS  (20,1,0)
    - ACT II:  90% NORMAL, 10% ELITE, 0% BOSS   (19,2,0)
    - ACT III:  75% NORMAL, 20% ELITE, 5% BOSS   (16,4,1)
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

| ACT | Stages | Hull/Shield Scale | Attack Scale |
|-----|--------|-------------------|--------------|
| I   | 1-12   | ×1.0              | ×1.0         |
| II  | 13-24  | ×1.5              | ×1.3         |
| III | 25-36  | ×2.25             | ×1.7         |



Scaling applies to enemy `hull`, `shield`, and all `attacks`.

-----

## 5. COMBAT RULES

### 5.1 Turn Sequence

Default: `LONG → MID → CLOSE → CLOSE → MID → LONG`

|Turn     |1|2|3|4    |5    |6    |
|---------|-|-|-|-----|-----|-----|
|Default  |L|M|C|C    |M    |L    |
|+Boarding|L|M|C|C    |**C**|**C**|
|+Skirmish|L|M|**M**|C|M    |L    |

### 5.2 Combat Initialization
1. Apply OVERDRIVE: If equipped, player hull -= 30
1. **Sum Base Stats:** Total `power` per type (L/M/C/S/H)
1. **Apply Multipliers:** Multiply each type by all applicable `mult` values
1. Apply COMPACT: Equipment with 2+ slots count as 1 slot (stat calculation unaffected)
1. **Apply Doctrine:** If active, all damage types ×1.2
1. Apply BERSERKER: If player hull < (max_hull × 0.5), all damage types ×1.3
1. Add Flat Bonuses:
  - AB.SH → shield
  - AB.OVERDRIVE → shield (+60)
  - AB.AM → MID damage
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

1. `REGEN`: If enemy hull > 0, heal hull, not exceed to enemy's initial hull.  
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
1. Apply `GROWTH` to equipped items. (increase power permanently)
1.	Calculate hull repair:
  - Base repair = HULL total × multipliers
  -	CAPACITOR: Add (remaining battle_shield × 0.5) to repair amount
  - If NO_REPAIR ability present, set repair amount to 0
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
|2     |アップグレード    |Scrap N items (N = ACT number) → details below|
|3     |緊急ミサイル製造|max_hull −10 → +1 🚀 ランス                       |
|4     |出港      |No effect                                     |

- **Upgrade**
  - Growth items (AB.GR): Growth value +1
  - Regular items: Power × 1.2 (rounded up)
	- Can’t upgrade:
    - Already upgraded items (has + suffix and upgraded flag)
    - Zero-power items (modules, shields without power)
-----

## 7. REWARD SYSTEM

### 7.1 Victory Reward
Draw 3 items, choose 1. All 3 removed from decks permanently.

For each of the 3 items:
1. Draw 1 rarity from reward rarity deck (§4.1)
2. Draw 1 item from that rarity's item deck

Note: This ensures exact distribution (e.g., ACT I Normal: 20 Normal + 1 Elite across all rewards).


  
### 7.2 Boss Reward

- **Automatic:** Full hull repair
- **Choose 1:** From available pool (ACT I or ACT II list)
- **ACT III:** No bonus selection

-----

## 8. UI TEXT Display

### 8.1 Display

- Pre combat scene:
**a fatal turn prediction system** and **an enemy defeat turn prediction**
- Display like this:

```
簡易予測 ✓ T2で撃破
与ダメージ量: 40
被ダメージ量: 50
```
    or 

```
簡易予測 ⚠️ T3で沈没
与ダメージ量: 55
被ダメージ量: 70
```
- describe 
  - Current hull and shield values
  - Enemy attack pattern for each turn
  - Claculate until Vicrory or Defeating. the amount of damage is at the time of expected ending timing.
  - Ablitiy: 'SIMULTANEOUS'.
  - Enemy skills (OVERLOAD, DORMANT, EXPLOSIVE)
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
  lbl_hull: 'HP',
  lbl_shield: 'シールド',
  lbl_slots: '装備枠',
  lbl_power: '威力',
  lbl_attack: '攻撃力',
  lbl_equipped: '装備中',
  lbl_inventory: '装備一覧',
  lbl_reward: '報酬',
  lbl_boss_reward: '獲得技能',
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
  opening: `>艦船ID：STAR CANINE
>指揮権限：艦長

>救難信号を検知
>発信元：惑星K9
>送信者ID：ライカ

「私よ。
K9は陥落した。
ソーラーベアの艦隊が惑星を占拠した。
私も連れて行かれた。
あなたがここにいなかったことは分かってる。
でも、きっと戻ってくるとも信じてる。

お願い……死なない…」

>信号途絶
>K9軌道上よりソーラーベア帝国の識別信号を確認

>惑星K9へ進路を設定しました,

  victory: `LAIKAを救出

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
|**0.9.2**|Boss and stage layout update |
|0.9.1|Prediction system, refines master data. specification bug fix. Addinh new items and abilities.  |
|0.9.0|Items, Enemy and stage update. Changed the initialization way of Items and boss rewards.|
|0.8.7|Unified single-file spec. Positional array data. Multi-skill support. 休眠 skill rename.|
|0.8.6    |Added SHIELD_BREAK, BACKFIRE. New boss rewards. Dock rework.                          |
|0.8.4.1  |Initial stable release.                                                               |

-----

**END OF SPECIFICATION**
