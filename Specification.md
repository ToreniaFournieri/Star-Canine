# STAR CANINE SPECIFICATION v0.8.7

## 1. OVERVIEW

Deterministic, text-only roguelike spaceship game designed for LLM playability.

- **Scope:** 1 vs 1 battles, persistent Hull HP, no randomness in combat
- **Strategy:** Loadout optimization and turn-based range management
- **Objective:** Survive 30 stages to rescue LAIKA

### 1.1 DESIGN PRINCIPLES

1. **Deterministic:** All combat outcomes are calculable before engagement
1. **Token-Efficient:** Data uses positional array notation for minimal token usage
1. **Single Language:** Japanese UI/data only (no localization layer)

-----

## 2. DATA FORMAT

### 2.1 Positional Array Notation

All game data uses schema-driven positional arrays for token efficiency and nesting support.

**Format:**

```javascript
const SCHEMA = ['field1', 'field2', 'field3', ...];
const DATA = [
  [value1, value2, value3, ...],
  [value1, value2, value3, ...],
];
```

**Parsing:**

```javascript
const parse = (schema, data) => data.map(row => {
  const obj = {};
  schema.forEach((key, i) => obj[key] = row[i]);
  return obj;
});
```

### 2.2 Type Constants

```javascript
// Rank
const R = { N: 'NORMAL', E: 'ELITE', B: 'BOSS' };

// Equipment Type
const T = { L: 'LONG', M: 'MID', C: 'CLOSE', S: 'SHIELD', H: 'HULL', X: 'MODULE' };

// Enemy Skills
const SK = {
  GATE: 'GATE',           // Shield regeneration at turn end
  REG: 'REGEN',           // Hull regeneration each turn
  DEG: 'DEGEN',           // Hull decay each turn
  EXP: 'EXPLOSIVE',       // Self-destruct on turn 4
  OVR: 'OVERLOAD',        // Damage multiplier after turn 3
  DOR: 'DORMANT',         // Damage multiplier after turn 3 (0 = stops attacking)
  CL: 'COUNTER(LONG)'     // Counter-attack vs LONG weapons
};

// Equipment Abilities
const AB = {
  SH: 'SHIELD',           // +N shield at battle start
  AM: 'ALL_MID',          // +N to all MID damage
  SIM: 'SIMULTANEOUS',    // Defer defeat check to turn end
  NR: 'NO_REPAIR',        // Disable post-combat hull repair
  LS: 'LIFE_STEAL',       // Heal when damaging unshielded enemy
  GR: 'GROWTH',           // +N power permanently per combat
  SB: 'SHIELD_BREAK',     // Ignore enemy shield
  BF: 'BACKFIRE'          // Self-damage after attack
};
```

-----

## 3. GAME DATA

### 3.1 Equipment Data

**Schema:**

```javascript
const EQ_SCHEMA = ['slots', 'name', 'power', 'type', 'rarity', 'disposable', 'mult', 'ability'];
// mult: [target_type, multiplier] or null
// ability: [ability_type, value] or [ability_type] or null
```

**Data:**

