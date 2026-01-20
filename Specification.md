# STAR CANINE SPECIFICATION v0.7.0

## 1. OVERVIEW
Deterministic, text-only roguelike. No RNG in combat. Designed for LLM playability.
- Scope: 1 vs 1 battles, persistent Hull HP, no ammo costs.
- Strategy: Loadout optimization and initiative-based turn efficiency.

### 1.1 DESIGN GOALS
- **Deterministic:** Same state + same input = same result.
- **Traceable:** Detailed turn-by-turn combat logs.
- **Token Efficient:** Use raw CSV blocks. No leading/trailing spaces or indentation within backticks.

### 1.2 DATA INTEGRITY (CRITICAL)
To prevent parser failure, follow these strict formatting rules:
1. **Zero-Indentation:** Start CSV headers/rows at column 0. Do not indent for Markdown hierarchy.
2. **Clean Edges:** No whitespace between backticks and CSV content.
3. **Strict Casting:** Treat numeric cells as `Number`. Default empty cells (`,,`) to `0` or `""`.

**Correct Format:**
```csv
name,power_stat
🚀 Lance,40
```

### 1.3 IMPLEMENTATION RULES
#### 1.3.1 Robust CSV Parser
Parser must sanitize input to handle LLM artifacts (leading spaces, ghost lines).

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

#### 1.3.2 Scene Mapping & Flow Control
- Centralized Logic: All state/stage transitions occur in a parent Flow component (advanceStage).
- Passive Scenes: Scenes are "dumb" presentation layers for data and input; they do not trigger progression logic.
- Verification: Before combat, verify ENEMY_DATA matches the current stage difficulty and rank.
- Error Handling: If lookup fails, display "Signal Lost (Data Error)" and return to Start.

-----
## 2. DEFINITIONS & DATA
### 2.1 Equipment System
**Fields & Types:**
- `name`: `String` (Display name + Emoji)
- `power_stat`: `Number` (Primary numeric value)
- `eq_type`: `String` (Behavior category)
- `rarity`: `Number` (Tier 0-3)
- `disposable`: `Boolean` (0 = No, 1 = Replaced by Scrap after battle)
- `ability`: `String` (Parsed effect or "0")

**Logic by eq_type:**
- **LONG/MID/CLOSE:** Dealt damage = `power_stat`.
- **SHIELD:** Battle start protection = `power_stat`
- **MODULE_[EQ_TYPE]:** Multiplies `power_stat` or `ability` of matching items. Stacks multiplicatively.
- **UTILITY:** Effect driven by `ability`.

**Ability Timing & Effects:**
- **Pre-Combat:** `+X shield` (Temporary battle bonus).
- **Post-Combat:** - `+X hull repair`: Heals player hull.
    - `+X damage per combat`: Permanent `power_stat` increase for that instance.

**[DATA] Equipment CSV**
```csv
name,power_stat,eq_type,rarity,disposable,ability
🚀 Lance,40,LONG,0,1,0
🚀 Interceptor,40,LONG,1,1,+10 shield
🚀 Meteor,50,LONG,1,1,0
🚀 Nova,65,LONG,1,1,0
🚀🚀 Resurrection,40,LONG,1,0,0
🚀💥 Gambit,80,LONG,1,1,0
🔥 Warhead Optimizer,2,MODULE_LONG,3,0,0
✈️ Drones,15,MID,1,0,0
✈️ Defender,10,MID,1,0,+10 shield
✈️ Wing,20,MID,1,0,0
✈️ Squadron,35,MID,1,0,0
✈️✈️ Rookie fighter,5,MID,1,0,+3 damage per combat
✈️💥 Kamikaze,80,MID,1,1,0
✈️✈️✈️ Blue Wolf,60,MID,2,0,0
⚡ Fang,10,CLOSE,0,0,0
⚡️ Iron Beam,5,CLOSE,1,0,+10 shield
⚡ Claw,15,CLOSE,1,0,0
⚡ Cudgel,20,CLOSE,1,0,0
⚡️⚡️ Laser shield,10,CLOSE,1,0,+15 shield
⚡💥 Burn soul,40,CLOSE,1,1,0
💎 Prismatic Lens,2,MODULE_CLOSE,2,0,0
🟫 Plating,25,SHIELD,0,0,0
🛡️ Veil,20,SHIELD,1,0,0
🛡️🛡️ Aegis,30,SHIELD,2,0,0
🛡️🛡️ Ephemera shield,60,SHIELD,1,1,0
🔧 Repairer,0,UTILITY,1,0,+10 hull repair
🔧🔧 Veteran Repairer,0,UTILITY,2,0,+20 hull repair
🔧🔧🔧 Recreational facility,2,MODULE_UTILITY,2,0,0
```
### 2.2 Enemy Data
**Fields & Types:**
- `difficulty`: `Number` (Tier for stage selection)
- `name`: `String` (Display name)
- `hull`: `Number` (HP)
- `shield`: `Number` (Absorbs damage before hull)
- `rank`: `String` (NORMAL, ELITE, BOSS)
- `attack_LONG`: `Number` (Damage at range)
- `attack_MID`: `Number` (Damage at range)
- `attack_CLOSE`: `Number` (Damage at range)
     
