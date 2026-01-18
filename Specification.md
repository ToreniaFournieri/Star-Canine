# STAR CANINE SPECIFICATION v0.6.6
- Version note:Easyer for testing abilities functions

## 1. OVERVIEW
- This is a terminal-based (or React), deterministic, text-only roguelike spaceship game.
  - No randomness in combat
  - No graphics
  - Designed to be playable and solvable by LLMs
- Player progresses through stages, fighting enemies, managing hull HP and ammo, and upgrading ship equipment.

### 1.1 CORE CONCEPTS
- The player controls ONE ship
- Battles are 1 vs 1
- Damage persists between battles (hull only)
- Ammo is a limited resource
- Strategy is about:
  - Equipment selection
  - Ammo usage
  - Preventing enemy attacks by killing first

### 1.2 DESIGN GOALS (FOR CODER)
- Deterministic output
- Clear logs per turn
- Easy to reason damage
- Minimal state tracking
- No hidden rules
- **Optimize token usuage**
  - Use CSV strings for all static data blocks to reduce boilerplate.
  - Strict Data Formatting: CSV blocks must contain NO leading spaces, NO trailing spaces, and NO indentation within the backticks.

### 1.3 Implementation Rules (FOR CODER, especially Claude)
1. **Robust CSV Parsing** 
- To prevent formatting artifacts (extra spaces, indentations) from breaking the game, the parser must actively sanitize input. Use the following logic to ensure strings like " 40" are correctly treated as the number 40.

**REQUIRED Sanitizing Parser Pattern:**
```javascript
const parseCSV = (csv) => {
  // Split by newline and remove empty lines caused by LLM formatting
  const lines = csv.trim().split('\n').map(l => l.trim()).filter(l => l);
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      let val = values[i]?.trim(); // Remove LLM-generated padding
      // Automatic type conversion
      if (val === '0' || val === '') obj[h] = 0;
      else if (!isNaN(val) && val !== '') obj[h] = Number(val);
      else obj[h] = val;
    });
    return obj;
  });
};
```

2. Scene Mapping & Flow Control
- Separation of Concerns: Scenes must be "dumb" (Presentation only).
- Centralized Logic: All state transitions (scene and stageNum) must happen in the parent Flow component via an advanceStage function.
- Component References: Use the mapping pattern below to avoid deeply nested conditional trees.

3. Data Verification Constraint
- Combat Init: Before entering combat, the controller must verify that ENEMY_DATA contains a matching entry for the current stage's difficulty and rank.
- Fallback: If a lookup fails, the game must not hang; it must return to the start scene or display a "Signal Lost (Data Error)" message.

-----
## 2. DEFINITIONS
## 2.1 Equipment Data
### 2.1.1 Equipment Fields
Each equipment entry defines the following fields:
- `name`: Display name of the equipment. May include emoji identifiers.
- `power_stat`: Primary numeric value. Its meaning depends entirely on `eq_type`.
- `ammo_cost`: Ammo consumed per activation. Ignored for types that do not consume ammo (set to `0`).
- `eq_type`: Equipment behavior category. Defines combat range or special behavior.  
  Valid values:
    - `LONG` — Weapon that fires only at LONG range.
    - `MID` — Weapon that fires only at MID range.
    - `CLOSE` — Weapon that fires only at CLOSE range.
    - `SHIELD` — Absorbs damage at LONG range.
    - `ARMOR` — Absorbs damage at CLOSE range.
    - `MODULE_[TYPE]` — Multiplies damage/effect of matching category.
    - `UTILITY` — Passive items that trigger special abilities.
    - `JUNK` — Inert item with no combat effect.
- `rarity`: Integer (`0` to `3`). Determines reward tier.
    - `0`: Starter/Non-reward.
    - `1`: Normal Enemy Drop.
    - `2`: Elite Enemy Drop.
    - `3`: Boss Enemy Drop.
- `disposable`: Boolean (`0` or `1`). Whether the equipment is destroyed after combat and replaced with *Broken Scrap*.
- `ability`: String effect (e.g., `+10 shield`). Set to `0` if no ability exists.

### 2.1.2 Value Interpretation Rules
The meaning of `power_stat`, `ammo_cost`, and `ability` is inferred from `eq_type`.

