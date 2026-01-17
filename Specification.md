# STAR CANINE SPECIFICATION v0.4.4

## 1. OVERVIEW
- This is a terminal-based (or simple UI), deterministic, text-only roguelike spaceship game.
  - No randomness in combat
  - No graphics
  - No real-time input during battle
  - Designed to be playable and solvable by LLMs
- Player progresses through fixed stages, fighting enemies, managing hull HP and ammo, and upgrading ship equipment.

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

-----
## 2. DEFINITIONS
### 2.1 Equipment Data
#### 2.1.1 Equipment Fields
Equipment entries define the following fields:

##### Core Fields (all equipment):
- `id`: Unique numeric identifier
- `name`: Display name with emoji identifier
- `type`: Equipment category. Valid types: MISSILE, LASER, FIGHTER, SHIELD, ARMOR, MODULE, JUNK
- `reward`: Boolean. Whether this item can appear as a post-battle reward
- `disposable`: Boolean. Whether this item is destroyed after combat (replaced with Broken Scrap)

##### Weapon Fields (MISSILE, LASER, FIGHTER):
- `damage_LONG`: Integer or null. Damage dealt at LONG range. null = cannot fire at this range
- `damage_MID`: Integer or null. Damage dealt at MID range. null = cannot fire at this range
- `damage_CLOSE`: Integer or null. Damage dealt at CLOSE range. null = cannot fire at this range
- `ammo_cost`: Integer. Ammo consumed per activation (regardless of range)

##### Defensive Fields:
- `shield`: Integer (SHIELD type only). Damage absorbed at LONG range only
- `armor`: Integer (ARMOR type only). Damage absorbed at CLOSE range only

##### Module Fields (MODULE type only):
- `target_type`: String. Weapon type to boost (MISSILE, LASER, FIGHTER)
- `multiplier`: Integer. Damage multiplier for matching weapons. Multiple modules stack multiplicatively (two x2 modules = x4 total)

#### 2.1.2 Equipment JSON file
**Data source precedence:**  
https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Equipment_data.json

### 2.2 Enemy Data
Enemy data is defined in JSON. Each enemy entry represents a single hostile unit encountered in combat.

#### 2.2.1 Enemy Fields

##### Core Fields:
- `enemy_id`: String. Unique identifier for the enemy.
- `hull`: Integer. Enemy hit points.

##### Defensive Fields (Optional):
- `shield`: Integer (optional). Shield value. If omitted, treated as 0.
- `armor`: Integer (optional). Armor value. If omitted, treated as 0.

##### Attack Fields:
- `damage_LONG`: Integer or null. Damage dealt at LONG range. null = cannot attack at this range
- `damage_MID`: Integer or null. Damage dealt at MID range. null = cannot attack at this range
- `damage_CLOSE`: Integer or null. Damage dealt at CLOSE range. null = cannot attack at this range

##### Spawn Fields:
- `difficulty`: Integer. Threat rating.
- `type`: String. Encounter category. One of: Normal, Elite, Boss
     
#### 2.2.2 Enemy JSON file
**Data source precedence:**  
https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Enemy_data.json

### 2.3 Player ship initial state
- Player ship state
  - `max_hull`: 200,
  - `hull`: 200,
  - `shield`: 0,
  - `armor`: 0,
  - `ammo`: 12,
  - `max_slots`: 6,
  - `inventory`: [1, 2, 2, 3]
    - These number aee "Equipment_data.json"'s id. 

### 2.4 Stage layout 
- There are two type of stages
  - combat: Combat stage. Enemy is chosen from Enemy_data.json. If it hits mutiple enemies by the provided condition, pick one randomly.
    - ACT II, all enemy status x1.5 round down.
    - ACT III, all enemy status x3.0 round down.
  - dock: heal and resupply
 
### 2.4.1 ACT structure
1. combat: a random enemy (difficulty:1, type:normal)
1. combat: a random enemy (difficulty:2, type:normal) 
1. combat: a random enemy (where difficulty:3, type:normal) 
1. dock 
1. combat: an elite (difficulty:5, type:elite)
1. combat: a random enemy (difficulty:4, type:normal)
1. combat: a random enemy (difficulty:4, type:normal) 
1. dock
1. combat: boss (difficulty:10, type:boss)