```javascript
const EQ_DATA = [
  // LONG Weapons (Disposable Missiles)
  [1, "🚀 ランス", 40, T.L, 0, 1, null, null],
  [1, "🚀 メテオ", 45, T.L, 1, 1, null, null],
  [2, "🚀🛡️ インターセプター", 50, T.L, 1, 1, null, [AB.SH, 10]],
  [2, "🚀❗ ハープーン", 66, T.L, 1, 1, null, [AB.BF, 10]],
  [2, "🚀⚠️ アイソレーション", 75, T.L, 1, 1, [T.L, 0.9], null],
  [2, "🚀🔺 ジャベリン", 39, T.L, 1, 1, [T.L, 1.2], null],
  [2, "🚀🔺 ギャンビット", 55, T.L, 2, 1, [T.L, 1.3], null],
  [1, "🔫 クァンタム・ディスプレーサー", 40, T.L, 3, 0, [T.C, 0.5], null],
  
  // MID Weapons (Fighters)
  [1, "✈️ ドローン", 12, T.M, 1, 0, null, null],
  [1, "✈️⚠️ スカベンジャー", 20, T.M, 1, 0, [T.M, 0.9], null],
  [1, "✈️🔺 スクアドラル", 8, T.M, 1, 0, [T.M, 1.2], null],
  [1, "✈️⤴️ ルーキー・ファイター", 5, T.M, 1, 0, null, [AB.GR, 2]],
  [1, "✈️✈️ ブルーウルフ", 20, T.M, 2, 0, null, null],
  
  // CLOSE Weapons (Beam/Melee)
  [1, "⚡ クロウ", 10, T.C, 0, 0, null, null],
  [1, "⚡🩸 ファング", 8, T.C, 1, 0, null, [AB.LS]],
  [1, "⚡⚠️ スタティック・ブレード", 22, T.C, 1, 0, [T.C, 0.9], null],
  [1, "⚡🛡️ アイアン・ビーム", 5, T.C, 2, 0, null, [AB.SH, 10]],
  [1, "⚡ カジェル", 25, T.C, 2, 0, null, null],
  [1, "⚡🔺 ブースト・レーザー", 10, T.C, 1, 0, [T.C, 1.2], null],
  [1, "⚡🪓 シールド・ブレイカー", 3, T.C, 2, 1, null, [AB.SB]],
  
  // SHIELD
  [1, "🛡️ 装甲板", 14, T.S, 0, 0, null, null],
  [1, "🛡️ ヴェール", 17, T.S, 1, 0, null, null],
  [1, "🛡️⚠️ バルクヘッド", 25, T.S, 1, 0, [T.S, 0.9], null],
  [1, "🛡️💥 エフェメラ・シールド", 33, T.S, 1, 1, null, null],
  [1, "🛡️🛡️ イージス", 30, T.S, 2, 0, null, null],
  [1, "🛡️🔺 バリアー", 13, T.S, 2, 0, [T.S, 1.2], null],
  
  // HULL
  [1, "🔧 リペアラー", 10, T.H, 1, 0, null, null],
  [1, "🔧🔧 ベテラン・リペアラー", 15, T.H, 2, 0, null, null],
  
  // MODULE (Multipliers/Special)
  [2, "🔥🔺 弾頭最適化装置", 0, T.X, 3, 0, [T.L, 2.0], null],
  [1, "🛫🔺 スウォーム・コア", 0, T.X, 3, 0, [T.L, 0.5], [AB.AM, 10]],
  [1, "🏗️🔺 スウォーム・ハンガー", 0, T.X, 3, 0, [T.M, 2.0], [AB.NR]],
  [1, "💎🔺 プリズマティック・フォーカス", 0, T.X, 3, 0, [T.C, 2.0], [AB.SIM]],
  [1, "🟫🔺 ダブルシールド", 0, T.X, 3, 0, [T.S, 2.0], null],
  [1, "♨️🔺 娯楽施設", 2, T.X, 2, 0, [T.H, 2.0], null],
];
```

### 3.2 Enemy Data

**Schema:**

```javascript
const EN_SCHEMA = ['difficulty', 'name', 'hull', 'shield', 'rank', 'attacks', 'skills'];
// attacks: [LONG, MID, CLOSE]
// skills: [[skill_type, value], ...] - supports multiple skills
```

**Data:**

```javascript
const EN_DATA = [
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
```

### 3.3 Stage Data

**Schema:**

```javascript
const ST_SCHEMA = ['stage', 'type', 'difficulty', 'rank'];
// type: 'C' (combat) or 'D' (dock)
// For dock stages, difficulty and rank are null
```

**Data:**

