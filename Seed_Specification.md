# STAR CANINE - SEED SYSTEM SPECIFICATION

Addendum to STAR CANINE v0.8.7 Specification.
Defines deterministic seed-based system for AI testing and reproducibility.

-----

## 1. OVERVIEW

### 1.1 Purpose

The seed system enables:
- **Reproducibility**: Same seed + same choices = identical outcomes
- **AI Testing**: Automated balance testing and regression verification
- **Beatability Analysis**: Verify whether a given seed is winnable

### 1.2 Design Principles

1. A single integer seed determines all non-combat randomness
2. Once seed is set, no probabilistic variance exists
3. Combat remains fully deterministic (unchanged from base game)
4. All random operations use seeded PRNG instead of `Math.random()`

-----

## 2. SEED INITIALIZATION

### 2.1 Seed Input

```javascript
// Seed can be:
// - User-provided: Any 32-bit integer (0 to 4294967295)
// - Auto-generated: Math.random() * 0xFFFFFFFF | 0 at game start

const SEED_CONFIG = {
  min: 0,
  max: 0xFFFFFFFF,  // 4294967295
  default: null,     // null = auto-generate
};
```

### 2.2 Player State Extension

```javascript
const INITIAL_PLAYER = {
  // ... existing fields ...

  // Seed system additions
  seed: null,           // The master seed for this run
  rng_state: null,      // Current PRNG state (for save/restore)
  item_id_counter: 0,   // Sequential counter for item IDs
};
```

### 2.3 Game Start Flow

1. If seed provided → use provided seed
2. If seed is null → generate random seed
3. Initialize PRNG with seed
4. Display seed to user (for sharing/replay)
5. Store seed in player state

-----

## 3. SEEDED PRNG

### 3.1 Algorithm: Mulberry32

Fast, high-quality 32-bit PRNG suitable for game use.

```javascript
// Create seeded PRNG instance
const createPRNG = (seed) => {
  let state = seed >>> 0;  // Ensure unsigned 32-bit

  return {
    // Returns float in [0, 1)
    next: () => {
      state = (state + 0x6D2B79F5) | 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    },

    // Returns integer in [min, max] inclusive
    nextInt: (min, max) => {
      return min + Math.floor(this.next() * (max - min + 1));
    },

    // Get current state (for save)
    getState: () => state,

    // Restore state (for load)
    setState: (s) => { state = s >>> 0; },
  };
};
```

### 3.2 Global RNG Instance

```javascript
// Single RNG instance per game run
let gameRNG = null;

const initializeRNG = (seed) => {
  gameRNG = createPRNG(seed);
};

const getRNG = () => gameRNG;
```

-----

## 4. ITEM ID SYSTEM

### 4.1 ID Format

Items use sequential integer IDs for AI-friendly identification.

```javascript
// ID Schema
const ITEM_ID = {
  format: 'integer',      // Sequential integers starting from 0
  scope: 'per-run',       // IDs unique within a single game run
  persistence: 'stable',  // ID never changes once assigned
};
```

### 4.2 ID Generation

```javascript
// Counter-based ID generation (deterministic)
const generateItemId = (player) => {
  const id = player.item_id_counter;
  player.item_id_counter += 1;
  return id;
};

// Updated createItem function
const createItem = (name, player) => {
  const base = equipmentList.find(e => e.name === name);
  if (!base) return null;
  return {
    ...base,
    id: generateItemId(player),
  };
};
```

### 4.3 Item Instance Structure

```javascript
// Full item instance schema
const ItemInstance = {
  id: 0,              // Unique integer ID (AI reference key)
  name: "🚀 ランス",   // Display name (may have duplicates)
  slots: 1,           // Slot cost
  power: 40,          // Base power (may be modified by GROWTH)
  type: T.L,          // Equipment type
  rarity: 0,          // Rarity tier
  disposable: 1,      // 1 = consumed after combat
  mult: null,         // Multiplier [type, value] or null
  ability: null,      // Ability [AB.*, value?] or null
};
```

### 4.4 AI Item Selection Interface

```javascript
// For AI/automated play, items are selected by ID
const selectItemById = (inventory, id) => {
  return inventory.find(item => item.id === id);
};

// Example: AI equipping items
const equipByIds = (player, itemIds) => {
  player.equipped = itemIds.map(id =>
    selectItemById(player.inventory, id)
  ).filter(Boolean);
};

// Example: AI selecting reward
const selectRewardById = (rewardOptions, id) => {
  return rewardOptions.find(item => item.id === id);
};
```