- **`LONG` / `MID` / `CLOSE`**
  - `power_stat`: Damage dealt at the corresponding combat range.
  - `ammo_cost`: Ammo consumed per activation turn.
- **`SHIELD` / `ARMOR`**
  - `power_stat`: Damage absorbed at corresponding range (SHIELD: LONG, ARMOR: CLOSE).
- **`MODULE`**
  - Applies a multiplier to the `power_stat` (or `ability` numeric value) of target type.
  - `MODULE_UTILITY` specifically multiplies the numeric values in `UTILITY` abilities.
- **`UTILITY`**
  - `power_stat`: Usually `0`. Combat effect is driven by the `ability` field.

### 2.1.3 Ability Logic & Timing
Abilities are parsed for a numeric value and a target keyword.
- **Pre-Combat (Initialization):** `+X shield`, `+X armor`. These values are added to the ship's defense totals for the duration of the current battle only.
- **Post-Combat (Resolution):** - `+X hull repair`: Heals player hull.
    - `+X damage per combat`: Permanently increases the `power_stat` field of that specific item instance.

### 2.1.4 Constraints
- Each equipment entry defines exactly one behavior via `eq_type`.
- All behavior must be derived from `eq_type` and `ability` fields.
- Scaling items (e.g., `Rookie fighter`) must have their `power_stat` tracked individually in the player's unique inventory instance.

#### 2.1.4 Equipment csv layout

```csv
name,power_stat,ammo_cost,eq_type,rarity,disposable,ability
🚀 Lance,40,3,LONG,0,0,0
🚀 Interceptor,40,3,LONG,1,0,+10 shield
🚀 Meteor,50,4,LONG,1,0,0
🚀 Nova,65,5,LONG,1,0,0
🚀🚀 Resurrection,40,1,LONG,1,0,0
🚀💥 Gambit,80,3,LONG,1,1,0
🔥 Warhead Optimizer,2,0,MODULE_LONG,3,0,0
✈️ Drones,15,0,MID,1,0,0
✈️ Defender,10,1,MID,1,0,+10 shield
✈️ Wing,20,1,MID,1,0,0
✈️ Squadron,35,2,MID,1,0,0
✈️✈️ Rookie fighter,5,1,MID,1,0,+3 damage per combat
✈️💥 Kamikaze,80,2,MID,1,1,0
✈️✈️✈️ Blue Wolf,60,2,MID,2,0,0
⚡ Fang,10,0,CLOSE,0,0,0
⚡️ Iron Beam,5,0,CLOSE,1,0,+10 armor
⚡ Claw,15,1,CLOSE,1,0,0
⚡ Cudgel,20,2,CLOSE,1,0,0
⚡️⚡️ Laser shield,10,0,CLOSE,1,0,+15 shield
⚡💥 Burn soul,40,2,CLOSE,1,1,0
💎 Prismatic Lens,2,0,MODULE_CLOSE,2,0,0
🟫 Plating,25,0,ARMOR,0,0,0
🟫🟫 Heavy armor,35,0,ARMOR,1,0,0
🟫 Improvised armor,60,0,ARMOR,1,1,0
🛡️ Veil,20,0,SHIELD,1,0,0
🛡️🛡️ Aegis,30,0,SHIELD,2,0,0
🛡️🛡️ Ephemera shield,60,0,SHIELD,1,1,0
🔧 Repairer,0,0,UTILITY,1,0,+10 hull repair
🔧🔧 Veteran Repairer,0,0,UTILITY,2,0,+20 hull repair
🔧🔧🔧 Recreational facility,2,0,MODULE_UTILITY,2,0,0
⚠️ Broken Scrap,0,0,JUNK,0,0,0
```

### 2.2 Enemy Data
Enemy data is defined as CSV-style rows embedded directly in the specification.
Each row represents a single hostile unit encountered in combat.

#### 2.2.1 Enemy Field Definitions

