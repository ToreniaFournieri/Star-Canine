# STAR CANINE SPECIFICATION v0.3.2


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
- id: Unique numeric identifier
- name: Display name with emoji identifier
- type: Equipment category. Valid types: MISSILE, LASER, FIGHTER, SHIELD, ARMOR, MODULE, JUNK
- reward: Boolean. Whether this item can appear as a post-battle reward
- disposable: Boolean. Whether this item is destroyed after combat (replaced with Broken Scrap)

##### Weapon Fields (MISSILE, LASER, FIGHTER):
- damage_LONG: Integer or null. Damage dealt at LONG range. null = cannot fire at this range
- damage_MID: Integer or null. Damage dealt at MID range. null = cannot fire at this range
- damage_CLOSE: Integer or null. Damage dealt at CLOSE range. null = cannot fire at this range
- ammo_cost: Integer. Ammo consumed per activation (regardless of range)
- uses_per_battle: Integer or null. Maximum total activations per combat across all ranges. null = unlimited

##### Defensive Fields:
- shield: Integer (SHIELD type only). Damage absorbed at LONG range only
- armor: Integer (ARMOR type only). Damage absorbed at CLOSE range only

##### Module Fields (MODULE type only):
- target_type: String. Weapon type to boost (MISSILE, LASER, FIGHTER)
- multiplier: Integer. Damage multiplier for matching weapons. Multiple modules stack multiplicatively (two x2 modules = x4 total)

##### Design Notes:
  - A weapon can fire at multiple ranges with different damage values
  - Example: A laser might deal 5 damage at LONG (diffused), 15 at MID, and 25 at CLOSE (focused)
  - Set damage to null for ranges where the weapon cannot fire
  - uses_per_battle counts total activations, not per-range (e.g., uses_per_battle: 2 means 2 shots total, not 2 per range)


#### 2.1.2 Equipment JSON file
https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Equipment_data.json

### 2.2 Enemy Data
Enemy data is defined in JSON. Each enemy entry represents a single hostile unit encountered in combat.

#### 2.2.1 Enemy Fields

##### Core Fields:
- enemy_id: String. Unique identifier for the enemy.
- faction: String. Narrative alignment and affiliation. Example values: SolarBear, K9.
- hull: Integer. Enemy hit points.

##### Defensive Fields (Optional):
- shield: Integer (optional). Shield value. If omitted, treated as 0.
- armor: Integer (optional). Armor value. If omitted, treated as 0.

##### Attack Fields:
- damage_LONG: Integer or null. Damage dealt at LONG range. null = cannot attack at this range
- damage_MID: Integer or null. Damage dealt at MID range. null = cannot attack at this range
- damage_CLOSE: Integer or null. Damage dealt at CLOSE range. null = cannot attack at this range
- uses_LONG: Integer or null. Max uses at LONG range. null = unlimited
- uses_MID: Integer or null. Max uses at MID range. null = unlimited
- uses_CLOSE: Integer or null. Max uses at CLOSE range. null = unlimited

##### Spawn Fields:
- difficulty: Integer. Global relative threat rating.
- type: String. Encounter category. One of: Normal, Elite, Boss
     
#### 2.2.2 Enemy JSON file
https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Enemy_data.json

### 2.3 Player ship initial state
- Player ship state
  - max_hull: 200,
  - hull: 200,
  - shield: 0,
  - armor: 0,
  - ammo: 12,
  - max_slots: 6,
  - initial_items_in_inventory: [1, 2, 2, 3]
    - These number aee "Equipment_data.json"'s id. 

- Player event state
  - paid_at_dock: false,

- Boss Upgrade state. (not_seen, owned, skipped)
  - regenerative_hull_plating: not_seen
  - automated_ammo_synthesizer: not_seen
  - forward_shield_projector: not_seen
  - reinforced_hangar: not_seen
  - expanded_hardpoint_array: not_seen
  - overloaded_logistics_core: not_seen


