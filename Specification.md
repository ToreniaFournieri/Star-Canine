# STAR CANINE SPECIFICATION v0.7.6

## 1. OVERVIEW
Deterministic, text-only roguelike. Designed for LLM playability.
- Scope: 1 vs 1 battles, persistent Hull HP, no randomness in combat. 
- Strategy: Loadout optimization and initiative-based turn efficiency.

### 1.1 DATA INTEGRITY (CRITICAL)
1. **Zero-Indentation:** Start CSV headers/rows at column 0. Do not indent for Markdown hierarchy.
2. **Clean Edges:** No whitespace between backticks and CSV content.
3. **Strict Casting:** Treat numeric cells as `Number`. Default empty cells (`,,`) to `0` or `""`.

**Correct Format:**
```csv
name,power_stat
🚀 Lance,40
```

### 1.2 ROBUST PARSER (REQUIRED)

```javascript
const parseCSV = (csv) => {
  const lines = csv.trim().split('\n').map(line => line.trim()).filter(line => line);  
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      let val = values[i] ? values[i].trim() : "";
      if (val.toLowerCase() === 'true') {
        obj[header] = true;
      } 
      else if (val.toLowerCase() === 'false') {
        obj[header] = false;
      } 
      else if (val === '0' || val === '') {
        obj[header] = (header === 'name' || header === 'eq_type' || header === 'ability' || header === 'multiplier') ? val : 0;
      } 
      else if (!isNaN(val)) {
        obj[header] = Number(val);
      } 
      else {
        // Keep as String
        obj[header] = val;
      }
    });
    return obj;
  });
};
```

#### 1.3 Scene Mapping & Flow Control
- Centralized Logic: All state/stage transitions occur in a parent Flow component (advanceStage).
- Passive Scenes: Scenes are "dumb" presentation layers for data and input; they do not trigger progression logic.
- Verification: Before combat, verify ENEMY_DATA matches the current stage difficulty and rank.
- Error Handling: If lookup fails, display "Signal Lost (Data Error)" and return to Start.

-----
## 2. DEFINITIONS & DATA
### 2.1 Equipment System
**Fields & Types:**
- `slots`: `Number`
- `name`: `String` (Display name + Emoji)
- `power_stat`: `Number` (Primary numeric value)
- `eq_type`: `String` (Behavior category)
- `rarity`: `Number` (Tier 0-3)
- `disposable`: `Boolean` (true/false)
- `mult_target`: `String` Which stat to multiply (LONG, MID, CLOSE, SHIELD, HULL, or none)
- `mult_power`: `Number` (Float) The multiplier value (2, 0.9, 1.2, etc.)
- `ability`: `String` (Parsed effect or none)

**Logic by eq_type:**
- **LONG/MID/CLOSE:** Dealt damage = `power_stat`.
- **SHIELD:** Battle start protection = `power_stat`
- **HULL:** Battle end repair = `power_stat`

