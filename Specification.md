# STAR CANINE SPECIFICATION v0.5.12

## 1. OVERVIEW
- This is a terminal-based (or simple UI), deterministic, text-only roguelike spaceship game.
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

### 1.3 Implementation Rules (FOR CORDER **especially Claude**)
1. IF you are going to embed data of Equipment or Enemy. To optimize token usage, embed data as a CSV string and parse it at runtime  
Example:
```javascript
const EQUIPMENT_CSV = `name,value,ammo,eq_type,reward,disposable
🚀 Lance,40,3,LONG,0,0
🚀🚀 Meteor,50,4,LONG,1,0`;

const EQUIPMENT_DATA = EQUIPMENT_CSV.trim().split('\n').slice(1).map(line => {
  const [name, value, ammo, eq_type, reward, disposable] = line.split(',');
  return { 
    name, 
    value: parseInt(value), 
    ammo: parseInt(ammo), 
    eq_type, 
    reward: reward === '1', 
    disposable: disposable === '1' 
  };
});
```

2. Scene Mapping
- Do NOT manage progression inside scenes.
- Scenes must be pure UI.
- All progression must be handled by a single Flow controller using stageNum.
- Scene mapping MUST use component references, not instantiated JSX.
- advanceStage() may only be triggered by stageNum changes (useEffect).
- Do NOT introduce any scene names not defined in the specification.

REQUIRED pattern:
```javascript
const SCENES = {
  start: StartScene,
  combat: CombatScene,
  reward: RewardScene,
  dock: DockScene,
  gameend: GameEndScene
};

const Scene = SCENES[scene];
return Scene ? <Scene {...props} /> : null;
```

FORBIDDEN pattern:
```javascript
if (gameState === 'start') { ... }
if (gameState === 'combat') { ... }
if (gameState === 'reward') { ... }
```

-----
## 2. DEFINITIONS
## 2.1 Equipment Data
### 2.1.1 Equipment Fields
Each equipment entry defines the following fields:
- `name`: Display name of the equipment. May include emoji identifiers.
- `value`: Primary numeric value. Its meaning depends entirely on `eq_type`.
- `ammo`: Ammo consumed per activation. Ignored for equipment types that do not consume ammo (set to `0`).
- `eq_type`: Equipment behavior category. Defines combat range or special behavior.  
  Valid values:
    - `LONG` — Weapon that fires only at LONG range. like MISSILE 
    - `MID` — Weapon that fires only at MID range. like FIGHTER
    - `CLOSE` — Weapon that fires only at CLOSE range. Like LASER
    - `SHIELD` — Absorbs damage at LONG range
    - `ARMOR` — Absorbs damage at CLOSE range
    - `MODULE_CLOSE` — Multiplies damage of all CLOSE range weapons
    - `MODULE_LONG` — Multiplies damage of all LONG range weapons
    - `MODULE_MID` — Multiplies damage of all MID range weapons
    - `JUNK` — Inert item with no combat effect
- `reward`: Boolean (`0` or `1`). Whether the equipment may appear as a post-battle reward.
- `disposable`: Boolean (`0` or `1`). Whether the equipment is destroyed after combat and replaced with *Broken Scrap*.

### 2.1.2 Value Interpretation Rules
The meaning of `value` and `ammo` is inferred exclusively from `eq_type`.

- **`LONG` / `MID` / `CLOSE`**
  - `value`: Damage dealt at the corresponding combat range
  - `ammo`: Ammo consumed per activation
  - Weapons never operate outside their defined range
- **`SHIELD`**
  - `value`: Damage absorbed at LONG range only
  - `ammo`: Ignored
- **`ARMOR`**
  - `value`: Damage absorbed at CLOSE range only
  - `ammo`: Ignored
- **`MODULE`**
  - Equipment with `eq_type` starting with `MODULE_` applies a damage multiplier.
  - The suffix defines the target weapon category:
    - `MODULE_LONG` → affects LONG range weapons
    - `MODULE_MID` → affects MID range weapons
    - `MODULE_CLOSE` → affects CLOSE range weapons
    - Multiple modules stack multiplicatively
    - `ammo`: Ignored