### 2.4 Stage layout 
- There are three type of stages
  - narrative: story telling scene. display text from Story.
  - combat: Combat stage. Enemy is chosen from Enemy_data.json. If it hits mutiple enemies by the provided condition, pick one randomly.
  - event: Special stage.
 
### 2.4.1 ACT I — DESOLATION
1. combat: a random enemy (difficulty:1, type:normal)
1. combat: a random enemy (difficulty:2, type:normal) 
1. combat: a random enemy (where difficulty:3, type:normal) 
1. event: Dock 
1. combat: an elite (difficulty:5, type:elite)
1. combat: a random enemy (difficulty:4, type:normal)
1. combat: a random enemy (difficulty:4, type:normal) 
1. event: Dock
1. combat: boss (difficulty:10, type:boss)

### 2.4.2 ACT II — BETRAYAL 
1. combat: a random enemy (difficulty:11, type:normal)
1. combat: a random enemy (difficulty:12, type:normal) 
1. combat: a random enemy (where difficulty:13, type:normal) 
1. event: Dock 
1. combat: an elite (difficulty:16, type:elite)
1. combat: a random enemy (difficulty:14, type:normal)
1. combat: a random enemy (difficulty:14, type:normal) 
1. event: Dock
1. combat: boss (difficulty:20, type:boss)


### 2.4.3 ACT III — RECLAMATION  
1. combat: a random enemy (difficulty:21, type:normal)
1. combat: a random enemy (difficulty:22, type:normal) 
1. combat: a random enemy (where difficulty:23, type:normal) 
1. event: Dock 
1. combat: an elite (difficulty:26, type:elite)
1. combat: a random enemy (difficulty:24, type:normal)
1. combat: a random enemy (difficulty:24, type:normal) 
1. event: Dock
1. combat: boss (difficulty:30, type:boss)


## 2.5 Boss Reward (Boss Upgrade)


### 2.5.1 Boss Upgrade List

#### Regenerative Hull Plating
- Increase max_hull by **+40**.
- At the beginning of each combat, **repair 20 hull** (cannot exceed max_hull).

#### Automated Ammo Synthesizer
- At the beginning of each combat, **gain +1 ammo**.

#### Forward Shield Projector
- **+1 Equipment Slot**.
- At the beginning of each combat, **+15 shield**.

#### Reinforced Hangar
- **+1 Equipment Slot**.
- At the beginning of each combat, For each **FIGHTER-type attack instance**, add **+5 base damage**.
- This bonus is applied **before module multipliers**.

#### Expanded Hardpoint Array
- **+2 Equipment Slots**.
- Equipment rewards provide **only 1 choice** instead of 3.

#### Overloaded Logistics Core
- **+2 Equipment Slots**.
- All **dock payments cost double** (healing and ammo).

-----

## 3. EQUIPMENT SYSTEM

### 3.1 Inventory vs Slots
- **Inventory:** all equipment the player owns
- **Slots:** up to 6 equipped items. you cannot assign 7 or more equipment
- You may have multiple same id equipments. Need to distinguish them
- ONLY equipped items affect combat
- Equipment can be freely swapped between battles


-----

## 4. COMBAT SYSTEM

### 4.1 Turn Order
Each combat follows this fixed range sequence:

- **Turn 1:** Long
- **Turn 2:** Mid
- **Turn 3:** Close
- **Turn 4:** Close
- **Turn 5:** Mid
- **Turn 6:** Long
(6 turns total per combat, unless someone is destroyed earlier)

### 4.2 Start of combat
- Shield and Armor values are recalculated based on equipped SHIELD and ARMOR items
- Shield and Armor do NOT persist between battles
- Hull damage persists between battles
- **Temporary use counters are initialized:**
  - Each equipped weapon's remaining uses = its `uses_per_battle` value (null = unlimited)
  - Each enemy attack's remaining uses = its `uses_LONG`, `uses_MID`, `uses_CLOSE` value (null = unlimited)
  - These counters exist only during this combat
  - Counters do NOT modify Equipment_data.json or Enemy_data.json
  - All counters reset for the next battle

