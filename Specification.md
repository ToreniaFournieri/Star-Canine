# STAR CANINE SPECIFICATION v0.5.2

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
## 2.1 Equipment Data
Equipment data is defined as a compact, behavior-driven table.  
Each equipment entry contains exactly one primary numeric value (`val`), whose meaning is determined solely by `eq_type`.

All equipment data is embedded directly in this specification as a CSV block.

### 2.1.1 Equipment Fields
Each equipment entry defines the following fields:

- `name`: Display name of the equipment. May include emoji identifiers.
- `val`: Primary numeric value. Its meaning depends entirely on `eq_type`.
- `ammo`: Ammo consumed per activation. Ignored for equipment types that do not consume ammo (set to `0`).
- `eq_type`: Equipment behavior category. Defines combat range or special behavior.  
  Valid values:
    - `LONG` — Weapon that fires only at LONG range. like MISSILE 
    - `MID` — Weapon that fires only at MID range. like FIGHTER
    - `CLOSE` — Weapon that fires only at CLOSE range. Like LASER
    - `SHIELD` — Absorbs damage at LONG range
    - `ARMOR` — Absorbs damage at CLOSE range
    - `MODULE_LASER` — Multiplies damage of all LASER weapons
    - `MODULE_MISSILE` — Multiplies damage of all MISSILE weapons
    - `MODULE_FIGHTER` — Multiplies damage of all FIGHTER weapons
    - `JUNK` — Inert item with no combat effect
- `reward`: Boolean (`0` or `1`). Whether the equipment may appear as a post-battle reward.
- `disposable`: Boolean (`0` or `1`). Whether the equipment is destroyed after combat and replaced with *Broken Scrap*.

---

### 2.1.2 Value Interpretation Rules
The meaning of `val` and `ammo` is inferred exclusively from `eq_type`.

- **`LONG` / `MID` / `CLOSE`**
  - `val`: Damage dealt at the corresponding combat range
  - `ammo`: Ammo consumed per activation
  - Weapons never operate outside their defined range
- **`SHIELD`**
  - `val`: Damage absorbed at LONG range only
  - `ammo`: Ignored
- **`ARMOR`**
  - `val`: Damage absorbed at CLOSE range only
  - `ammo`: Ignored
- **`MODULE`**
- Equipment with `eq_type` starting with `MODULE_` applies a damage multiplier.
- The suffix defines the target weapon category:
  - `MODULE_LASER` → affects LASER weapons
  - `MODULE_MISSILE` → affects MISSILE weapons
  - `MODULE_FIGHTER` → affects FIGHTER weapons
  - Multiple modules stack multiplicatively
  - `ammo`: Ignored
- **`JUNK`**
  - No combat effect
  - Cannot appear as a reward

---

### 2.1.3 Constraints
- Each equipment entry defines exactly one behavior.
- No equipment operates at multiple ranges.
- No equipment combines weapon, defense, or module effects.
- All behavior must be derived from `eq_type`; redundant fields are not allowed.

#### 2.1.4 Equipment csv layout