**[DATA] Equipment CSV**
```csv
slots,name,power_stat,eq_type,rarity,disposable,mult_target,mult_power,ability
1,🚀 Lance,40,LONG,0,true,none,0,none
1,🚀🛡️ Interceptor,35,LONG,1,true,none,0,+10 SHIELD
1,🚀 Meteor,45,LONG,1,true,none,0,none
2,🚀 Harpoon,66,LONG,1,true,none,0,none
1,🚀⚠️ Isolation,55,LONG,1,true,LONG,0.9,none
1,🚀🔺 Javelin,23,LONG,1,true,LONG,1.2,none
1,🚀🔺 Gambit,45,LONG,2,true,LONG,1.3,none
1,🔫 Quantum Displacer,40,LONG,3,false,CLOSE,0.5,none
2,🔥🔺 Warhead Optimizer,0,MODULE,3,false,LONG,2,none
1,✈️ Drones,12,MID,1,false,none,0,none
1,✈️⚠️ Scavenger,20,MID,1,false,MID,0.9,none
1,✈️🔺 Squadron,8,MID,1,false,MID,1.2,none
1,✈️⤴️ Rookie fighter,5,MID,1,false,none,0,+2 damage per combat
1,✈️✈️ Blue Wolf,20,MID,2,false,none,0,none
1,🛫🔺 Swarm Core,0,MODULE,3,false,LONG,0.5,+10 ALL MID
1,🏗️🔺 Swarm Hanger,0,MODULE,3,false,MID,2,DISABLE_HULL_REPAIR
1,⚡ Fang,10,CLOSE,0,false,none,0,none
1,⚡ Claw,15,CLOSE,1,false,none,0,none
1,⚡⚠️ Static Blade,22,CLOSE,1,false,CLOSE,0.9,none
1,⚡️🛡️ Iron Beam,5,CLOSE,2,false,none,0,+10 SHIELD
1,⚡ Cudgel,25,CLOSE,2,false,none,0,none
1,⚡️🔺 Boost laser,10,CLOSE,2,false,CLOSE,1.2,none
1,⚡💥 Burn soul,40,CLOSE,1,true,none,0,none
1,💎🔺 Prismatic Focus,0,MODULE,3,false,CLOSE,2,Simultaneous
1,🛡️ Plating,14,SHIELD,0,false,none,0,none
1,🛡️ Veil,17,SHIELD,1,false,none,0,none
1,🛡️⚠️ Bulkhead,25,SHIELD,1,false,SHIELD,0.9,none
1,🛡️💥 Ephemera shield,33,SHIELD,1,true,none,0,none
1,🛡️🛡️ Aegis,30,SHIELD,2,false,none,0,none
1,🛡️🔺 Barrier,13,SHIELD,2,false,SHIELD,1.2,none
1,🟫🔺 Double Shield,0,MODULE,3,false,SHIELD,2,none
1,🔧 Repairer,10,HULL,1,false,none,0,none
1,🔧🔧 Veteran Repairer,15,HULL,2,false,none,0,none
1,♨️🔺 Recreational facility,2,MODULE,2,false,HULL,2,none
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
- **Slot Validation**: Ensure Sum(`slots`) of all equipped items ≤ max_slots.

- **Uniqueness:** Each item is a unique instance. Duplicate names (e.g., two `🚀 Lance`) must be tracked separately in the state.

-----
## 4. COMBAT SYSTEM
Combat is deterministic, non-interactive, and resolved through a fixed sequence. It ends immediately if any ship's `hull` reaches 0.

### 4.1 Turn Structure
A battle consists of exactly 6 turns following this fixed range order:  
**LONG → MID → CLOSE → CLOSE → MID → LONG**

### 4.2 Combat Initialization (Setup Phase)
Before the first turn, calculate the ship's temporary battle stats:
1.  **Stat Summation (Base):** Sum `power_stat` for each category (`LONG`, `MID`, `CLOSE`, `SHIELD`).
3.  **Module Multipliers:** 
    - Collect all equipped items where `mult_target` is not `none`.
    - Group by `mult_target` category (LONG, MID, CLOSE, SHIELD, HULL).
    - Multiply the **Base Sum** of each category by all applicable `mult_power` values.
    - Multipliers stack multiplicatively (e.g., LONG_base × 1.2 × 1.3 × 2 = LONG_base × 3.12).
4.  **Ability Application:** Add flat bonuses from `ability` strings (e.g., `+10 SHIELD`, `+10 ALL MID`) to the multiplied totals.
    - *Note: Multipliers do NOT scale flat ability bonuses.*
5.  **Battle Pools:**
    - `Battle_Shield` = Final calculated Shield total.
    - `Battle_Hull` = Current Player `hull`.

### 4.3 Turn Resolution (Execution Phase)
Every turn follows this strict order of operations:

#### 4.3.1 Player Action
1.  **Selection:** Identify equipped items where `eq_type` matches the current range.
2.  **Application:** Total Damage = Sum of (Item `power_stat` × applicable multipliers) + flat ability bonuses.
3.  **Enemy Damage:** Apply total damage to the Enemy. (Reduces `shield` first, then `hull`).
4.  **Simultaneous Check:** If `Simultaneous` ability is active, skip the immediate `Enemy Status Check` and proceed to Enemy Action.
5.  **Enemy Status Check:** If Enemy `hull` <= 0, player wins immediately.

#### 4.3.2 Enemy Action (If Alive or Simultaneous condition)
1.  **Attack:** Enemy deals damage based on their stat for the current range (e.g., `attack_MID`).
2.  **Player Damage:** Apply damage to the Player. (Reduces `Battle_Shield` first, then `hull`).
3.  **Status Check:** If Player `hull` <= 0, game ends in defeat.

### 4.4 Post-Combat Processing
#### 4.4.1 Cleanup & Scaling
1.  **Disposables:** Items with `disposable: true` are removed from `inventory`.
2.  **Permanent Scaling:** Items with `+X damage per combat` have their `power_stat` permanently increased in the inventory instance.
3.  **Repairs:** - Identify items with `eq_type: HULL`.
    - Base Repair = Sum of `HULL` `power_stat`.
    - Final Repair = (Base Repair × `HULL` multipliers).
    - If `DISABLE_HULL_REPAIR` ability is active (e.g., Swarm Hanger), Final Repair = 0.
    - Apply Final Repair to player `hull` (clamped to `max_hull`).

#### 4.4.2 Outcomes
- **Game Clear:** Defeated Boss of Stage 30.
- **Victory:** Enemy `hull` <= 0. Proceed to Rewards.
- **Defeat:** Player `hull` <= 0 OR Boss is alive after Turn 6.
- **Draw:** Both ships alive after Turn 6 (Non-Boss only). Advance stage, no rewards.

### 4.5 Rewards
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
    - `name`, `eq_type`, `power_stat`, `disposable`, `ability`
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