-----
## 3. EQUIPMENT SYSTEM

### 3.1 Inventory vs Slots
- **Inventory:** all equipment the player owns
- **Slots:** up to `max_slots` equipped items
- You may have multiple same id equipments. Need to distinguish them
- ONLY equipped items affect combat
- Equipment can be swapped Pre-combat scene 

-----

## 4. COMBAT SYSTEM

### 4.1 Turn Order
- Each combat follows this fixed range sequence:
  - LONG -> MID -> CLOSE -> CLOSE -> MID -> LONG
- 6 turns total per combat, unless someone is destroyed earlier

### 4.2 Start of combat
- Shield and Armor values are recalculated based on equipped items `sheild` and `armor` value
- Shield and Armor do NOT persist between battles
- `hull` damage persists between battles

- Multiplier calculation:
  - For each equipped MODULE with a `multiplier` and `target_type`:
    - All weapons with matching `type` have their damage multiplied
    - Multiple multipliers stack multiplicatively (two x2 modules = x4 total, two x3 modules = x9 total)
    - Example: If you equip "Prismatic Lens" (`multiplier: 2`, `target_type: LASER`), all LASER weapons deal double damage

### 4.3 Attack Resolution Rule

On EACH turn:
1. **Player attacks first**
   - For each equipment:
     - Check if equipment has non-null damage value for current range:
       - LONG turn: check `damage_LONG`
       - MID turn: check `damage_MID`
       - CLOSE turn: check `damage_CLOSE`
     - Check if player has sufficient `ammo` for `ammo_cost`
     - If all checks pass, equipment activates automatically
   - All valid equipments fire simultaneously in the same turn
   - Apply `multiplier` bonuses from equipped MODULEs to matching equipment's `type`
   - Total damage = sum of all activated equipments (after multipliers)
   - Total ammo consumed = sum of `ammo_cost` from all activated equipments
   - Equipments fire even if damage is overkill

2. **Enemy takes damage**
   - Apply damage following damage resolution rules (section 4.4)

3. **Check enemy status**
   - If enemy `hull` ≤ 0:
     - Enemy is destroyed
     - Enemy does NOT attack this turn
     - Combat ends (victory)
   
4. **Enemy attacks** (only if still alive)
   - Check if enemy has non-null damage value for current range:
     - LONG turn: check `damage_LONG`
     - MID turn: check `damage_MID`
     - CLOSE turn: check `damage_CLOSE`
   - Enemy attacks automatically
   - Player takes damage following damage resolution rules (section 4.4)

5. **Check player status**
   - If player `hull` ≤ 0:
     - Player is destroyed
     - Combat ends (defeat)

### 4.4 Damage Resolution rule
Damage resolution depends entirely on the current combat range. There are three independent damage models:

#### LONG Range Damage Resolution:
1. Damage is applied to `shield` first
2. Remaining damage (if any) is applied to `hull`

#### MID Range Damage Resolution:
1. Damage is applied directly to `hull`
2. `shield` and `armor` are ignored

#### CLOSE Range Damage Resolution:
1. Damage is applied to `armor` first
2. Remaining damage (if any) is applied to `hull`

### 4.5 End of Combat
#### 4.5.1 Disposable Item Cleanup
- All equipped disposable items (`"disposable": true`) are removed from equipped slots
- Each disposable item is replaced in inventory with one Broken Scrap (ID: 999)
- This happens regardless of whether the item was activated during combat
- Combat log displays: "[Item Name] has burned out. Replaced with Broken Scrap."

#### 4.5.2 Draw Condition
A combat is considered a draw if:
- Both player and enemy are still alive after Turn 6.

In a draw:
- Combat ends immediately
- No rewards are granted
- If the enemy `type` is "Boss": Game Over
- If the enemy `type` is not "Boss": Proceed to next stage

#### 4.5.3 Victory Condition
Player wins when:
- Enemy `hull` ≤ 0 before Turn 6 ends

