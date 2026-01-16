# STAR CANINE SPECIFICATION v0.2.6

-----

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

##### Optional Fields:
- flavor_text: String. Descriptive text with no gameplay effect

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

  - enemy_id: String. Unique identifier for the enemy.
  - faction: String. Narrative alignment and affiliation. Example values: SolarBear, K9.
  - flavor_text: String. One-line descriptive text shown in combat logs. Has no gameplay effect.
  - hull: Integer
  - shield: Integer (optional)
  - armor: Integer (optional)
If a defensive field is omitted, its value is treated as 0.

  - Attacks
    - attacks: Array. Defines all attacks this enemy can perform during a single combat.
    - Each attack object contains:
      - range: String. One of: LONG, MID, CLOSE
    - damage: Integer. Fixed damage dealt when the attack triggers.
    - uses_per_battle: Integer. Maximum number of times this attack may trigger during the combat.
          
  - Spawn Data
      - spawn: Object. Defines encounter classification and threat level.
      - difficulty: Integer. Global relative threat rating.
      - type: String. Encounter category. One of: Normal, Elite, Boss
     
#### 2.2.2 Enemy JSON file
https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Enemy_data.json

### 2.3 Player ship initial state
- Player ship initial state
  - "hull": 200,
  - "shield": 0,
  - "armor": 0,
  - "ammo": 12,
  - "max_slots": 6,
  - "equipped_item_ids": [1, 2, 2, 3]
    - equipped_item_ids equals "Equipment_data.json"'s id. 

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
 not defined yet for this version. 

### 2.4.3 ACT III — RECLAMATION  
 not defined yet for this version. 

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
- Shield and Armor values are recalculated at the start of each combat.
- Shield and Armor do NOT persist between battles.
- Hull damage persists between battles.
- If ship equipped an item which has "multiplier" and "target_type". All damage of other items which "type" are same "target_type" is multiplier's amount. If there are two "multiplier":3 items equiped, damage is x9.


### 4.3 Attack Resolution Rule

On EACH turn:
1. Player attacks first
  - Equipment valid check:
    - If an equipment’s range matches the current combat phase, and it still has remaining uses and ammo, it activates automatically.
    - Every valid equipment used at once. Even it is overkill
    - Multiplier damage if there is multiplier equipment and matched its type.  
      - Effect stackable: If you equip two same multiplier (x2), total multiplied damage is x4 
1. Enemy takes damage following damage resolution order.
1. If enemy HP ≤ 0:
  - Enemy does NOT attack
  - Combat proceeds to next turn or ends
1. If enemy survives:
  - Enemies always attack if alive and if they have a valid damage value for the current range.
  - Player takes damage following damage resolution order.
This rule applies to ALL turns and ranges.

**There is NO simultaneous damage.**

### 4.4 Damage Resolution rule
- Damage resolution depends entirely on the current combat range.
- There are three independent damage models, one per range.

- Damage Resolution by Range:
  - LONG range
    - Damage is applied to Shield first
    - Remaining damage is applied to Hull
  - MID range
    - Damage is applied directly to Hull
  - CLOSE range
    - Damage is applied to Armor first
    - Remaining damage is applied to Hull

### 4.5 End of Combat
#### 4.5.1 Disposable item clean up
  - All equipped disposable items ("disposable": True) are replaced in the inventory with Broken Scrap (ID: 999).
  - The item is destroyed regardless of whether it was actually fired or activated during the battle.
  - Log: <Item Name> has burned out. Replaced with Broken Scrap.

#### 4.5.2 Draw Condition
A combat is considered a draw if:
- Both player and enemy are still alive after Turn 6.

In a draw:
- Combat ends immediately
- No rewards are granted
- IF the enemy type is boss, it is game over. Else, the game proceeds to the next stage

### 4.6 Reward
- After winning a battle, player chooses ONE:
**A) Choose 1 equipment from 3 options**
OR
**B) Gain +3 Ammo**

- Equipment is randomly chosen where "reward": true from equipment_data.json. 

-----

## 5. Event

### 5.1 Dock
- Dock gives two options
  - heal Hull 30%
  - +6 ammo

-----

## 6. Scene and Flow

### 6.1 Scene list
- Opening scene
  - Input: Start button/ Enter to start
- Narrative scene
  - Display  
  - Input: Continue button/ Enter to continue
- Pre-combat scene
  - Display own ship's Hull, Shield, Armor, Ammo.
  - Display next enemy's Hull, Shield, Armor, Ammo.
  - Display full inventory list. Equipment item is checkmarked.
  - Input: select item of inventory to equip, unequip item/ Command to equip/unequip.
  - Input: Engage combat button/ Engage to proceed to combat log scene
  - Note
    - at the first stage, none of them selected
    - Selects up to 6 items to equip. Persist previous selection of equipment
- Combat log scene
  - Display current own ship's Hull, Shield, Armor, Ammo.
  - Display current enemy's Hull, Shield, Armor, Ammo.
  - Display combat log. Step-by-step
  - Input: Continue button/ Enter to continue
- Reward scene
  - Display reward list
  - Input: Select reward and continue to the next scene
- Event scene
  - Dock event
    - Display own ship's Hull, Shield, Armor, Ammo.
    - Input: Select options and continue to the next scene
- Game Clear scene
  - Display current own ship's Hull, Shield, Armor, Ammo.
  - display player's progress. 
  - Input: Restart button/ Enter to restart
- Game over scene
  - Display current own ship's Hull, Shield, Armor, Ammo.
  - display player's progress. 
  - Input: Restart button/ Enter to restart

### 6.2 Flow
```
START
  ↓
Opening Scene
  ↓
┌─────────────────────┐
│ Check Next Stage    │
└─────────────────────┘
  │
  ├─ If null → Game Clear Scene → END/RESTART
  │
  ├─ If 1st stage of ACT → Narrative Scene (ACT Start) → [loop to Check Next Stage]
  │
  ├─ If last stage of ACT → Narrative Scene (Boss Encounter) → [loop to Check Next Stage]
  │
  ├─ If type: combat
  │    ↓
  │  Pre-Combat Scene
  │    ↓
  │  Combat Log Scene
  │    ├─ Win → Reward Scene → [loop to Check Next Stage]
  │    ├─ Draw + Boss → Game Over Scene → END/RESTART
  │    ├─ Draw + Not Boss → [loop to Check Next Stage]
  │    └─ Lose → Game Over Scene → END/RESTART
  │
  └─ If type: Dock
       ↓
     Event Scene (Dock) → [loop to Check Next Stage]
```
 
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
