# SPACE EXPEDITION SPECIFICATION v0.1.2

-----

## 1. GAME OVERVIEW

This is a terminal-based, deterministic, text-only roguelike spaceship game.

- No randomness in combat
- No graphics
- No real-time input during battle
- Designed to be playable and solvable by LLMs
- Inspired by Slay the Spire, but simpler

Player progresses through fixed stages, fighting enemies, managing hull HP and ammo, and upgrading ship equipment.

-----

## 2. CORE CONCEPTS

- The player controls ONE ship
- Battles are 1 vs 1
- Damage persists between battles (hull only)
- Ammo is a limited resource
- Strategy is about:
  - Equipment selection
  - Ammo usage
  - Preventing enemy attacks by killing first

### 2.1 Flow

#### 2.1.1 First scene 
At the start of each stage, player:
- Show own ship status
- Show full equipment list
- Selects up to 6 items to equip
(checkmarks selected, if it has UI)

If stage is combat:
- show enemy status. Enemy's HP, damage (long, mid, close) and other feature displayed)
- Engage battle to start combat

If stage is others:
- follow the description of the stage setting 


#### 2.1.2 Combat log scene
- Display log
- If player beats an enemy, he grant reward. Else if it is draw, skip reward and continue to a next stage. Else if player loses, it is game over. 

#### 2.1.3 Reward scene
- If player beat an enemy, display reward list.
- Go to the next stage

#### 2.1.4 Game over scene
- display player's progress. 

-----

## 3. PLAYER SHIP (BASE STATS)

https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Starting_state.json

- equipped_item_ids equals "Equipment_data.json"'s id. 
- Hull and Ammo persists between battles and is NOT fully restored automatically.


-----

## 4. EQUIPMENT SYSTEM

### 4.1 Inventory vs Slots

- **Inventory:** all equipment the player owns
- **Slots:** up to 6 equipped items. you cannot assign 7 or more equipment
- You may have multiple same id equipments. Need to distinguish them
- ONLY equipped items affect combat
- Equipment can be freely swapped between battles



### 4.2 Equipment behavior

If an equipment’s range matches the current combat phase, and it still has remaining uses and ammo, it activates automatically.

### 4.3 Equipment list
https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Equipment_data.json

### 4.4 Equipment Fields
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

-----

## 5. COMBAT STRUCTURE

### 5.1 Turn Order

Each combat follows this fixed range sequence:

- **Turn 1:** Long
- **Turn 2:** Middle
- **Turn 3:** Close
- **Turn 4:** Close
- **Turn 5:** Middle
- **Turn 6:** Long

(6 turns total per combat, unless someone is destroyed earlier)

### 5.2 Attack Resolution Rule (VERY IMPORTANT)

On EACH turn:

1. Player attacks first
1. Enemy HP is reduced
1. If enemy HP ≤ 0:
  - Enemy does NOT attack
  - Combat proceeds to next turn or ends
1. If enemy survives:
  - Enemy attacks

This rule applies to ALL turns and ranges.

**There is NO simultaneous damage.**

## 5.3 DAMAGE RESOLUTION ORDER

- Player attack resolves first. If enemy HP <= 0, enemy does not attack this turn. Else enemy attack resolves


When damage is dealt:

1. Shield absorbs damage (if active this turn)
1. Remaining damage goes to Armor
1. Remaining damage goes to Hull

Shield and armor cannot absorb more than their current value.



-----

## 6. ENEMY DESIGN

Enemies always attack if alive and if they have a weapon valid for the current range.


### 6.1 Enemy list

https://raw.githubusercontent.com/ToreniaFournieri/Star-Canine/main/Enemy_data.json

### 6.2 Enemy Fields
Enemy JSON fields:
- id: Numeric identifier
- category: first/normal/elite/boss
- hp: Total health for this enemy
- attacks: List of objects with fields:
  - range: LONG/MID/CLOSE
  - damage: Damage dealt in that phase
  - uses_per_battle: How many times this attack can trigger in the combat



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

### stage layout
1. combat enemy (id:1)
1. combat enemy (id:2)
1. combat enemy (from category normal)
1. dock (heal Hull 30% or +6 ammo)
1. combat elite (from category elite)
1. combat enemy (from category normal)
1. combat enemy (from category normal)
1. dock (heal Hull 30% or +6 ammo)
1. combat boss (from category boss)

-----

## 9. DESIGN GOALS (FOR CODER)

- Deterministic output
- Clear logs per turn
- Easy to reason damage
- Minimal state tracking
- No hidden rules

-----

**END OF SPECIFICATION**