#### 4.5.4 Defeat Condition
Player loses when:
- Player `hull` ≤ 0 at any point
- Draw occurs against a Boss enemy

### 4.6 Reward

#### 4.6.1 Normal reward
- After winning a battle, the player chooses ONE:
    - Gain +5 Ammo
    - Choose 1 equipment

- Equipment is selected from equipment_data.json where `"reward": true`.  

#### 4.6.2 Boss reward 
- Boss rewards are granted after defeating the **ACT I boss** and **ACT II boss**.
- No boss reward is granted after the **ACT III boss**, which ends the game.

1. **Automatic Restoration:**
   - Hull is fully restored
   - Gain +12 Ammo

2. **Boss Bonus (Choose ONE):**
   Player chooses exactly ONE of the following:
   - **Option A:** +2 Equipment Slots (`max_slots` increases by 2)
   - **Option B:** +1 Equipment Slot AND +80 Max Hull (`max_slots` +1, `max_hull` +80, `hull` +80)
   - **Option C:** +1 Equipment Slot AND +12 Ammo (`max_slots` +1, `ammo` +12)


-----

## 5. Event

### 5.1 Dock
Dock is a repair station.
- **Repair:** Heal Hull by 30% of Max Hull
- **Resupply:** Gain +7 Ammo

-----

## 6. Scene and Flow
This section defines the authoritative game progression flow and the scenes used to present game state.
**Progression is controlled exclusively by the Flow; scenes do not alter progression logic.**

### 6.1 Flow
```
START
↓
Opening Scene
↓
Main Loop:
┌────────────────────────┐
│ Check Next Stage       │
└────────────────────────┘
│ 
├─ If stage type is Combat
│   ↓
│   Combat Scene
│   ↓
│   Reward Scene
│   ↓
│   continue Main Loop / Game Over Scene / Game Clear Scene
│
└─ If stage type is Dock
    ↓
    Dock Scene

```

### 6.2 Scene Definitions
Each scene is a presentation and input layer.
Scenes do not determine progression; all transitions are dictated by the Flow.

#### 6.2.1 Opening Scene
**Purpose:** Game entry point
- **Display**
  - Game title
  - Opening Story
  - Start prompt
- **Input**
  - Start button / Enter to Exit
- **Exit**
  - Proceeds to Main Loop

#### 6.2.2 Combat Scene
**Purpose:** Display preparation and combat resolution
- **Display**
  - Player ship: `hull`, `shield`, `armor`, `ammo`
  - Enemy ship: `hull`, `shield`, `armor`, `damage_LONG`, `damage_MID`, `damage_CLOSE`
  - Inventory display order:  
    1. Equipped items (checkmarked)  
    2. Unequipped items  
  - Each equipment item displays its stats (`shield`, `armor`, `damage_LONG`, `damage_MID`, `damage_CLOSE`, `target_type`, `multiplier`)
  - After engaging combat: Combat log appears and updates turn-by-turn

- **Input**
  - **Pre-combat:** Equip/unequip inventory items, then "Engage Combat" button
  - **During combat:** Combat log updates automatically (no input needed)
  - **Post-combat:** "Continue" button to proceed

- **Notes**
  - At the first stage, no equipment is selected
  - Up to `max_slots` items may be equipped
  - Previous equipment selections persist between battles

- **Exit**
  - If player wins and it is the last stage → Game Clear Scene
  - Else if player wins → Reward Scene
  - Else if draw AND enemy `type` is Boss → Game Over Scene
  - Else if draw AND enemy `type` is not Boss → Advance stage, return to Main Loop
  - Else if player loses → Game Over Scene

#### 6.2.3 Reward Scene
**Purpose:** Resolve post-combat rewards
- **Display**
  - Available rewards and their status (`shield`, `armor`, `dagame_LONG`, `damage_MID`, `damage_CLOSE`, `target_type`, `multiplier`)
- **Input**
  - Select one reward
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

#### 6.2.5 Game Over Scene
- Display this:
```
STAR CANINE has been destroyed...
```
#### Game Clear Scene
- Display this:
```
Planet K9 has been liberated.
LAIKA is safe.

Mission Complete.
```

-----

## 7. Opening Story
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