**[DATA]Enemy CSV**
```csv
difficulty,name,hull,shield,rank,attack_LONG,attack_MID,attack_CLOSE
1,Skirmisher,30,0,NORMAL,0,0,10
2,Drifter,35,5,NORMAL,20,0,10
3,Scout,40,0,NORMAL,0,0,15
3,Lancer,45,10,NORMAL,30,0,15
4,Interceptor,55,15,NORMAL,35,0,20
5,Raider,50,10,ELITE,30,0,20
6,Frigate,65,0,NORMAL,20,0,25
7,Enforcer,70,20,ELITE,40,0,25
8,Howler,80,25,ELITE,45,0,30
10,Celestial Reaper,100,60,BOSS,50,0,35
```

### 2.3 2.3 Initial Player State
- `max_hull`: 200 (Number)
- `max_slots`: 6 (Number)
- `inventory`: `🚀 Lance`, `⚡ Fang`, `⚡ Fang`, `🟫 Plating`

### 2.4 Progression & Scaling
- ACT System: ACT I (`stageNum`: 1-10), ACT II (`stageNum`: 11-20), ACT III (`stageNum`: 21-30).
- Scaling Rule: Multiply Enemy `hull`, `shield`, and all attack values by the Act Factor: ACT I: x1.0 | ACT II: x2.0 | ACT III: x3.0

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
### 3.1 Inventory & Slot Rules
- **Definitions:** `Inventory` = all owned items. `Slots` = active items (max = `max_slots`).
- **Initialization:** At Stage 1, player must manually move items from Inventory to Slots before combat.
- **Combat Logic:** ONLY items in **Slots** affect stats, multipliers, and range actions.
- **Persistence:** Slot assignments and item stats (like scaling damage) persist between stages.
- **Management:** Items are swapped between Inventory and Slots during the **Pre-Combat** phase.
- **Uniqueness:** Each item is a unique instance. Duplicate names (e.g., two `🚀 Lance`) must be tracked separately in the state.

-----
## 4. COMBAT SYSTEM
Combat is deterministic, non-interactive, and resolved through a fixed sequence. It ends immediately if any ship's `hull` reaches 0.

### 4.1 Turn Structure
A battle consists of exactly 6 turns following this fixed range order:  
**LONG → MID → CLOSE → CLOSE → MID → LONG**

### 4.2 Combat Initialization (Setup Phase)
Before the first turn, calculate the ship's temporary battle stats:
1.  **Defense Summation:** - `Battle_Shield` = Sum of all equipped `SHIELD` items + any `+X shield` abilities. 
2.  **Module Multipliers:** - Identify items with `eq_type` starting with `MODULE_` (e.g., `MODULE_LONG`).
    - Multipliers stack multiplicatively (e.g., two `x2` modules = `x4` total).
    - These values remain static for the duration of the combat.

### 4.3 Turn Resolution (Execution Phase)
Every turn follows this strict order of operations:

#### 4.3.1 Player Action
1.  **Selection:** Identify equipped items where `eq_type` matches the current range.
2.  **Application:**
    - Calculated Damage = `power_stat` × matching module multiplier.
4.  **Enemy Damage:** Apply total damage to the Enemy. (Reduces `shield`, then `hull`)
5.  **Status Check:** If Enemy `hull` <= 0, player wins immediately.

#### 4.3.2 Enemy Action (If Alive)
1.  **Attack:** Enemy deals damage based on their stat for the current range (e.g., `attack_MID`).
2.  **Player Damage:** Apply damage to the Player. (Reduces `shield`, then `hull`)
3.  **Status Check:** If Player `hull` <= 0, game ends in defeat.

### 4.5 Post-Combat Processing
#### 4.5.1 Cleanup & Scaling
1.  **Disposables:** Items with `disposable: 1` are removed from `inventory`.
2.  **Permanent Scaling:** Items with `+X damage per combat` have their `power_stat` permanently increased in the inventory.
3.  **Repairs:** Sum all `+X hull repair` Utility abilities, apply `MODULE_UTILITY` multipliers, and heal player `hull` (clamped to `max_hull`).

#### 4.5.2 Outcomes
- **Game Clear:** Defeated Boss of Stage 30.
- **Victory:** Enemy `hull` <= 0. Proceed to Rewards.
- **Defeat:** Player `hull` <= 0 OR Boss is alive after Turn 6.
- **Draw:** Both ships alive after Turn 6 (Non-Boss enemies only). Advance stage, no rewards.

### 4.6 Rewards
**Victory Reward (Pick ONE):**
1.  **Salvage:** Choose 1 of 3 items matching the Enemy's `rank` and`rarity` (Normal:1, Elite:2, Boss:3).

**Boss Bonus (ACT I & II only):**
- **Automatic:** Full Hull Repair
- **Bonus (Pick ONE):**
    - `max_slots +2`
    - `max_slots +1` AND `max_hull +80` (includes immediate heal)

-----
## 5. Event
### 5.1 Dock
Dock is a repair station. Chose one:
- **Repair:** Heal Hull by 30% of Max Hull
(in the future update, it will have multiple option)

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
    - `hull`, `shield`
  - **Enemy status**
    - `hull`, `shield`
    - Attack values: `attack_LONG`, `attack_MID`, `attack_CLOSE`
  - **Inventory display order**
    1. Equipped items (checkmarked)
    2. Unequipped items
  - **Equipment display**
    - `name`, `eq_type`, `power_stat`, `disposable `, `ability`
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
  - Each reward shows: `name`, `eq_type`, `power_stat`, `disposable `, `ability`
  - Boss reward list
- **Input**
  - **Normal reward**
    - Select exactly one reward
  - **Boss reward**
    - Select exactly one reward

#### 6.2.4 Dock Scene
- Resolve Dock events (See `5.1 Dock` section)
- Display **Player status**
  - `hull`

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