1. `difficulty`: Integer. Difficulty tier used for enemy pool selection and ACT scaling.
2. `name`: String. Enemy display name. Must be unique within the enemy list.
3. `hull`: Integer. Enemy hull points (HP). Enemy is destroyed when this reaches 0.
4. `shield`: Integer. Shield value. Absorbs damage at **LONG range only**.
5. `armor`: Integer. Armor value. Absorbs damage at **CLOSE range only**.
6. `rank`: String. Enemy classification. One of:`NORMAL`, `ELITE`, `BOSS`
7. `attack_LONG`: Integer or `0`. Damage dealt at **LONG range**. `0` means the enemy cannot attack at this range.
8. `attack_MID`: Integer or `0`. Damage dealt at **MID range**.  `0` means the enemy cannot attack at this range.
9. `attack_CLOSE`: Integer or `0`. Damage dealt at **CLOSE range**. `0` means the enemy cannot attack at this range.
     
#### 2.2.2 Enemy csv layout

```csv
difficulty,name,hull,shield,armor,rank,attack_LONG,attack_MID,attack_CLOSE
1,Skirmisher,30,0,0,NORMAL,0,0,10
2,Drifter,35,5,0,NORMAL,20,0,10
3,Scout,40,0,10,NORMAL,0,0,15
3,Lancer,45,10,0,NORMAL,30,0,15
5,Raider,50,10,10,ELITE,30,0,20
4,Interceptor,55,15,10,NORMAL,35,0,20
6,Frigate,65,0,20,NORMAL,20,0,25
7,Enforcer,70,20,15,ELITE,40,0,25
8,Howler,80,25,20,ELITE,45,0,30
10,Celestial Reaper,100,30,40,BOSS,50,0,35
```

### 2.3 Player ship initial state
- Player ship state
  - `max_hull`: 200,
  - `shield`: 0,
  - `armor`: 0,
  - `ammo`: 12,
  - `max_slots`: 6,
  - `inventory`: "🚀 Lance", "⚡ Fang", "⚡ Fang", "🟫 Plating"

### 2.4 Stage layout 
- There are two type of stages
  - combat: Combat stage. Enemy is chosen from Enemy data. If it hits mutiple enemies by the provided condition, pick one randomly.
  - dock: heal and resupply
 
### 2.4.1 ACT structure
- One enemy selected deterministically from the matching pool
- CSV format below:
```csv
stage,type,difficulty,rank
1,combat,1,NORMAL
2,combat,2,NORMAL
3,combat,5,ELITE
4,dock,,
5,combat,3,NORMAL
6,combat,4,NORMAL
7,combat,6,ELITE
8,combat,6,NORMAL
9,dock,,
10,combat,10,BOSS
```

### 2.4.2 Progression & Act Scaling
- Act Loop: Upon completing Stage 10, the player advances to Stage 11 (which uses the Stage 1 layout but with Act II scaling).
Act Identification:
ACT I: Stages 1–10 (Scale x1.0)
ACT II: Stages 11–20 (Scale x2.0)
ACT III: Stages 21–30 (Scale x3.0)

- Scale factor applies to Enemy's: `hull`,`shield`,`armor`,`attack_LONG`, `attack_MID`, `attack_CLOSE`

-----
## 3. EQUIPMENT SYSTEM
### 3.1 Inventory vs Slots
- **Inventory:** all equipments the player owns
- **Slots:** up to `max_slots` equipped items
- You may have multiple same id equipments. Need to distinguish them
- ONLY equipped items affect combat
- Equipment can be swapped Pre-combat scene

### 3.1 How equipment works
  - At the first stage, no equipment is equipped by default
  - Up to `max_slots` items may be equipped
  - Equipment selections **persist** between stages

-----
## 4. COMBAT SYSTEM
Combat is deterministic, non-interactive, and resolved through a fixed range sequence.
- No player input once combat starts.
- Combat ends immediately when either side is destroyed.

### 4.1 Turn Structure 
Combat consists of 6 turns following this fixed range order:
**LONG → MID → CLOSE → CLOSE → MID → LONG**

- One range per turn.
- If either side is destroyed, combat ends immediately.

### 4.2 Combat Initialization
At the beginning of combat, the ship's temporary combat stats are calculated:

1. **Defense Summation:**
    - Base Shield = Sum of all `eq_type: SHIELD` values.
    - Base Armor = Sum of all `eq_type: ARMOR` values.
