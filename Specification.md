# STAR CANINE SPECIFICATION v0.6.11

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
1. DATA INTEGRITY & RAW FORMATTING (CRITICAL)
To prevent the Sanitizing Parser from failing due to LLM-generated formatting artifacts, the following rules are absolute:

- **Zero-Indentation Rule:** CSV blocks must be written starting at the very first column of the text buffer. Do NOT indent CSV rows to match the Markdown hierarchy.
- **No Leading/Trailing Whitespace:** The first character after the opening backticks (```csv) must be the first header letter. The last character before the closing backticks must be the last value of the last row.
- **Strict Type Casting:** The logic must interpret any cell that is purely numeric as a `Number` type. 
- **Empty Cell Handling:** If a value is missing between commas (e.g., `,,`), the parser must default the value to `0` for numeric fields or an empty string `""` for text fields.

**Correct "Flat" Format Example:**
```csv
name,power_stat,ammo_cost
🚀 Lance,40,3
🚀 Meteor,50,4
```
(Note: No spaces or tabs precede the text above)

2. **Robust CSV Parsing** 
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

3. Scene Mapping & Flow Control
- Separation of Concerns: Scenes must be "dumb" (Presentation only).
- Centralized Logic: All state transitions (scene and `stageNum`) must happen in the parent Flow component via an advanceStage function.
- Component References: Use the mapping pattern below to avoid deeply nested conditional trees.

4. Data Verification Constraint
- Combat Init: Before entering combat, the controller must verify that ENEMY_DATA contains a matching entry for the current stage's difficulty and rank.
- Fallback: If a lookup fails, the game must not hang; it must return to the start scene or display a "Signal Lost (Data Error)" message.

-----
## 2. DEFINITIONS & DATA
### 2.1 Equipment System
**Fields & Types:**
- `name`: `String` (Display name + Emoji)
- `power_stat`: `Number` (Primary numeric value)
- `ammo_cost`: `Number` (Ammo consumed per activation)
- `eq_type`: `String` (Behavior category)
- `rarity`: `Number` (Tier 0-3)
- `disposable`: `Boolean` (0 = No, 1 = Replaced by Scrap after battle)
- `ability`: `String` (Parsed effect or "0")

**Logic by eq_type:**
- **LONG/MID/CLOSE:** Dealt damage = `power_stat`.
- **SHIELD/ARMOR:** Absorbs damage = `power_stat`. (SHIELD: LONG, ARMOR: CLOSE).
- **MODULE_[TYPE]:** Multiplies `power_stat` or `ability` of matching items. Stacks multiplicatively.
- **UTILITY:** Effect driven by `ability`.
- **JUNK:** No combat effect.

**Ability Timing & Effects:**
- **Pre-Combat:** `+X shield` or `+X armor` (Temporary battle bonus).
- **Post-Combat:** - `+X hull repair`: Heals player hull.
    - `+X damage per combat`: Permanent `power_stat` increase for that instance.

**[DATA] Equipment CSV**
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
**Fields & Types:**
- `difficulty`: `Number` (Tier for stage selection)
- `name`: `String` (Display name)
- `hull`: `Number` (HP)
- `shield`: `Number` (Absorbs LONG)
- `armor`: `Number` (Absorbs CLOSE)
- `rank`: `String` (NORMAL, ELITE, BOSS)
- `attack_LONG`: `Number` (Damage at range)
- `attack_MID`: `Number` (Damage at range)
- `attack_CLOSE`: `Number` (Damage at range)
     
**[DATA]Enemy CSV**
```csv
difficulty,name,hull,shield,armor,rank,attack_LONG,attack_MID,attack_CLOSE
1,Skirmisher,30,0,0,NORMAL,0,0,10
2,Drifter,35,5,0,NORMAL,20,0,10
3,Scout,40,0,10,NORMAL,0,0,15
3,Lancer,45,10,0,NORMAL,30,0,15
4,Interceptor,55,15,10,NORMAL,35,0,20
5,Raider,50,10,10,ELITE,30,0,20
6,Frigate,65,0,20,NORMAL,20,0,25
7,Enforcer,70,20,15,ELITE,40,0,25
8,Howler,80,25,20,ELITE,45,0,30
10,Celestial Reaper,100,30,40,BOSS,50,0,35
```

### 2.3 2.3 Initial Player State
• `max_hull`: 200 (Number)
• `ammo`: 12 (Number)
• `max_slots`: 6 (Number)
• `inventory`: `🚀 Lance`, `⚡ Fang`, `⚡ Fang`, `🟫 Plating`

### 2.4 Progression & Scaling
- ACT System: ACT I (`stageNum`: 1-10), ACT II (`stageNum`: 11-20), ACT III (`stageNum`: 21-30).
- Scaling Rule: Multiply Enemy `hull`, `shield`, `armor`, and all attack values by the Act Factor:
- ACT I: x1.0 | ACT II: x2.0 | ACT III: x3.0

**[DATA] Stage Layout CSV:**
```csv
stage,type,difficulty,rank
1,combat,1,NORMAL
2,combat,2,NORMAL
3,combat,5,ELITE
4,dock,,
5,combat,3,NORMAL
6,combat,4,NORMAL
7,combat,7,ELITE
8,combat,6,NORMAL
9,dock,,
10,combat,10,BOSS
```

-----
## 3. EQUIPMENT SYSTEM
### 3.1 Inventory vs. Slots
- **Inventory:** The master list of all equipment objects owned by the player.
- **Slots (Equipped):** A subset of the inventory, up to `max_slots`, that is currently active.
- **Persistence:** Equipment selections and slot assignments persist between stages unless manually changed by the player.
- **Combat Impact:** ONLY items currently assigned to **Slots** affect combat stats, multipliers, and range actions.
- **Uniqueness:** Players may own multiple items with the same name. Each must be treated as a unique instance (especially for scaling items like `Rookie fighter`).

### 3.2 Management Rules
- **Initial State:** At Stage 1, all items start in the Inventory. The player must manually equip items into Slots before the first engagement.
- **Swapping:** Equipment can be freely swapped between Inventory and Slots during the **Pre-Combat** phase of any Combat Scene.
- **Capacity:** Players cannot equip more items than the current `max_slots` value allows.

### 3.3 Item Lifecycle
1. **Acquisition:** New items from Reward Scenes are added directly to the Inventory.
2. **Usage:** Items in Slots activate automatically during combat if conditions (Range/Ammo) are met.
3. **Depletion:** Items marked as `disposable: 1` are removed from the Slot/Inventory after combat and replaced with `⚠️ Broken Scrap`.
4. **Evolution:** Items with scaling abilities (e.g., `+X damage per combat`) update their `power_stat` permanently within the inventory instance.

-----
## 4. COMBAT SYSTEM
Combat is deterministic, non-interactive, and resolved through a fixed sequence. It ends immediately if any ship's `hull` reaches 0.

### 4.1 Turn Structure
A battle consists of exactly 6 turns following this fixed range order:
**LONG → MID → CLOSE → CLOSE → MID → LONG**

### 4.2 Combat Initialization (Setup Phase)
Before the first turn, calculate the ship's temporary battle stats:
1.  **Defense Summation:** - `Battle_Shield` = Sum of all equipped `SHIELD` items + any `+X shield` abilities.
    - `Battle_Armor` = Sum of all equipped `ARMOR` items + any `+X armor` abilities.
2.  **Module Multipliers:** - Identify items with `eq_type` starting with `MODULE_` (e.g., `MODULE_LONG`).
    - Multipliers stack multiplicatively (e.g., two `x2` modules = `x4` total).
    - These values remain static for the duration of the combat.

### 4.3 Turn Resolution (Execution Phase)
Every turn follows this strict order of operations:

#### 4.3.1 Player Action
1.  **Selection:** Identify equipped items where `eq_type` matches the current range.
2.  **Ammo Check:** An item activates only if current `ammo` >= `ammo_cost`.
3.  **Application:**
    - Subtract `ammo_cost` from player's `ammo` pool.
    - Calculated Damage = `power_stat` × matching module multiplier.
4.  **Enemy Damage:** Apply total damage to the Enemy using **Damage Resolution Rules (4.4)**.
5.  **Status Check:** If Enemy `hull` <= 0, player wins immediately.

#### 4.3.2 Enemy Action (If Alive)
1.  **Attack:** Enemy deals damage based on their stat for the current range (e.g., `attack_MID`).
2.  **Player Damage:** Apply damage to the Player using **Damage Resolution Rules (4.4)**.
3.  **Status Check:** If Player `hull` <= 0, game ends in defeat.

### 4.4 Damage Resolution Rules
Damage applies to targets based on the current range:

| Current Range | Primary Target | Overflow Target |
| :--- | :--- | :--- |
| **LONG** | Shield | Hull |
| **MID** | Hull | None |
| **CLOSE** | Armor | Hull |

- **Non-Regenerative:** Shield and Armor do not replenish during the 6 turns.
- **Overflow:** Damage exceeding the Primary Target's current value is applied to the Overflow Target.

### 4.5 Post-Combat Processing
#### 4.5.1 Cleanup & Scaling
1.  **Disposables:** Items with `disposable: 1` are replaced with `⚠️ Broken Scrap`.
2.  **Permanent Scaling:** Items with `+X damage per combat` have their `power_stat` permanently increased in the inventory.
3.  **Repairs:** Sum all `+X hull repair` Utility abilities, apply `MODULE_UTILITY` multipliers, and heal player `hull` (clamped to `max_hull`).

#### 4.5.2 Outcomes
- **Game Clear:** Defeated Boss of Stage 30.
- **Victory:** Enemy `hull` <= 0. Proceed to Rewards.
- **Defeat:** Player `hull` <= 0 OR Boss is alive after Turn 6.
- **Draw:** Both ships alive after Turn 6 (Non-Boss enemies only). Advance stage, no rewards.

### 4.6 Rewards
**Victory Reward (Pick ONE):**
1.  **Resupply:** +5 Ammo.
2.  **Salvage:** Choose 1 of 3 items matching the Enemy's `rank` (Rarity 1, 2, or 3).

**Boss Bonus (ACT I & II only):**
- **Automatic:** Full Hull Repair and +12 Ammo.
- **Bonus (Pick ONE):**
    - `max_slots +2`
    - `max_slots +1` AND `max_hull +80` (includes immediate heal)
    - `max_slots +1` AND `ammo +12`

-----
## 5. Event
### 5.1 Dock
Dock is a repair station. Chose one:
- **Repair:** Heal Hull by 30% of Max Hull
  OR
- **Resupply:** Gain +7 Ammo

-----
## 6. Flow and Scene
This section defines the authoritative game progression flow and the scenes used to present game state.
**Progression is controlled exclusively by the Flow; scenes do not alter progression logic.**

### 6.1 Flow
- The system follows a deterministic loop based on the Stage Layout CSV:
1. Stage Check: Flow Controller identifies the current stage type and parameters (difficulty/rank).
2. Scene Initialization:
- If Combat: Launch Combat Scene. (Detailed conditions described in 4.5.2 Combat Outcomes)
  - On **Game Clear:** break loop and launch Game End Scene.
  - On **Victory:** Proceed to Reward Scene.
  - On **Draw** Increment Stage and return to Loop.
  - On **Defeat:** Proceed to Game End Scene.
- If Dock: Launch Dock Scene.
  - On Completion: Increment Stage and return to Loop.

### 6.2 Scene Definitions
- Each scene is a presentation and input layer only.  
- Scenes do not control progression; all transitions are dictated by the Flow system.

#### 6.2.1 Start Scene

#### 6.2.2 Combat Scene
**Purpose:** Equipment preparation and deterministic combat resolution
- **Display**
  - **Player status**
    - `hull`, `shield`, `armor`, `ammo`
  - **Enemy status**
    - `hull`, `shield`, `armor`
    - Attack values: `attack_LONG`, `attack_MID`, `attack_CLOSE`
  - **Inventory display order**
    1. Equipped items (checkmarked)
    2. Unequipped items
  - **Equipment display**
    - `name`, `eq_type`, `power_stat`, `ammo_cost`, `disposable `, `ability`
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
 
#### 6.2.3 Reward Scene
**Purpose:** Resolve post-combat equipment acquisition
- **Display**
  - Available normal reward items
  - Each reward shows: `name`, `eq_type`, `power_stat`, `ammo_cost`, `disposable `, `ability`
  - Boss reward list
- **Input**
  - **Normal reward**
    - Select exactly one reward
  - **Boss reward**
    - Select exactly one reward

#### 6.2.4 Dock Scene
- Resolve Dock events (See `5.1 Dock` section)
- Display **Player status**
  - `hull`, `ammo`

#### 6.2.5 Game End Scene
- Game End Scene handles both Game Over and Game Clear outcomes.

## 7. Story

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

**END OF SPECIFICATION**