```
name,val,ammo,eq_type,reward,disposable
🚀 Lance,40,3,LONG,0,0
🚀🚀 Meteor,50,4,LONG,1,0
🚀🚀🚀 Nova,65,5,LONG,1,0
🚀💥 Gambit,80,0,LONG,1,1
🔥 Warhead Optimizer,2,0,MODULE_MISSILE,1,0
✈️ Drones,10,0,MID,1,0
✈️✈️ Wing,20,1,MID,1,0
✈️✈️✈️ Squadron,35,2,MID,1,0
✈️💥 Kamikaze,80,0,MID,1,1
⚙️ Uplink,2,0,MODULE_FIGHTER,1,0
⚡ Cutter,10,0,CLOSE,0,0
⚡⚡ Craw,15,0,CLOSE,1,0
⚡⚡⚡ Fang,25,0,CLOSE,1,0
⚡💥 Singularity Core,80,0,CLOSE,1,1
💎 Prismatic Lens,2,0,MODULE_LASER,1,0
🟫 Plating,25,0,ARMOR,0,0
🛡️ Veil,15,0,SHIELD,1,0
🛡️🛡️ Aegis,30,0,SHIELD,1,0
⚠️ Broken Scrap,0,0,JUNK,0,0
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

```
difficulty,name,hull,shield,armor,rank,attack_LONG,attack_MID,attack_CLOSE
1,Skirmisher,30,0,0,NORMAL,0,0,10
2,Drifter,35,5,0,NORMAL,20,0,10
3,Scout,40,0,10,NORMAL,0,0,15
3,ancer,45,10,0,NORMAL,30,0,15
5,Raider,50,10,10,ELITE,30,0,20
4,Interceptor,55,15,10,NORMAL,35,0,20
4,Frigate,65,0,20,NORMAL,20,0,25
4,Enforcer,70,20,15,ELITE,40,0,25
8,Howler,80,25,20,ELITE,45,0,30
10,the Boss,100,30,40,BOSS,50,0,35
```

### 2.3 Player ship initial state
- Player ship state
  - `max_hull`: 200,
  - `shield`: 0,
  - `armor`: 0,
  - `ammo`: 12,
  - `max_slots`: 6,
  - `inventory`:
    - "🚀 Comet Lance"
    - "⚡ Hull Cutter"
    - "⚡ Hull Cutter"
    - "🟫 Reinforced Plating"

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
- **Inventory:** all equipments the player owns
- **Slots:** up to `max_slots` equipped items
- You may have multiple same id equipments. Need to distinguish them
- ONLY equipped items affect combat
- Equipment can be swapped Pre-combat scene 

-----

## 4. COMBAT SYSTEM
Combat is fully deterministic and proceeds through a fixed sequence of range-based turns.
No player input is allowed once combat begins.

### 4.1 Turn Order
Each combat follows this fixed range sequence:
LONG → MID → CLOSE → CLOSE → MID → LONG

- Total of **6 turns per combat**
- Combat ends immediately if either side is destroyed

### 4.2 Start of Combat
At the beginning of combat:

- Player **shield** and **armor** values are recalculated from equipped items:
  - `eq_type = SHIELD` → contributes to shield
  - `eq_type = ARMOR` → contributes to armor
- Shield and armor **reset every combat**
- Player `hull` damage **persists between combats**

#### Module Multiplier Calculation

- For each equipped equipment where `eq_type` starts with `MODULE_`
- All player equipments whose `eq_type` matches the module’s target receive the multiplier
- Multipliers stack **multiplicatively**
  - Two ×2 modules → ×4
  - Two ×3 modules → ×9
- Multipliers are applied **before combat starts**

### 4.3 Attack Resolution Rules
Each turn resolves in the following order.

#### 4.3.1 Player Attacks First
For the current range (LONG / MID / CLOSE):

- For each equipped equipment:
  - If `eq_type` matches the current range:
    - LONG → `eq_type = LONG`
    - MID → `eq_type = MID`
    - CLOSE → `eq_type = CLOSE`
  - Check if player has enough `ammo` for `ammo` cost
  - If valid, the equipment activates automatically

Rules:
- All valid equipments fire **simultaneously**
- Damage is calculated as:
  - `val × applicable MODULE multipliers`
- Total damage = sum of all activated equipments
- Total ammo consumed = sum of `ammo`
- Equipments fire even if damage exceeds enemy hull (overkill allowed)

#### 4.3.2 Enemy Takes Damage
Damage is applied using damage resolution rules (see 4.4)

#### 4.3.3 Enemy Status Check

- If enemy `hull ≤ 0`:
  - Enemy is destroyed
  - Enemy does **not** attack this turn
  - Combat ends immediately (victory)

#### 4.3.4 Enemy Attacks (If Alive)
For the current range:

- Enemy attack value is read from:
  - LONG → `attack_LONG`
  - MID → `attack_MID`
  - CLOSE → `attack_CLOSE`
- If the value is greater than `0`, enemy attacks automatically
- Player takes damage following damage resolution rules (see 4.4)

#### 4.3.5 Player Status Check
- If player `hull ≤ 0`:
  - Player is destroyed
  - Combat ends immediately (defeat)

### 4.4 Damage Resolution rule
Damage resolution depends entirely on the current combat range. There are three independent damage models:

#### 4.4.1 LONG Range Damage Resolution:
1. Damage is applied to `shield` first
2. Remaining damage (if any) is applied to `hull`

#### 4.4.2 MID Range Damage Resolution:
1. Damage is applied directly to `hull`
2. `shield` and `armor` are ignored

#### 4.4.3 CLOSE Range Damage Resolution:
1. Damage is applied to `armor` first
2. Remaining damage (if any) is applied to `hull`

### 4.5 End of Combat
#### 4.5.1 Disposable Item Cleanup
- All equipped disposable items (`"disposable": true`) are removed from equipped slots
- Each disposable item is replaced in inventory with one Broken Scrap (ID: 999)
- This happens regardless of whether the item was activated during combat
- Combat log displays: "[Item Name] has burned out. Replaced with Broken Scrap."

#### 4.5.2 Draw Condition
Draws are expected to be rare and are treated as tactical failure. 

A combat is considered a draw if:
- Both player and enemy are still alive after Turn 6.

In a draw:
- Combat ends immediately
- No rewards are granted
- If the enemy `type` is "Boss": Game Over
- If the enemy `type` is not "Boss": Proceed to next stage

#### 4.5.3 Win Condition
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
Dock is a repair station. Chose one:
- **Repair:** Heal Hull by 30% of Max Hull
  OR
- **Resupply:** Gain +7 Ammo

-----

## 6. Scene and Flow
This section defines the authoritative game progression flow and the scenes used to present game state.
**Progression is controlled exclusively by the Flow; scenes do not alter progression logic.**

### 6.1 Flow
```
START
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
│   continue Main Loop / Game End Scene
│
└─ If stage type is Dock
    ↓
    Dock Scene