```javascript
const ST_DATA = [
  [1, 'C', 1, R.N],
  [2, 'C', 2, R.N],
  [3, 'C', 6, R.E],
  [4, 'D', null, null],
  [5, 'C', 3, R.N],
  [6, 'C', 4, R.N],
  [7, 'C', 8, R.E],
  [8, 'C', 5, R.N],
  [9, 'D', null, null],
  [10, 'C', 9, R.B],
];
// Pattern repeats for ACT II (stages 11-20) and ACT III (stages 21-30)
```

-----

## 4. PLAYER STATE

### 4.1 Initial State

```javascript
const INITIAL_PLAYER = {
  max_hull: 200,
  hull: 200,
  max_slots: 6,
  inventory: ["🚀 ランス", "🚀 ランス", "⚡ クロウ", "⚡ クロウ", "🛡️ 装甲板"],
  equipped: [],
  // Boss Rewards (flags)
  logistics: false,   // Add Lance each combat
  boarding: false,    // Turns 5-6 become CLOSE
  skirmish: false,    // Turn 4 becomes MID
  doctrine: false,    // All damage ×1.2
  // Available boss rewards per act
  bossRewardsAct1: ['expansion', 'reinforcement', 'boarding'],
  bossRewardsAct2: ['skirmish', 'logistics', 'doctrine'],
};
```

### 4.2 Progression & Scaling

|ACT|Stages|Scale Factor|
|---|------|------------|
|I  |1-10  |×1.0        |
|II |11-20 |×1.5        |
|III|21-30 |×2.0        |

**Scaling applies to:** Enemy `hull`, `shield`, and all `attack` values.

-----

## 5. EQUIPMENT SYSTEM

### 5.1 Equipment Fields

|Field     |Type                   |Description                         |
|----------|-----------------------|------------------------------------|
|slots     |Number                 |Slot cost (1-2)                     |
|name      |String                 |Display name with emoji             |
|power     |Number                 |Base power value                    |
|type      |T.*                    |Equipment category                  |
|rarity    |Number                 |0=starter, 1=normal, 2=elite, 3=boss|
|disposable|0/1                    |Removed after combat if 1           |
|mult      |[T.*, Number] or null  |Multiplier target and value         |
|ability   |[AB.*, Number?] or null|Special ability                     |

### 5.2 Type Behaviors

|Type  |Combat Role               |Post-Combat Role  |
|------|--------------------------|------------------|
|LONG  |Damage at LONG range      |-                 |
|MID   |Damage at MID range       |-                 |
|CLOSE |Damage at CLOSE range     |-                 |
|SHIELD|Battle start protection   |-                 |
|HULL  |-                         |Post-combat repair|
|MODULE|Multipliers/Abilities only|-                 |

### 5.3 Ability Definitions

|Ability     |Parameters|Effect                                           |
|------------|----------|-------------------------------------------------|
|SHIELD      |value     |+value shield at battle start                    |
|ALL_MID     |value     |+value to final MID damage                       |
|SIMULTANEOUS|-         |Defer defeat check to turn end                   |
|NO_REPAIR   |-         |Disable post-combat hull repair                  |
|LIFE_STEAL  |-         |Heal equal to damage dealt when enemy shield is 0|
|GROWTH      |value     |+value power permanently after each combat       |
|SHIELD_BREAK|-         |Set enemy shield to 0 before damage              |
|BACKFIRE    |value     |Take value damage after attacking                |

-----

## 6. COMBAT SYSTEM

Combat is deterministic and non-interactive. It ends immediately when any ship’s hull reaches 0.

### 6.1 Turn Structure

6 turns with fixed range sequence:

|Turn     |1   |2  |3    |4      |5        |6        |
|---------|----|---|-----|-------|---------|---------|
|Default  |LONG|MID|CLOSE|CLOSE  |MID      |LONG     |
|+Boarding|LONG|MID|CLOSE|CLOSE  |**CLOSE**|**CLOSE**|
|+Skirmish|LONG|MID|CLOSE|**MID**|MID      |LONG     |
|+Both    |LONG|MID|CLOSE|**MID**|**CLOSE**|**CLOSE**|