2. **Ability Bonuses:**
    - Scan all equipped items for `ability` strings containing `+X shield` or `+X armor`.
    - Add these values to the Base Shield and Base Armor.
3. **Module Multiplier Calculation:**
    - Equipments with `eq_type` starting with `MODULE_` (e.g., `MODULE_LONG`, `MODULE_UTILITY`) act as multipliers.
    - All matching items receive the multiplier.
    - Multipliers stack multiplicatively (e.g., two x2 modules = x4 total multiplier).
    - Multipliers are computed once before combat and remain static.

### 4.3 Turn Resolution (Per Turn)
Each turn resolves in the following fixed order:

#### 4.3.1 Player Attack
For the current range:
- **Activate all equipped items where:**
    - `eq_type` matches the current range.
    - Player has sufficient `ammo`.
- **Rules:**
    - **Damage per item:** `power_stat` × matching module multiplier.
    - **Total damage:** Sum of all activated items.
    - **Ammo Consumption Rule:** When an item activates, subtract its `ammo_cost` from the player ship's `ammo` pool. If the player ship's `ammo` is less than an item's `ammo_cost`, that specific item cannot be activated for that turn.

#### 4.3.2 Enemy Damage Application
- Apply total damage using **Range Damage Rules (4.4)**.

#### 4.3.3 Enemy Status Check
- If enemy `hull` ≤ 0: Combat ends immediately (**Win**).

#### 4.3.4 Enemy Attack (If Alive)
- Enemy attacks using the value for the current range (`attack_LONG`, etc.).
- Damage is resolved against the player using **Range Damage Rules (4.4)**.

#### 4.3.5 Player Status Check
- If player `hull` ≤ 0: Combat ends immediately (**Defeat**).

### 4.4 Damage Resolution (Authoritative)
Damage application depends on the current range:

| Range | Primary Target | Overflow Target |
| :--- | :--- | :--- |
| **LONG** | Shield | Hull |
| **MID** | Hull | None |
| **CLOSE** | Armor | Hull |

- **Shield/Armor:** Temporary pools that do not regenerate during combat.
- **Overflow:** Damage exceeding the primary target applies to the secondary target (if applicable).

### 4.5 Combat End Processing
This phase occurs after the 6th turn ends or a ship is destroyed.

#### 4.5.1 Cleanup & Evolution
1. **Disposable Removal:** Items with `disposable: 1` are replaced with `⚠️ Broken Scrap`.
2. **Scaling Abilities:** Items with `+X damage per combat` have their `power_stat` permanently increased.
3. **Utility Repair:** - Sum all `+X hull repair` abilities from equipped `UTILITY` items.
    - Apply `MODULE_UTILITY` multipliers to this sum.
    - Heal player `hull` by the resulting total (clamped to `max_hull`).

#### 4.5.2 Outcomes
- **Clear:** Boss of Stage 30 defeated (End of ACT III). (Game Clear).
- **Victory:** Enemy `hull` ≤ 0. (Proceed to Rewards).
- **Defeat:** Player `hull` ≤ 0 OR Boss remains alive after Turn 6. (Game Over).
- **Draw:** Both alive after Turn 6 (and enemy is not a Boss). (Advance Stage, no rewards).

### 4.6 Rewards
#### 4.6.1 Rarity-Based Drops
After a **Victory**, the player chooses **ONE**:
1. **Ammo:** +5 Ammo.
2. **Equipment:** Choose 1 from 3 randomly selected items filtered by the enemy's `rank`:
    - **NORMAL Rank:** Returns items with `rarity: 1`.
    - **ELITE Rank:** Returns items with `rarity: 2`.
    - **BOSS Rank:** Returns items with `rarity: 3`.

#### 4.6.2 Boss Bonus (ACT I & II)
Automatically grants: **Full Hull Repair** and **+12 Ammo**.
Additionally, choose **ONE** bonus:
- `max_slots +2`
- `max_slots +1` AND `max_hull +80` (includes immediate +80 heal)
- `max_slots +1` AND `ammo +12`

### 4.7 Implementation Constraint
- **Pure Logic:** Combat must be calculated as a deterministic function.
- **Single Source:** Damage resolution rules must exist in one place to ensure consistency across LONG/MID/CLOSE ranges.

