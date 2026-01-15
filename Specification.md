# STAR CANINE SPECIFICATION v0.2.4

-----

## 1. OVERVIEW
- This is a terminal-based, deterministic, text-only roguelike spaceship game.
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



### 2.1 Flow

#### 2.1.1 First scene 
At the start of each stage, Hull, Shield(for long), Armor(for Close), Ammo. 
- Show own ship status. 
- Show full equipment list
- equipment
  - at the first stage, none of them selected
  - Selects up to 6 items to equip. Persist previous selection of equipment
  - If it has UI, checkmarks selected item.

If stage is combat:
- show own ship status. Hull, Shield(for long), Armor(for Close), Ammo. 
- show enemy status. Enemy's hull, Shield, Armor, attack damage (long, mid, close) and other feature displayed)
- Engage battle to start combat

If stage is others:
- follow the description of the stage setting 


#### 2.1.2 Combat log scene
- Display log
- If player beats an enemy, he grant reward. 
- Else if it is draw, skip reward and continue to a next stage. 
- Else if player loses, it is game over. 
- Post-Combat Cleanup: Check equipped slots. If disposable: true, log: [SYSTEM] <Item Name> has burned out. Replaced with Broken Scrap.


#### 2.1.3 Reward scene
- If player beat an enemy, display reward list.
- Go to the next stage

#### 2.1.4 Game over scene
- display player's progress. 

-----

## 3. PLAYER SHIP (BASE STATS)

- Starting state:
  "hull": 200,
  "ammo": 12,
  "max_slots": 6,
  "equipped_item_ids": [1, 2, 2, 3]


- equipped_item_ids equals "Equipment_data.json"'s id. 
- Hull and Ammo persists between battles and is NOT fully restored automatically.
- The player ship has no base Shield or Armor.
- Shield and Armor values are derived entirely from equipped items.

-----

## 4. EQUIPMENT SYSTEM

### 4.1 Inventory vs Slots

- **Inventory:** all equipment the player owns
- **Slots:** up to 6 equipped items. you cannot assign 7 or more equipment
- You may have multiple same id equipments. Need to distinguish them
- ONLY equipped items affect combat
- Equipment can be freely swapped between battles


### 4.2 Equipment list
https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Equipment_data.json

### 4.3 Equipment Fields
Equipment entries define the following fields:
- id: Unique numeric identifier
- name: Display identifier
- type: Category such as MISSILE, LASER, RAIL, SHIELD, ARMOR
- range: LONG, MID, CLOSE, or PASSIVE
- damage: Damage dealt (for weapons)
- ammo_cost: Ammo consumed when used
- uses_per_battle: How many times the equipment can activate in one combat
- absorb: Shield absorption amount (if applicable)
- armor_value: Combat armor bonus (if applicable)
- reward: Boolean indicating whether this item can appear as a reward
- disposable: Boolean indicating wether this item is disposable equipment
- multiplier: If a PASSIVE module’s target_type matches an equipped weapon’s type, that weapon's damage is multiplier's amount (ex. 2 is double) during combat resolution.



### 4.4 Disposable Equipment
Some high-power equipment is single-use across the entire campaign.
- Property: If an item has "disposable": true, it is destroyed after combat.
- Trigger: At the end of any battle, all equipped disposable items are replaced in the inventory with Broken Scrap (ID: 999).
- Condition: The item is destroyed regardless of whether it was actually fired or activated during the battle.
- Broken Scrap: Has no stats, no range, and provides no combat benefit. It must be manually unequipped to free a slot.


-----

## 5. COMBAT STRUCTURE

### 5.1 Turn Order

Each combat follows this fixed range sequence:

- **Turn 1:** Long
- **Turn 2:** Mid
- **Turn 3:** Close
- **Turn 4:** Close
- **Turn 5:** Mid
- **Turn 6:** Long

(6 turns total per combat, unless someone is destroyed earlier)

### 5.2 Attack Resolution Rule (VERY IMPORTANT)

On EACH turn:

1. Player attacks first
  - Equipment valid check:
    - If an equipment’s range matches the current combat phase, and it still has remaining uses and ammo, it activates automatically.
    - Every valid equipment used at once. Even it is overkill
    - Multiplier damage if there is multiplier equipment and matched its type.  
      - Effect stackable: If you equip two same multiplier (x2), total multiplied damage is x4 