- Apply combat-start effects of all owned Boss Upgrades:
    regenerative_hull_plating
    automated_ammo_synthesizer
    forward_shield_projector
    reinforced_hangar

- Multiplier calculation:
  - For each equipped MODULE with a "multiplier" and "target_type":
    - All weapons with matching "type" have their damage multiplied
    - Multiple multipliers stack multiplicatively (two x2 modules = x4 total, two x3 modules = x9 total)
    - Example: If you equip "Prismatic Lens" (multiplier: 2, target_type: LASER), all LASER weapons deal double damage


### 4.3 Attack Resolution Rule

On EACH turn:
1. **Player attacks first**
   - For each equipped weapon:
     - Check if weapon has non-null damage value for current range:
       - LONG turn: check `damage_LONG`
       - MID turn: check `damage_MID`
       - CLOSE turn: check `damage_CLOSE`
     - Check if weapon has remaining `uses_per_battle` (if not null)
     - Check if player has sufficient ammo for `ammo_cost`
     - If all checks pass, weapon activates automatically
   - All valid weapons fire simultaneously in the same turn
   - Apply multiplier bonuses from equipped MODULEs to matching weapon types
   - Total damage = sum of all activated weapons (after multipliers)
   - Total ammo consumed = sum of `ammo_cost` from all activated weapons
   - Weapons fire even if damage is overkill

2. **Enemy takes damage**
   - Apply damage following damage resolution rules (section 4.4)

3. **Check enemy status**
   - If enemy Hull ≤ 0:
     - Enemy is destroyed
     - Enemy does NOT attack this turn
     - Combat ends (victory)
   
4. **Enemy attacks** (only if still alive)
   - Check if enemy has non-null damage value for current range:
     - LONG turn: check `damage_LONG`
     - MID turn: check `damage_MID`
     - CLOSE turn: check `damage_CLOSE`
   - Check if enemy has remaining uses for that range:
     - LONG turn: check `uses_LONG`
     - MID turn: check `uses_MID`
     - CLOSE turn: check `uses_CLOSE`
   - If both checks pass, enemy attacks automatically
   - Player takes damage following damage resolution rules (section 4.4)

5. **Check player status**
   - If player Hull ≤ 0:
     - Player is destroyed
     - Combat ends (defeat)

### 4.4 Damage Resolution rule
Damage resolution depends entirely on the current combat range. There are three independent damage models:

#### LONG Range Damage Resolution:
1. Damage is applied to Shield first
2. Remaining damage (if any) is applied to Hull

#### MID Range Damage Resolution:
1. Damage is applied directly to Hull
2. Shield and Armor are ignored

#### CLOSE Range Damage Resolution:
1. Damage is applied to Armor first
2. Remaining damage (if any) is applied to Hull

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
- If enemy type is "Boss": Game Over
- If enemy type is not "Boss": Proceed to next stage

#### 4.5.3 Victory Condition
Player wins when:
- Enemy Hull ≤ 0 before Turn 6 ends

#### 4.5.4 Defeat Condition
Player loses when:
- Player Hull ≤ 0 at any point
- Draw occurs against a Boss enemy

### 4.6 Reward

#### 4.6.1 Normal reward

After winning a battle, the player chooses ONE:
    - Gain +5 Ammo
    - Choose 1 equipment

Equipment options:  
    - 3 options if expanded_hardpoint_array is not owned  
    - 1 option if expanded_hardpoint_array is owned (Boss Upgrade penalty)  

Equipment is selected from equipment_data.json where "reward": true.  
Display equipment name and status.  

#### 4.6.2 Boss reward 

- Boss rewards are granted after defeating the **ACT I boss** and **ACT II boss**.
- No boss reward is granted after the **ACT III boss**, which ends the game.
- Boss Upgrade are **permanent** and cannot be removed.
- Each Boss Upgrade can be obtained **at most once per run**.
- Each boss reward presents the player with **3 Boss Upgrade**.