### 6.2 Combat Initialization

Before Turn 1:

1. **Base Stats:** Sum `power` for each type (LONG, MID, CLOSE, SHIELD, HULL)
1. **Multipliers:** Apply all `mult` values multiplicatively per type
1. **Doctrine:** If active, multiply all damage types by ×1.2
1. **Flat Bonuses:** Add ability bonuses (SHIELD, ALL_MID) to final totals
1. **Battle Pools:**
- `battle_shield` = Final SHIELD total
- `battle_hull` = Current player hull

### 6.3 Turn Resolution

Each turn follows this strict order:

#### 6.3.1 Player Action

1. **Get Damage:** Select final damage for current range
1. **SHIELD_BREAK:** If equipped, set enemy shield to 0
1. **Check LIFE_STEAL Eligibility:** Record if enemy shield is currently 0
1. **Apply Damage:** Reduce enemy shield, then hull
1. **LIFE_STEAL:** If eligible, heal player by item power × multiplier
1. **BACKFIRE:** If equipped, damage player by ability value
1. **COUNTER(LONG):** If range is LONG and enemy has this skill:
- Counter damage = skill_value × (number of LONG items equipped)
- Apply to player (shield first, then hull)
1. **Victory Check:** If enemy hull ≤ 0 and not SIMULTANEOUS, player wins

#### 6.3.2 Enemy Action

1. **REGEN:** If skill present, heal enemy hull by skill_value
1. **DEGEN:** If skill present, reduce enemy hull by skill_value
1. **DORMANT/OVERLOAD:** If turn > 3, multiply attack by skill_value
1. **EXPLOSIVE:** If turn = 4, add skill_value to damage, then set enemy hull to 0
1. **Apply Damage:** Reduce player battle_shield, then hull
1. **Defeat Check:** If player hull ≤ 0, player loses

#### 6.3.3 Turn End

1. **GATE:** If enemy has skill and shield < skill_value, set shield to skill_value
1. **SIMULTANEOUS Resolution:** If active and either ship hull ≤ 0, end combat

### 6.4 Post-Combat

1. **Remove Disposables:** Delete items with `disposable: 1`
1. **GROWTH:** Increase power permanently for equipped GROWTH items
1. **Repair:** If NO_REPAIR not active, heal player by HULL total × multipliers
1. **Clamp:** Player hull cannot exceed max_hull

### 6.5 Combat Outcomes

|Outcome    |Condition                         |Result            |
|-----------|----------------------------------|------------------|
|**CLEAR**  |Stage 30, enemy dead, player alive|Game Won          |
|**VICTORY**|Enemy dead, player alive          |Proceed to Reward |
|**DEFEAT** |Player dead (any cause)           |Game Over         |
|**DEFEAT** |Boss alive after Turn 6           |Game Over         |
|**DRAW**   |Both alive after Turn 6 (non-Boss)|Advance, no reward|

**Note:** Mutual destruction (both dead) = DEFEAT. Player must survive to rescue LAIKA.

-----

## 7. ENEMY SKILLS

|Skill        |Trigger          |Effect                                         |
|-------------|-----------------|-----------------------------------------------|
|GATE         |Turn end         |If shield < value, set shield = value          |
|REGEN        |Each turn        |Heal hull by value                             |
|DEGEN        |Each turn        |Lose hull by value                             |
|EXPLOSIVE    |Turn 4           |Add value to damage, then self-destruct        |
|OVERLOAD     |Turn 4+          |Multiply attack by value (e.g., ×2.0)          |
|DORMANT      |Turn 4+          |Multiply attack by value (0 = stop attacking)  |
|COUNTER(LONG)|After LONG attack|Deal (value × LONG item count) damage to player|

### 7.1 Skill Descriptions (UI)

