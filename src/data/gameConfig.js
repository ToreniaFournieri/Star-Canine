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
export const ACT_SCALE = [1, 1.5, 2.25];        // Enemy stats scaling
export const ACT_ATTACK_SCALE = [1, 1.3, 1.7];  // Enemy attack scaling

// Boss Reward Options
export const BOSS_REWARD_KEYS = [
  'expansion',
  'reinforcement',
  'boarding',
  'skirmish',
  'logistics',
  'doctrine',
];