- Boss Reward Resolution:
    - The player selects exactly one Boss Upgrade.
    - For the selected upgrade, set state = owned.
    - For all other offered upgrades, set state = skipped.
    - Immediately apply the selected upgrade’s equipment slot bonus.
    - Heal hull to max_hull. 

-----

## 5. Event

### 5.1 Dock
Dock is a repair station that provides restoration services in exchange for payment.

- Player can skip this event.
- Player must discard X item(s) from inventory, where X = current ACT number. (ex. ACT II: Discard 2 items)
  - If overloaded_logistics_core is owned, the X is doubled. (as a Boss Upgrade penalty)
  - Player selects X item(s) from inventory to discard permanently. 
  - Item is unequiped and removed from the game. (cannot be recovered) And set paid_at_dock:true
  - After payment (paid_at_dock:true) , player chooses ONE option:
    - **Repair:** Heal Hull by 30% (rounded down)
    - **Resupply:** Gain +7 Ammo
  - Reset to paid_at_dock:false

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
├─ If Next Stage is null
│    → Game Clear Scene
│    → END / RESTART
│
├─ If Next Stage is 1st of ACT
│    → Narrative Scene (ACT Start)
│    → continue Main Loop (same stage)
│
├─ If Next Stage is last of ACT
│    → Narrative Scene (Boss Encounter)
│    → continue Main Loop (same stage)
│
├─ Resolve Stage Type
│   │
│   ├─ If type is Combat
│   │    ↓
│   │  Pre-Combat Scene
│   │    ↓
│   │  Combat Log Scene
│   │    ├─ Win
│   │    │    → Reward Scene
│   │    │    → advance stage
│   │    │    → continue Main Loop
│   │    ├─ Draw AND Boss
│   │    │    → Game Over Scene
│   │    │    → END / RESTART
│   │    ├─ Draw AND Not Boss
│   │    │    → advance stage (no reward)
│   │    │    → continue Main Loop
│   │    └─ Lose
│   │         → Game Over Scene
│   │         → END / RESTART
│   │
│   └─ If type is Dock
│        → Event Scene (Dock)
│        → advance stage
│        → continue Main Loop
```

### 6.2 Scene Definitions

Each scene is a presentation and input layer.
Scenes do not determine progression; all transitions are dictated by the Flow.


### Opening Scene

**Purpose:** Game entry point

- **Display**
  - Game title
  - Start prompt
- **Input**
  - Start button / Enter to Exit
- **Exit**
  - Always proceeds to Main Loo
---

### Narrative Scene

**Purpose:** Story delivery at ACT boundaries

- **Display**
  - Narrative text
- **Input**
  - Continue button / Enter to Exit
- **Exit**
  - Returns to Main Loop

---

### Pre-Combat Scene

**Purpose:** Loadout confirmation before combat

- **Display**
  - Player ship: Hull, Shield, Armor, Ammo
  - Enemy ship: Hull, Shield, Armor, Ammo, dagame_LONG, damage_MID, damage_CLOSE
  - Full Inventory display order: 
    - Equipped items are displayed first and marked as equipped.
    - Unequipped items are displayed after the equipped items.
    - Each equipment item displays its status
- **Input**
  - Equip or unequip inventory items
  - Engage Combat button / command to Exit
- **Notes**
  - At the first stage, no equipment is selected
  - Up to max_slots items may be equipped
  - Previous equipment selections persist
- **Exit**
  - Proceeds to Combat Log Scene 

---

### Combat Log Scene

**Purpose:** Display deterministic combat resolution

- **Display**
  - Current player ship: Hull, Shield, Armor, Ammo
  - Current enemy ship: Hull, Shield, Armor, Ammo
  - Step-by-step combat log
- **Input**
  - Continue button / Enter
- **Exit**
  - Outcome is resolved by Flow (Win / Draw / Lose)

---

### Reward Scene

**Purpose:** Resolve post-combat rewards

- **Display**
  - Available rewards and their status
- **Input**
  - Select one reward
- **Exit**
  - Advances stage and returns to Main Loop

---

### Event Scene (Dock)

**Purpose:** Resolve Dock-type stage events

- **Display**
  - Player ship: Hull, Shield, Armor, Ammo
  - Event options
- **Input**
  - Select an option and continue to Exit
- **Exit**
  - Advances stage and returns to Main Loop

---

### Game Clear Scene

**Purpose:** End-of-run success state

- **Display**
  - Final player ship status
  - Player progress summary
- **Input**
  - Restart button / Enter to Exit
- **Exit**
  - Restart game

---

### Game Over Scene

**Purpose:** End-of-run failure state

- **Display**
  - Final player ship status
  - Player progress summary
- **Input**
  - Restart button / Enter to Exit
- **Exit**
  - Restart game

-----

## 7. Story

- ACT I   — DESOLATION 
  - location:Far orbital area
- ACT II  — BETRAYAL 
  - location:Asteroid belt
- ACT III — RECLAMATION 
  - location:Planet K9

### 7.1 ACT I — DESOLATION
- Start

> Ship ID confirmed: STAR CANINE  
> Command authority: CAPTAIN  

> Incoming distress signal detected.  
> Origin: Planet K9  
> Sender ID: LAIKA  

> "It's me.  
> K9 has fallen.  
> Solar Bear battleships took the planet.  
> They took me too.  
> I know you weren't here.  
> I know you'll come back.  
> Please… don't die."
>
> Signal lost.

> Solar Bear Empire detected in K9 orbit.  
> Occupation status: ACTIVE.

> Setting course for K9.

- Boss Encounter 
> Ship location: K9 Outer Orbit  
> Massive signature detected: URSA-CLASS DREADNOUGHT  
> Sender ID: COMMODORE URSA  
> 
> "A stray dog is sniffing at the gate.  
> K9 is no longer your dog house—it belongs to the Empire.  
> No bone for you, underdog.”  
>
> Warning: Imperial Railguns charging.  
> Status: EXTERMINATION  

### 7.2 ACT II  — BETRAYAL 
- Start
> Ship location: Asteroid Belt (Inner)  
> Unknown signal detected.  
> Decrypting...  
> Sender ID: COMMANDER FENRIR  
>  
> "Signal confirmed.  
> Star Canine, is that you, 'Blue Wolf'?  
> I've been fighting the Bears from the shadows.  
> Let me assist."  
>  
> Action: VANGUARD LOGISTICS  
> Status: Hull restored to 100%. +12 Ammo. 
> Target Update: MOON BEAR.  
>  
> "Kill MOON BEAR.  
> If he falls, the Empire's grip on K9 breaks.  
> Clear the path, Blue Wolf.  
> I’ll secure your flank."  

- Boss Encounter 

> Target status: MOON BEAR NEUTRALIZED.  
> Incoming transmission...  
> Sender ID: COMMANDER FENRIR  
>  
> "Moon bear is gone.  
> The Bears have a new General.  
> Me.  
> Thank you for your hard work, Blue Wolf.  
> Rest in peace."  
>  
> Signal lost.  
> Warning: Target lock detected.  
> Origin: FENRIR.  
> Status: DANGER.  

### 7.3 ACT III — RECLAMATION 
Star Canine arrives at K9, continuing fierce battles. No message exchange between Star Canine and Solar Bears. Only reverberation of explosions. 

- Start
> “Fight with cudgel.  
> No cudgel, use your claw.  
> No claw, use your fang.  
> No fang, use your soul.   
> Fight until nothing left."   
> — DEITY OF BLUE WOLF (Canto IV, Line 12)  
- Boss Encounter  
Encountering Celestial Reaper, the boss of Solar Bear. Overlapping the myth. 

> Reminiscence of academy five years ago  
> FENRIR: "You don't get it, right? My grandma told me the story.  
> The Blue Wolf... the deity that conquered the Great Continent.  
> It’s an incarnation. A living god in a canine body. It appears when Canine is in danger.   
> 
> You got a good callsign, Blue Wolf. Sleep tight.   


**END OF SPECIFICATION**