-----

## 5. DETERMINISTIC REWARD GENERATION

### 5.1 Reward Pool Shuffling

Replace `Math.random()` with seeded Fisher-Yates shuffle.

```javascript
// Seeded Fisher-Yates shuffle
const seededShuffle = (array, rng) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
```

### 5.2 Victory Reward Generation

```javascript
// Deterministic reward generation
const generateVictoryRewards = (enemyRank, player) => {
  const rng = getRNG();

  // Filter pool by rarity (unchanged logic)
  const rarityMap = { NORMAL: 1, ELITE: 2, BOSS: 3 };
  const targetRarity = rarityMap[enemyRank];
  const pool = equipmentList.filter(e => e.rarity === targetRarity);

  // Seeded shuffle instead of Math.random()
  const shuffled = seededShuffle(pool, rng);

  // Take first 3 as options
  const options = shuffled.slice(0, 3);

  // Assign IDs to reward items
  return options.map(item => ({
    ...item,
    id: generateItemId(player),
  }));
};
```

### 5.3 Reward Table Pre-Generation (Optional)

For AI analysis, entire reward sequence can be pre-computed.

```javascript
// Pre-generate all rewards for a seed
const precomputeRewardTable = (seed) => {
  const rng = createPRNG(seed);
  const rewards = [];

  // Stage sequence with ranks
  const stageRanks = [
    // Act I
    'NORMAL', 'NORMAL', 'ELITE', null, 'NORMAL',
    'NORMAL', 'ELITE', 'NORMAL', null, 'BOSS',
    // Act II (same pattern)
    'NORMAL', 'NORMAL', 'ELITE', null, 'NORMAL',
    'NORMAL', 'ELITE', 'NORMAL', null, 'BOSS',
    // Act III (same pattern)
    'NORMAL', 'NORMAL', 'ELITE', null, 'NORMAL',
    'NORMAL', 'ELITE', 'NORMAL', null, 'BOSS',
  ];

  stageRanks.forEach((rank, stage) => {
    if (rank === null) {
      rewards.push({ stage: stage + 1, type: 'DOCK', options: null });
    } else {
      const rarityMap = { NORMAL: 1, ELITE: 2, BOSS: 3 };
      const pool = equipmentList.filter(e => e.rarity === rarityMap[rank]);
      const shuffled = seededShuffle(pool, rng);
      rewards.push({
        stage: stage + 1,
        type: 'COMBAT',
        rank: rank,
        options: shuffled.slice(0, 3).map(e => e.name),
      });
    }
  });

  return rewards;
};
```

-----

## 6. AI INTERFACE

### 6.1 Game State Export

```javascript
// Full state for AI consumption
const exportGameState = (player, stage) => ({
  // Seed info
  seed: player.seed,
  rng_state: getRNG().getState(),

  // Stage info
  stage: stage,
  act: getAct(stage),

  // Player stats
  hull: player.hull,
  max_hull: player.max_hull,
  max_slots: player.max_slots,

  // Items with IDs
  inventory: player.inventory.map(item => ({
    id: item.id,
    name: item.name,
    slots: item.slots,
    power: item.power,
    type: item.type.id,
    rarity: item.rarity,
    disposable: item.disposable,
    mult: item.mult ? [item.mult[0].id, item.mult[1]] : null,
    ability: item.ability ? [item.ability[0].id, item.ability[1]] : null,
  })),

  equipped_ids: player.equipped.map(item => item.id),

  // Boss rewards
  boss_rewards: {
    logistics: player.logistics,
    boarding: player.boarding,
    skirmish: player.skirmish,
    doctrine: player.doctrine,
  },

  // Available choices
  available_boss_rewards_act1: player.bossRewardsAct1,
  available_boss_rewards_act2: player.bossRewardsAct2,
});
```

### 6.2 Action Format