- **`JUNK`**
  - No combat effect
  - Cannot appear as a reward

### 2.1.3 Constraints
- Each equipment entry defines exactly one behavior.
- No equipment operates at multiple ranges.
- No equipment combines weapon, defense, or module effects.
- All behavior must be derived from `eq_type`; redundant fields are not allowed.

#### 2.1.4 Equipment csv layout

```
name,value,ammo,eq_type,reward,disposable
🚀 Lance,40,3,LONG,0,0
🚀🚀 Meteor,50,4,LONG,1,0
🚀🚀🚀 Nova,65,5,LONG,1,0
🚀💥 Gambit,80,3,LONG,1,1
🔥 Warhead Optimizer,2,0,MODULE_LONG,1,0
✈️ Drones,10,0,MID,1,0
✈️✈️ Wing,20,1,MID,1,0
✈️✈️✈️ Squadron,35,2,MID,1,0
✈️💥 Kamikaze,80,2,MID,1,1
⚙️ Uplink,2,0,MODULE_MID,1,0
⚡ Fang,10,0,CLOSE,0,0
⚡⚡ Claw,15,1,CLOSE,1,0
⚡⚡⚡ Cudgel,20,2,CLOSE,1,0
⚡💥 Burn soul,40,2,CLOSE,1,1
💎 Prismatic Lens,2,0,MODULE_CLOSE,1,0
🟫 Plating,25,0,ARMOR,0,0
🟫🟫 Heavy armor,35,0,ARMOR,1,0
🛡️ Veil,20,0,SHIELD,1,0
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
3,Lancer,45,10,0,NORMAL,30,0,15
5,Raider,50,10,10,ELITE,30,0,20
4,Interceptor,55,15,10,NORMAL,35,0,20
6,Frigate,65,0,20,NORMAL,20,0,25
7,Enforcer,70,20,15,ELITE,40,0,25
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
  - `inventory`: "🚀 Lance", "⚡ Cutter", "⚡ Cutter", "🟫 Plating"

### 2.4 Stage layout 
- There are two type of stages
  - combat: Combat stage. Enemy is chosen from Enemy data. If it hits mutiple enemies by the provided condition, pick one randomly.
  - Enemy scaling affects: `hull`,`shield`,`armor`,`attack_LONG`, `attack_MID`, `attack_CLOSE`
    - ACT II, all enemy status x2.0 round down.
    - ACT III, all enemy status x3.0 round down.
  - dock: heal and resupply
 
### 2.4.1 ACT structure
- One enemy selected deterministically from the matching pool
- CSV format below:
```
stage,type,difficulty,rank
1,combat,1,NORMAL
2,combat,2,NORMAL
3,combat,3,NORMAL
4,dock,,
5,combat,5,ELITE
6,combat,4,NORMAL
7,combat,6,NORMAL
8,dock,,
9,combat,10,BOSS
```

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
  - No player input once combat starts
  - Combat ends immediately when either side is destroyed

### 4.1 Turn Structure 
Combat consists of 6 turns following this fixed range order:
LONG → MID → CLOSE → CLOSE → MID → LONG

- One range per turn
- If either side is destroyed, combat ends immediately

### 4.2 Combat Initialization
At the beginning of combat:
- Player **shield** and **armor** values are recalculated from equipped items:
  - `eq_type = SHIELD` → contributes to shield
  - `eq_type = ARMOR` → contributes to armor
- Shield and armor **reset every combat**
- Player `hull` damage **persists between combats**

#### Module Multiplier Calculation
- Equipments with `eq_type` starting with `MODULE_` act as multipliers
  - Each module targets a specific equipment type
  - All matching equipments receive the multiplier
  - Multipliers stack multiplicatively. Example: ×3 and ×3 → ×9
  - All multipliers are computed once before combat

## 4.3 Turn Resolution (Per Turn)
Each turn resolves in the following fixed order.

### 4.3.1 Player Attack
For the current range:
- **All equipped items where:**
  - `eq_type` matches the range:
    - `LONG` → `eq_type = LONG`
    - `MID` → `eq_type = MID`
    - `CLOSE` → `eq_type = CLOSE`
  - Player has sufficient ammo
    - If ammo is insufficient, the equipment does not activate.
- All valid items activate simultaneously

**Rules:**
- **Damage per item:** `base_value` × module multipliers
- **Total damage:** Sum of all activated items
- **Ammo cost:** Consumed cumulatively
- **Overkill:** Overkill damage is allowed

### 4.3.2 Enemy Damage Application
- Apply total damage using range damage rules (see **4.4**)

### 4.3.3 Enemy Status Check
- **If enemy hull ≤ 0:**
    - Enemy is destroyed
    - Enemy does not attack
    - Combat ends immediately (**Win**)

### 4.3.4 Enemy Attack (If Alive)
- Enemy attack value is read from:
    - `LONG` → `attack_LONG`
    - `MID` → `attack_MID`
    - `CLOSE` → `attack_CLOSE`
- **If attack value > 0:**
    - Enemy attacks automatically
    - Damage is resolved using the same rules (**4.4**)

### 4.3.5 Player Status Check
- **If player hull ≤ 0:**
    - Combat ends immediately (**Defeat**)

## 4.4 Damage Resolution (Authoritative)
Damage resolution depends only on current range.

| Range | Primary Target | Overflow Target |
| :--- | :--- | :--- |
| **LONG** | Shield | Hull |
| **MID** | Hull | — |
| **CLOSE** | Armor | Hull |

**Rules:**
- Damage always applies to primary target first.
- Overflow (if any) applies to secondary target.
- Shield and armor never regenerate during combat.

---
## 4.5 Combat End Processing
### 4.5.1 Disposable Equipment Cleanup
After combat ends:
- All equipped items with `"disposable": true` are removed.
- Each removed item is replaced in inventory with:
    - `⚠️ Broken Scrap`
- This occurs even if the item never activated.
- **Combat log message:**
> [Item Name] has burned out. Replaced with `⚠️ Broken Scrap`.

### 4.5.2 Combat Outcomes
A combat ends with one of three results:
**Clear:**
- Enemy `hull` ≤ 0 before Turn 6 ends
- It is a final stage
- Game Clear
**Victory:**
- Enemy `hull` ≤ 0 before Turn 6 ends
- It is not a final stage
- Player receives rewards (see 4.6)
**Defeat:**
- Player `hull` ≤ 0 at any point
- **OR** draw occurs against a Boss enemy (`type` = "Boss")
- Game Over
**Draw:**
- Both player and enemy are alive after Turn 6
- No rewards granted
- Note: if enemy `rank` = "Boss" → Count as a Defeat (Game Over)
- Otherwise → Advance to next stage

---
## 4.6 Rewards
### 4.6.1 Normal Battle Reward
After a win, player chooses **ONE**:
- +5 Ammo
- Choose 1 equipment from 3 randomly selected items (where `"reward": true`)

### 4.6.2 Boss Rewards
Granted after defeating ACT I or ACT II Boss (No boss reward after ACT III boss).

**Automatic:**
- Hull fully restored.
- +12 Ammo.

**Choose ONE bonus:**
1. `max_slots +2`
2. `max_slots +1`, `max_hull +80`, `hull +80`
3. `max_slots +1`, `ammo +12`

## 4.7 Implementation Constraint (LLM Guidance)
- **Combat logic MUST be:**
    - Single-loop.
    - Range-driven by data.
    - Free of duplicated range-specific logic.
- **Damage resolution MUST exist exactly once.**
- **Scalability:** Adding a new range must require data changes only.

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
    - `name`, `eq_type`, `value`, `ammo`, `disposable `
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
  - Each reward shows: `name`, `eq_type`, `value`, `ammo`, `disposable `
  - Boss reward list

- **Input**
  - **Normal reward**
    - Select exactly one reward
  - **Boss reward**
    - Sekect exactly one reward

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
