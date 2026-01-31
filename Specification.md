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

- Defines here: src/data/enemyData.js

### 2.3 Equipment Abilities

- Defines here: src/data/equipmentData.js

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


### 3.2 Enemies

Schema: `[difficulty, name, hull, shield, rank, attacks, skills]`

- `attacks`: `[LONG, MID, CLOSE]`
- `skills`: `[[SK.*, value], ...]` (supports multiple)


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
  - Normal deck: 19 types = 19 cards
  - Elite deck:  12 types = 12 cards
  - Boss deck: 8 types = 8 cards
  - if it empties, refill. 
  - Guarantees: within each bag-length of draws, every item type appears exactly once

- **Reward decision decks**: Determine item rarity reward per enemy rank, rounded. 
  - Deck size = `rank` combats per ACT × 3 (reward choices) = ex. normal rank has 7 combats, then 21 cards. (Tetris style randomness)  
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

- Defined at /src/data/gameConfig.js

### 4.2 Act Scaling

- Scaling applies to enemy `hull`, `shield`, and all `attacks`.
- Defined at /src/data/gameConfig.js

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
1. Apply OVERDRIVE: If equipped, player hull -= v
1. **Sum Base Stats:** Total `power` per type (L/M/C/S/H)
1. **Apply Multipliers:** Multiply each type by all applicable `mult` values
1. Apply COMPACT: Equipment with 2+ slots count as 1 slot (stat calculation unaffected)
1. **Apply Doctrine:** If active, all damage types ×1.2
1. Apply BERSERKER: If player hull < (max_hull × 0.5), all damage types ×1.3
1. Add Flat Bonuses:
  - AB.SH → shield
  - AB.OVERDRIVE → shield
  - AB.AM → MID damage
1. **Set Battle Pools:** `battle_shield`, `battle_hull`

### 5.3 Turn Resolution Order

**Player Phase:**
1. Calculate damage for current range
- Apply in this order:
  - Base damage (after multipliers, doctrine, berserker, etc.)
  - `NO_SHIELD_POWER`
    - Condition: battle_shield === 0
    - Effect: damage × v
  - `PHASE` (defensive, but evaluated here)
    - Condition: first hull damage instance
    - Effect: reduce incoming hull damage
  - Damage proceeds to shield → hull
2. `SHIELD_BREAK`: Set enemy shield to 0
3. Check `LIFE_STEAL` eligibility (enemy shield = 0?)
4. Apply damage to enemy (shield → hull)
- `DOUBLE_TAP`
  - Condition: enemy shield === 0
  - Effect: deal additional v damage directly to hull
- `CHIP_DAMAGE`
  - Condition: enemy shield > 0
  - Effect: deal additional v damage to shield
5. `LIFE_STEAL`: Heal if eligible
6. `BACKFIRE`: Self-damage
7. `COUNTER_LONG`: Enemy counter-attack (LONG range only)
8. Victory check (skip if `SIMULTANEOUS`)

**Enemy Phase:**

1. `REGEN`: If enemy hull > 0, heal hull, not exceed to enemy's initial hull.  
1. `DEGEN`: Lose hull
1. `OVERLOAD`/`DORMANT`: Modify attack (turn 4+)
1. `EXPLOSIVE`: Add damage to Player hull, then set enemy hull to 0.  (turn 4)
1. Apply damage to player
- If player hull would drop to 0 or below:
  - If GUTS unused → set hull = 1, mark GUTS consumed
1. Defeat check

**Turn End:**

1. `GATE`: Regenerate shield to value
1. `SHIELD_MULTIPLIER` (if turn === 4)
- Uses remaining battle_shield
1. If `SIMULTANEOUS`, Victory check. 

### 5.4 Post-Combat

1. Remove disposable items
1. Apply `GROWTH` to equipped items. (increase power permanently)
1.	Calculate hull repair:
  - Base repair = HULL total × multipliers
  -	CAPACITOR: Add (remaining battle_shield × v) to repair amount
  - **LOW_HP_RECOVERY**
    - If player hull < max_hull × 0.3: repair_amount += v
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
|**0.9.2**|New abilities:GUTS, PHASE, SHIELD_MULTIPLIER, LOW_HP_RECOVERY, DOUBLE_TAP, NO_SHIELD_POWER, CHIP_DAMAGE.  |
|0.9.1|Prediction system, refines master data. specification bug fix. Addinh new items and abilities.  |
|0.9.0|Items, Enemy and stage update. Changed the initialization way of Items and boss rewards.|
|0.8.7|Unified single-file spec. Positional array data. Multi-skill support. 休眠 skill rename.|
|0.8.6    |Added SHIELD_BREAK, BACKFIRE. New boss rewards. Dock rework.                          |
|0.8.4.1  |Initial stable release.                                                               |

-----

**END OF SPECIFICATION**