```javascript
// AI action schema
const ActionSchema = {
  // Equipment action
  EQUIP: {
    type: 'EQUIP',
    item_ids: [0, 1, 2],  // Array of item IDs to equip
  },

  // Combat action (no choices needed - deterministic)
  COMBAT: {
    type: 'COMBAT',
  },

  // Reward selection
  SELECT_REWARD: {
    type: 'SELECT_REWARD',
    item_id: 5,  // ID of chosen reward item
  },

  // Boss reward selection
  SELECT_BOSS_REWARD: {
    type: 'SELECT_BOSS_REWARD',
    reward_key: 'expansion',  // Key from BR constant
  },

  // Dock action
  DOCK: {
    type: 'DOCK',
    action: 'REPAIR' | 'FABRICATE' | 'LEAVE',
    scrap_ids: [3, 4],  // For REPAIR: IDs of items to scrap
  },
};
```

-----

## 7. UI ADDITIONS

### 7.1 Seed Display

```javascript
const UI_SEED = {
  lbl_seed: 'シード',
  lbl_seed_input: 'シード入力（空欄で自動生成）',
  btn_copy_seed: 'シードをコピー',
  msg_seed_copied: 'シードをコピーしました',
};
```

### 7.2 Title Screen Modification

Display seed input option at game start:

```
┌─────────────────────────────┐
│       STAR CANINE           │
│                             │
│  シード: [______________]   │
│  （空欄で自動生成）           │
│                             │
│       [ 発進 ]              │
└─────────────────────────────┘
```

### 7.3 In-Game Seed Display

Show current seed in game UI for sharing:

```
ステージ 5 / 30 | ACT I | シード: 1234567890
耐久値: 180/200 | スロット: 4/6
```

-----

## 8. IMPLEMENTATION CHECKLIST

### 8.1 Required Changes

| Component | File | Change |
|-----------|------|--------|
| PRNG Module | React_J.jsx | Add `createPRNG()`, `seededShuffle()` |
| Item Creation | React_J.jsx:214 | Use counter-based ID |
| Reward Shuffle | React_J.jsx:866 | Use `seededShuffle()` |
| Player State | React_J.jsx:275 | Add `seed`, `rng_state`, `item_id_counter` |
| Title Screen | React_J.jsx | Add seed input field |
| Game Header | React_J.jsx | Display current seed |

### 8.2 Verification Tests

```javascript
// Test: Same seed produces identical rewards
const testDeterminism = () => {
  const seed = 12345;
  const rewards1 = precomputeRewardTable(seed);
  const rewards2 = precomputeRewardTable(seed);
  assert(JSON.stringify(rewards1) === JSON.stringify(rewards2));
};

// Test: Different seeds produce different rewards
const testVariance = () => {
  const rewards1 = precomputeRewardTable(11111);
  const rewards2 = precomputeRewardTable(22222);
  assert(JSON.stringify(rewards1) !== JSON.stringify(rewards2));
};

// Test: Item IDs are sequential
const testItemIds = () => {
  const player = { item_id_counter: 0 };
  const item1 = createItem("🚀 ランス", player);
  const item2 = createItem("🚀 ランス", player);
  assert(item1.id === 0);
  assert(item2.id === 1);
  assert(item1.id !== item2.id);  // Same name, different IDs
};
```

-----

## 9. EXAMPLE SCENARIOS

### 9.1 Duplicate Item Distinction

```javascript
// Player has two "🚀 ランス" missiles
const inventory = [
  { id: 0, name: "🚀 ランス", power: 40, ... },
  { id: 1, name: "🚀 ランス", power: 40, ... },
  { id: 2, name: "⚡ クロウ", power: 10, ... },
];

// AI can reference specific missile by ID
const action = {
  type: 'EQUIP',
  item_ids: [0, 2],  // Equip first Lance (id:0) and Claw (id:2)
};

// After combat, if Lance id:0 is consumed (disposable),
// Lance id:1 remains available with its original ID
```

### 9.2 Full Run Reproducibility

```javascript
// Run 1: Seed 42, player chooses reward ID 5 at stage 1
// Run 2: Seed 42, player chooses reward ID 5 at stage 1
// Result: Identical game states after stage 1

// The same seed + same choices = identical outcomes
// AI can replay exact sequences for analysis
```

-----

## 10. COMPATIBILITY

### 10.1 Backward Compatibility

- Existing save format: Not compatible (new fields required)
- Gameplay: Unchanged except for reward determinism
- UI: Minimal additions (seed display only)

### 10.2 Version Marker

```javascript
const GAME_VERSION = {
  spec: '0.8.7',
  seed_system: '1.0.0',
  features: ['DETERMINISTIC_REWARDS', 'SEQUENTIAL_ITEM_IDS'],
};
```

-----

**END OF SEED SPECIFICATION**
