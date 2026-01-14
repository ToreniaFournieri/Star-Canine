# SPACE EXPEDITION SPECIFICATION v0.1.0

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

-----

## 3. PLAYER SHIP (BASE STATS)

Starting_state.json

equipped_item_ids equals "Equipment_data.json"'s id. 
Ammo persists between battles and is NOT fully restored automatically.

-----

## 4. EQUIPMENT SYSTEM

### 4.1 Inventory vs Slots

- **Inventory:** all equipment the player owns
- **Slots:** up to 6 equipped items
- ONLY equipped items affect combat
- Equipment can be freely swapped between battles

At the start of each battle, player:

- Sees full equipment list
- Selects up to 6 items to equip
- Sees next battle’s enemy Status (HP, long, close damage or other feature)

(checkmarks selected, if it has UI)

-----

### 4.2 Equipment behavior
Each piece of equipment may define:
- Range (long or close)
- Damage
- Ammo cost (if any)
- uses_per_battle (optional)

If an equipment’s range matches the current combat phase, and it still has remaining uses and ammo, it activates automatically.

-----

### 4.3 Equipment list
Equipment_data.json



-----

## 5. DAMAGE RESOLUTION ORDER

When damage is dealt:

1. Shield absorbs damage (if active this turn)
1. Remaining damage goes to Armor
1. Remaining damage goes to Hull

Shield and armor cannot absorb more than their current value.

-----

## 6. COMBAT STRUCTURE

### 6.1 Turn Order

Each combat follows this fixed range sequence:

- **Turn 1:** Long
- **Turn 2:** Close
- **Turn 3:** Close
- **Turn 4:** Close
- **Turn 5:** Long

(5 turns total per combat, unless someone is destroyed earlier)

-----

### 6.2 Attack Resolution Rule (VERY IMPORTANT)

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


-----

## 7. ENEMY DESIGN

Enemy_data.json

Enemies always attack if alive and if they have a weapon valid for the current range.

uses_per_battle means:
The maximum number of times an attack or effect may activate during a single combat.
- Decreases by 1 each time it triggers
- When it reaches 0, it no longer activates
- Large values (e.g. 999) mean “effectively unlimited”

-----

## 8. REWARDS

After winning a battle, player chooses ONE:

**A) Choose 1 equipment from 3 options**

OR

**B) Gain +1 Ammo**

If the player draws or loses:

- Game ends
- No reward

Equipment is randomly chosen from equipment_data.json. 

-----

## 9. PROGRESSION STRUCTURE (SIMPLIFIED)

- Fixed linear sequence of battles
- No events
- No shops
- No randomness in combat
- No mid-range combat
- Focus is on clarity and balance

-----

## 10. DESIGN GOALS (FOR CODER)

- Deterministic output
- Clear logs per turn
- Easy to reason damage
- Minimal state tracking
- No hidden rules

-----

**END OF SPECIFICATION**