```javascript
const SKILL_DESC = {
  'GATE': "【防壁】ターン終了時、シールドを指定値まで再生成する。",
  'REGEN': "【自己修復】毎ターン、耐久値を回復する。",
  'DEGEN': "【腐食】毎ターン、耐久値が減少する。",
  'EXPLOSIVE': "【自爆】第4ターンに固定ダメージの自爆攻撃を行い、自壊する。",
  'OVERLOAD': "【過負荷】第4ターン以降、攻撃ダメージが上昇する。",
  'DORMANT': "【休眠】第4ターン以降、攻撃を停止する。",
  'COUNTER(LONG)': "【迎撃】長距離攻撃を受けた際、長距離武装数に応じて反撃する。",
};
```

-----

## 8. REWARDS

### 8.1 Victory Reward

Choose 1 of 3 random items matching enemy rarity:

|Enemy Rank|Item Rarity|
|----------|-----------|
|NORMAL    |1          |
|ELITE     |2          |
|BOSS      |3          |

### 8.2 Boss Rewards

**Automatic:** Full hull repair

**Choose 1 (ACT I offers first 3, ACT II offers remaining 3):**

|ID           |Name|Effect                         |
|-------------|----|-------------------------------|
|expansion    |拡張  |max_slots +2                   |
|reinforcement|強化  |max_slots +1, max_hull +50     |
|boarding     |白兵戦 |max_slots +1, Turns 5-6 → CLOSE|
|skirmish     |遭遇戦 |max_slots +1, Turn 4 → MID     |
|logistics    |兵站  |Add 🚀 ランス at each combat start |
|doctrine     |教義  |max_hull +60, All damage ×1.2  |

**ACT III Boss:** No bonus selection (salvage reward only).

-----

## 9. DOCK EVENT

At dock stages, player must choose exactly ONE option:

### 9.1 Emergency Repair (緊急修理)

- Scrap items to restore 30% max_hull
- Scrap cost: ACT I = 1 item, ACT II = 2 items, ACT III = 3 items
- Unavailable if insufficient items

### 9.2 Emergency Missile Fabrication (緊急ミサイル製造)

- max_hull −10 (permanent)
- Gain one 🚀 ランス

### 9.3 Leave Dock (出港)

- No effect, proceed to next stage

-----

## 10. SCENES

### 10.1 Scene Flow

```
START → MAIN → [COMBAT|DOCK] → [REWARD] → MAIN → ... → END
```

### 10.2 Scene Definitions

|Scene |Purpose                            |Inputs              |
|------|-----------------------------------|--------------------|
|START |Display story intro                |“発進” button         |
|MAIN  |Route to combat/dock based on stage|Auto-transition     |
|COMBAT|Equipment setup + battle resolution|Equip toggle, “戦闘開始”|
|REWARD|Item + boss bonus selection        |Select options, “獲得”|
|DOCK  |Repair/fabrication choices         |Select one option   |
|END   |Victory or defeat screen           |“再スタート”             |

### 10.3 Display Requirements

**Combat Scene - Pre-Battle:**

- Player: hull, max_hull, slots used/max, damage preview (LONG/MID/CLOSE/SHIELD)
- Enemy: name, rank, hull, shield, attacks, skill description
- Inventory: equipped (✓) and unequipped items with full stats

**Combat Scene - Post-Battle:**

- Full combat log with turn-by-turn breakdown
- Result indicator (勝利/敗北/引き分け/クリア)

**All numeric displays:** Round to integer (e.g., 135.99 → 136)

-----

## 11. STORY

### 11.1 Opening

```
> 遭難信号を受信。

> 送信元: LAIKA

「私よ。
K9が陥落した。
ソーラー・ベアが惑星を奪った。
私も捕らえられた。
あなたがここにいなかったことは知っている。

どうか…死なないで。」

> 信号途絶。

> K9へ航路設定中。
```

### 11.2 Victory (Stage 30 Clear)

```
K9軌道を制圧。
LAIKAを救出。

「帰ってきてくれたのね。」
```

### 11.3 Defeat

```
信号途絶
```

-----

