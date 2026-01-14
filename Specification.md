SPACE EXPEDITION SPECIFICATION v0.1.0
(CODING-READY)


1. GAME OVERVIEW

A terminal-based, deterministic, text-only roguelike spaceship game.

Key properties:
	•	No randomness in combat
	•	No graphics
	•	No real-time input during battle
	•	Designed to be playable and solvable by LLMs
	•	Inspired by Slay the Spire, but simpler

The player progresses through fixed stages, fighting enemies, managing hull HP and ammo, and upgrading ship equipment.

⸻

2. CORE CONCEPTS
	•	The player controls ONE ship
	•	Battles are 1 vs 1
	•	Damage persists between battles (hull only)
	•	Ammo is a limited resource
	•	Strategy focuses on:
	•	Equipment selection
	•	Ammo usage
	•	Preventing enemy attacks by killing first

⸻

3. PLAYER SHIP (BASE STATS)

Initial player ship:
	•	Hull HP: 200
	•	Ammo: 4
	•	Equipment slots: 6

Ammo persists between battles and is NOT automatically restored.

⸻

4. EQUIPMENT SYSTEM

4.1 Inventory vs Slots
	•	Inventory: all equipment the player owns
	•	Slots: up to 6 equipped items
	•	ONLY equipped items affect combat
	•	Equipment can be freely swapped between battles

At the start of each battle, the player:
	•	Sees full equipment list
	•	Selects up to 6 items to equip
	•	Sees the next enemy’s status:
	•	HP
	•	Long-range damage
	•	Close-range damage
	•	Special features (if any)

(Text-only UI; checkmarks optional)

⸻

4.2 Equipment Types

All equipment is passive once equipped.

A. Assault Equipment
1. Missile Launcher
	•	Type: Long range
	•	Damage: defined per launcher
	•	Ammo cost: defined per launcher
	•	Uses global ammo pool

2. Laser Weapon
	•	Type: Close range
	•	Damage: defined per weapon
	•	Ammo cost: none

⸻

B. Defensive Equipment
3. Armor
	•	Grants Armor HP for ONE combat
	•	Armor absorbs damage:
	•	After shield
	•	Before hull
	•	Armor does NOT increase hull HP
	•	Fully restored at the start of each combat if equipped

4. Shield (not starting equipment)
Shield rules:
	•	Works for ONE TURN ONLY
	•	Resets every combat
	•	Absorbs damage BEFORE armor

Shield types:
	•	Magnetic Shield
	•	Absorbs 25 damage
	•	Long range only
	•	Kinetic Shield
	•	Absorbs 30 damage
	•	Close range only

⸻

5. DAMAGE RESOLUTION ORDER

When damage is dealt:
	1.	Shield absorbs damage (if active this turn)
	2.	Remaining damage goes to Armor
	3.	Remaining damage goes to Hull

Shield and armor cannot absorb more than their current value.

⸻

6. COMBAT STRUCTURE

6.1 Turn Order

Each combat follows this fixed range sequence:

Turn 1: Long
Turn 2: Close
Turn 3: Close
Turn 4: Close
Turn 5: Long

	•	Maximum of 5 turns per combat
	•	Combat ends immediately if either ship is destroyed

⸻

6.2 Attack Resolution Rule (VERY IMPORTANT)

On EACH turn:
	1.	Player attacks first
	2.	Enemy HP is reduced
	3.	If enemy HP ≤ 0:
	•	Enemy does NOT attack
	•	Combat proceeds to next turn or ends
	4.	If enemy survives:
	•	Enemy attacks

This rule applies to ALL turns and ranges.
There is NO simultaneous damage.

⸻

7. STARTING EQUIPMENT

Player starts with the following equipment in inventory:
	•	40cm Missile Launcher
	•	Long range
	•	Damage: 40
	•	Ammo cost: 1
	•	10MW Laser ×2
	•	Close range
	•	Damage: 10 each
	•	No ammo cost
	•	Armor (60)
	•	Grants 60 armor per combat

No shield at game start.

⸻

8. ENEMY DESIGN (ACT 1 SAMPLE)

Enemy HP is intentionally LOW to reward clean kills.

Enemy 1 (Small)
	•	HP: 40
	•	Long: none
	•	Close: 10 damage

Enemy 2 (Small)
	•	HP: 60
	•	Long: 30 damage (once, first long turn only)
	•	Close: 20 damage

Enemy 3 (Mini-Boss)
	•	HP: 90
	•	Long: none
	•	Close: 20 damage

Enemy 4 (Small)
	•	HP: 80
	•	Long: 30 damage
	•	Close: 10 damage

Elite Enemy
	•	HP: 130
	•	Long: 40 damage
	•	Close: 30 damage

Enemies always attack if alive and if they have a weapon valid for the current range.

⸻

9. REWARDS

After winning a battle, choose ONE:

A) Choose 1 equipment from 3 options
OR
B) Gain +1 Ammo

If the player draws or loses:
	•	Game ends
	•	No reward

⸻

10. SAMPLE EQUIPMENT POOL (ACT 1)

Possible rewards include:
	•	50cm Missile Launcher
	•	Long
	•	Damage: 50
	•	Ammo cost: 1
	•	Dual 40cm Missile Launcher
	•	Long
	•	Damage: 80
	•	Ammo cost: 2
	•	15MW Pulse Laser
	•	Close
	•	Damage: 15
	•	25MW Burst Laser
	•	Close
	•	Damage: 25
	•	Works ONCE per combat
	•	Armor (60)
	•	Magnetic Shield
	•	Absorb: 25
	•	Long only
	•	Kinetic Shield
	•	Absorb: 30
	•	Close only

⸻

11. PROGRESSION STRUCTURE (SIMPLIFIED)
	•	Fixed linear sequence of battles
	•	No events
	•	No shops
	•	No randomness in combat
	•	No mid-range combat
	•	Focus on clarity and balance

⸻

12. DESIGN GOALS (FOR CODER)
	•	Deterministic output
	•	Clear per-turn logs
	•	Easy-to-reason damage flow
	•	Minimal state tracking
	•	No hidden rules

⸻

END OF SPECIFICATION