-----
## 5. Event
### 5.1 Dock
Dock is a repair station. Chose one:
- **Repair:** Heal Hull by 30% of Max Hull
  OR
- **Resupply:** Gain +7 Ammo

-----
## 6. Scene and Flow
This section defines the authoritative game progression flow and the scenes used to present game state.
**Progression is controlled exclusively by the Flow; scenes do not alter progression logic.**

### 6.1 Flow

- Main loop decides the next Scene by following flow:
```
Start Scene
↓
Main Loop:
[Check Next Stage]
│ 
├─ If stage type is Combat
│   ↓
│   Combat Scene
│   ↓
│   Reward Scene
│   ↓
│   continue Main Loop / Game End Scene
│
└─ If stage type is Dock
    ↓
    Dock Scene
```

### 6.2 Scene Definitions
Each scene is a presentation and input layer only.  
Scenes do not control progression; all transitions are dictated by the Flow system.

#### 6.2.1 Start Scene
- **Display**
  - Title, version
  - Opening Story
- **Input**
  - "Launch" to Exit
- **Exit**
  - Move to Main Loop (Stage 1)

#### 6.2.2 Combat Scene
**Purpose:** Equipment preparation and deterministic combat resolution
- **Display**
  - **Player status**
    - `hull`,  `shield`, `armor`, `ammo`
  - **Enemy status**
    - `hull`, `shield`, `armor`
    - Attack values: `attack_LONG`, `attack_MID`, `attack_CLOSE`
  - **Inventory display order**
    1. Equipped items (checkmarked)
    2. Unequipped items
  - **Equipment display**
    - `name`, `eq_type`, `power_stat`, `ammo_cost`, `disposable `
  - **LOG**
    - After combat engagement, a combat log is shown
- **Input**
  - **Pre-combat**
    - Equip / unequip inventory items
    - "Engage Combat" button
  - **During combat**
    - No player input (combat resolves automatically)
  - **Post-combat**
    - "Continue" button
- **Exit**
  - Detailed conditions described in 4.5.2 Combat Outcomes
    - Clear → Game End Scene
    - Victory → Reward Scene
    - Draw → Advance stage, return to Main Loop
    - Defeat → Game End Scene
 
#### 6.2.3 Reward Scene
**Purpose:** Resolve post-combat equipment acquisition
- **Display**
  - Available normal reward items
  - Each reward shows: `name`, `eq_type`, `power_stat`, `ammo_cost`, `disposable `
  - Boss reward list
- **Input**
  - **Normal reward**
    - Select exactly one reward
  - **Boss reward**
    - Select exactly one reward
- **Exit**
  - Advances stage and returns to Main Loop

#### 6.2.4 Dock Scene
**Purpose:** Resolve Dock events
- **Display**
  - Player ship: `hull`, `shield`, `armor`, `ammo`
  - Event options
- **Input**
  - Select an option and continue to Exit
- **Exit**
  - Advances stage and returns to Main Loop

#### 6.2.5 Game End Scene
Game End Scene handles both Game Over and Game Clear outcomes.

## 7. Story
### 7.1 Opening Story
```
Ship ID confirmed: STAR CANINE  
Command authority: CAPTAIN  

Incoming distress signal detected.  
Origin: Planet K9  
Sender ID: LAIKA  

"It's me.  
K9 has fallen.  
Solar Bear battleships took the planet.  
They took me too.  
I know you weren't here.  
I know you'll come back.  
Please… don't die."

Signal lost.

Solar Bear Empire detected in K9 orbit.  
Occupation status: ACTIVE.

Setting course for K9.
```
### 7.2 Game Over  
```
STAR CANINE has been destroyed...
```

### 7.3 Game Clear
```
Planet K9 has been liberated.
LAIKA is safe.

Mission Complete.
```
### 7.4 Others
- Up to the implementer's discretion

1. Myth quotation  
```
“Fight with cudgel.  
No cudgel, use your claw.  
No claw, use your fang.  
No fang, use your soul.   
Fight until nothing left."   
— DEITY OF BLUE WOLF (Canto IV, Line 12)  
```

**END OF SPECIFICATION**