## 12. IMPLEMENTATION REFERENCE

### 12.1 Data Parsing

```javascript
// Constants
const R = { N: 'NORMAL', E: 'ELITE', B: 'BOSS' };
const T = { L: 'LONG', M: 'MID', C: 'CLOSE', S: 'SHIELD', H: 'HULL', X: 'MODULE' };
const SK = { GATE:'GATE', REG:'REGEN', DEG:'DEGEN', EXP:'EXPLOSIVE', OVR:'OVERLOAD', DOR:'DORMANT', CL:'COUNTER(LONG)' };
const AB = { SH:'SHIELD', AM:'ALL_MID', SIM:'SIMULTANEOUS', NR:'NO_REPAIR', LS:'LIFE_STEAL', GR:'GROWTH', SB:'SHIELD_BREAK', BF:'BACKFIRE' };

// Generic parser
const parse = (schema, data) => data.map(row => {
  const obj = {};
  schema.forEach((key, i) => obj[key] = row[i]);
  return obj;
});

// Equipment parser
const EQ_SCHEMA = ['slots', 'name', 'power', 'type', 'rarity', 'disposable', 'mult', 'ability'];
const equipmentList = parse(EQ_SCHEMA, EQ_DATA);

// Enemy parser
const EN_SCHEMA = ['difficulty', 'name', 'hull', 'shield', 'rank', 'attacks', 'skills'];
const enemyList = parse(EN_SCHEMA, EN_DATA);

// Stage parser
const ST_SCHEMA = ['stage', 'type', 'difficulty', 'rank'];
const stageList = parse(ST_SCHEMA, ST_DATA);
```

### 12.2 Helper Functions

```javascript
// Get Act from stage number (1-30)
const getAct = (stage) => Math.floor((stage - 1) / 10) + 1;

// Get stage position within Act (1-10)
const getStageInAct = (stage) => ((stage - 1) % 10) + 1;

// Get scaling factor for Act
const getActScale = (act) => act === 1 ? 1 : act === 2 ? 1.5 : 2;

// Damage application (shield absorbs first)
const applyDamage = (damage, shield, hull) => {
  const shieldDamage = Math.min(shield, damage);
  const hullDamage = damage - shieldDamage;
  return {
    shield: Math.max(0, shield - damage),
    hull: Math.max(0, hull - hullDamage)
  };
};

// Create inventory item instance
const createItem = (name, eqList) => {
  const base = eqList.find(e => e.name === name);
  if (!base) return null;
  return { ...base, id: Math.random().toString(36).substr(2, 9) };
};
```

### 12.3 Type Translation (UI)

```javascript
const translateType = (type) => ({
  'LONG': '長距離武装',
  'MID': '中距離武装', 
  'CLOSE': '近距離武装',
  'SHIELD': 'シールド',
  'HULL': '耐久補助',
  'MODULE': 'モジュール'
}[type] || type);

const translateRange = (range) => ({
  'LONG': '長距離',
  'MID': '中距離',
  'CLOSE': '近距離'
}[range] || range);

const translateRank = (rank) => ({
  'NORMAL': '通常',
  'ELITE': 'エリート',
  'BOSS': 'ボス'
}[rank] || rank);
```

-----

## 13. CHANGELOG

### v0.8.7 (Current)

- **Data Format:** Changed from CSV to positional array notation
- **Multi-Skill Support:** Enemy skills now support arrays for future expansion
- **DORMANT Clarification:** Updated description to “休眠” (sleep) - stops attacking when value=0
- **Single Language:** Removed English data, Japanese only
- **Mutual Destruction:** Clarified as DEFEAT (player must survive to rescue LAIKA)

### v0.8.6

- Added SHIELD-BREAKER and BACKFIRE abilities
- Added Boarding, Skirmish, Doctrine boss rewards
- Reworked Dock to 3-option choice system
- Full 30-stage implementation

### v0.8.4.1

- Initial stable release

-----

**END OF SPECIFICATION**