1. Enemy HP is reduced
1. If enemy HP ≤ 0:
  - Enemy does NOT attack
  - Combat proceeds to next turn or ends
1. If enemy survives:
  - Enemy attacks

This rule applies to ALL turns and ranges.

**There is NO simultaneous damage.**

## 5.3 DAMAGE RESOLUTION ORDER

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

- Shield and Armor values are recalculated at the start of each combat.
- Shield and Armor do NOT persist between battles.
- Hull damage persists between battles.

## 5.4 Draw Condition

A combat is considered a draw if:
- Both player and enemy are still alive after Turn 6.

In a draw:
- Combat ends immediately
- No rewards are granted
- The game proceeds to the next stage

-----

## 6. ENEMY DESIGN

Enemies always attack if alive and if they have a weapon valid for the current range.


### 6.1 Enemy list

https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Enemy_data.json

### 6.2 Enemy Fields
Enemy data is defined in JSON. Each enemy entry represents a single hostile unit encountered in combat.

- Core Fields
  - enemy_id: String
Unique identifier for the enemy.
  - faction: String
Narrative alignment and affiliation.
Example values: SolarBear, K9.
  - flavor_text: String
One-line descriptive text shown in combat logs.
Has no gameplay effect.
  - hull: Integer

- Defensive Fields (Optional)
  - shield: Integer (optional)
  - armor: Integer (optional)
If a defensive field is omitted, its value is treated as 0.

- Attacks
  - attacks: Array
Defines all attacks this enemy can perform during a single combat.
  - Each attack object contains:
    - range: String
One of:
      - LONG
      - MID
      - CLOSE
  - damage: Integer
Fixed damage dealt when the attack triggers.
  - uses_per_battle: Integer
Maximum number of times this attack may trigger during the combat.

- Spawn Data
    - spawn: Object
Defines encounter classification and threat level.
    - difficulty: Integer
Global relative threat rating.
    - type: String
Encounter category. One of:
      - Normal
      - Elite
      - Boss

-----

## 7. REWARDS

After winning a battle, player chooses ONE:

**A) Choose 1 equipment from 3 options**

OR

**B) Gain +3 Ammo**

If the player draws or loses:

- Game ends
- No reward

Equipment is randomly chosen where "reward": true from equipment_data.json. 

-----

## 8. PROGRESSION STRUCTURE (SIMPLIFIED)

- Fixed linear sequence of battles

### 8.1 ACT I stage setting
1. story: Act I start
1. combat enemy (from difficulty:1, type:normal)
1. combat enemy (from difficulty:2, type:normal) 
1. combat enemy (from difficulty:3, type:normal) 
1. dock (heal Hull 30% or +6 ammo)
1. combat elite (from difficulty:5, type:elite)
1. combat enemy (from difficulty:4, type:normal) 
1. combat enemy (from difficulty:4, type:normal) 
1. dock (heal Hull 30% or +6 ammo)
1. story: Act I Boss Encounter 
1. combat boss (from difficulty:10, type:boss)

### 8.2 ACT II stage setting
 not defined yet for this early version. 

-----

## 9. 

-----

## 7. Story

- ACT I   — DESOLATION 
  - location:Far orbital area
- ACT II  — BETRAYAL 
  - location:Asteroid belt
- ACT III — RECLAMATION 
  - location:Planet K9

### 7.1 ACT I - DESOLATION
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

### 7.2 Act II  — BETRAYAL 
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

### 7.3 Act III — RECLAMATION 
Star Canine arrives at K9, continuing fierce battles. No message exchange between Star Canine and Solar Bears. Only reverberation of explosions. 

- Start
> “Fight with cudgel.  
> No cudgel, use your claw.  
> No claw, use your fang.  
> No fang, use your soul.   
> Fight until nothing left."   
> — DEITY OF BLUE WOLF (Canto IV, Line 12)  
- Boss encounter  
Encountering Celestial Reaper, the boss of Solar Bear. Overlapping the myth. 

> Reminiscence of academy five years ago  
> FENRIR: "You don't get it, right? My granma told me the story.  
> The Blue Wolf... the deity that conquered the Great Continent.  
> It’s an incarnation. A living god in a canine body. It appears when Canine is in danger.   
> 
> You got a good callsign, Blue Wolf. Sleep tight.   


**END OF SPECIFICATION**
