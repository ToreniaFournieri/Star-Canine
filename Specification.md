# STAR CANINE SPECIFICATION v0.2.7

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
- Player ship initial state
  - "hull": 200,
  - "shield": 0,
  - "armor": 0,
  - "ammo": 12,
  - "max_slots": 6,
  - "initial_inventory_item_ids": [1, 2, 2, 3]
    - These number aee "Equipment_data.json"'s id. 

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
- Shield and Armor values are recalculated based on equipped SHIELD and ARMOR items
- Shield and Armor do NOT persist between battles
- Hull damage persists between battles
- **Temporary use counters are initialized:**
  - Each equipped weapon's remaining uses = its `uses_per_battle` value (null = unlimited)
  - Each enemy attack's remaining uses = its `uses_LONG`, `uses_MID`, `uses_CLOSE` value (null = unlimited)
  - These counters exist only during this combat
  - Counters do NOT modify Equipment_data.json or Enemy_data.json
  - All counters reset for the next battle
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
- After winning a battle, player chooses ONE:
**A) Choose 1 equipment from 3 options**
OR
**B) Gain +5 Ammo**

- Equipment is randomly chosen where "reward": true from equipment_data.json. 

-----

## 5. Event

### 5.1 Dock
Dock is a repair station that provides restoration services in exchange for payment.

#### ACT I Dock (Free Service)
- Player can skip this event.
- Player chooses ONE option:
  - **Repair:** Heal Hull by 30% (rounded down)
  - **Resupply:** Gain +7 Ammo

#### ACT II & ACT III Dock (Requires Payment)
- Player can skip this event.
- Player must discard one item from inventory to use the dock.
  - Player selects one item from inventory to discard permanently
  - Item is removed from the game (cannot be recovered)
  - After payment, player chooses ONE option:
    - **Repair:** Heal Hull by 30% (rounded down)
    - **Resupply:** Gain +7 Ammo

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
    - Equipment item shows status
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
