// Player Initial Settings
export const PLAYER_INITIAL = {
  max_hull: 200,
  hull: 200,
  max_slots: 6,
};

// Player Starting Inventory (item names)
export const STARTING_INVENTORY = [
  "🚀ランス",
  "🚀ランス",
  "⚡クロウ",
  "⚡クロウ",
  "🛡️装甲板",
  "🗑️スクラップ",
  "🗑️スクラップ",
];

// ACT Scaling Tables
// Index 0 = ACT 1, Index 1 = ACT 2, Index 2 = ACT 3
export const ACT_SCALE = [1, 2, 3];        // Enemy stats scaling
export const ACT_ATTACK_SCALE = [1, 1.4, 2.0];  // Enemy attack scaling

// Boss Reward Options
export const BOSS_REWARD_KEYS = [
  'expansion',
  'reinforcement',
  'boarding',
  'skirmish',
  'logistics',
  'doctrine',
];