```

### 6.2 Scene Definitions
Each scene is a presentation and input layer only.  
Scenes do not control progression; all transitions are dictated by the Flow system.

#### 6.2.1 Combat Scene
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
    - `name`, `eq_type`, `val`, `ammo`, `disposable `
  - **LOG**
    - After combat engagement, a combat log is shown

- **Input**
  - **Pre-combat**
    - Equip / unequip inventory items
    - "Engage Combat" button
  - **During combat**
    - "Continue" button 
  - **Post-combat**
    - "Continue" button

- **Notes**
  - At the first stage, no equipment is equipped by default
  - Up to `max_slots` items may be equipped
  - Equipment selections persist between battles

- **Exit**
  - Player victory and final stage → Game End Scene
  - Player victory → Reward Scene
  - Draw vs Boss enemy → Game End Scene
  - Draw vs non-Boss enemy → Advance stage, return to Main Loop
  - Player defeat → Game End Scene

#### 6.22 Reward Scene
**Purpose:** Resolve post-combat equipment acquisition

- **Display**
  - Available normal reward items
  - Each reward shows:
    - `name`, `eq_type`, `val`, `ammo`, `disposable `
  - Boss reward list

- **Input**
  - **Normal reward**
    - Select exactly one reward
  - **Boss reward**
    - Sekect exactly one reward

- **Exit**
  - Advances stage
  - Returns to Main Loop

#### 6.2.3 Dock Scene
**Purpose:** Resolve Dock events
- **Display**
  - Player ship: `hull`, `shield`, `armor`, `ammo`
  - Event options
- **Input**
  - Select an option and continue to Exit
- **Exit**
  - Advances stage and returns to Main Loop

#### 6.2.4 Game End Scene
- If it is game over, display this:
```
STAR CANINE has been destroyed...
```

- If it is game clear, display this:
```
Planet K9 has been liberated.
LAIKA is safe.

Mission Complete.
```

**END OF SPECIFICATION**
