// Stage Schema
export const ST_SCHEMA = ['rank', 'difficulty'];

// Stage Layout Data
// [rank, difficulty]
// Rank: 'N' = Normal, 'E' = Elite, 'B' = Boss, 'D' = Dock
// This layout repeats for each ACT (12 stages per ACT, 3 ACTs total = 36 stages)
export const ST = [
  ['N', 1],
  ['N', 2],
  ['N', 3],
  ['E', 8],
  ['N', 4],
  ['D', 0],
  ['N', 5],
  ['E', 9],
  ['N', 6],
  ['N', 7],
  ['D', 0],
  ['B', 10],
];

// Number of stages per ACT
export const STAGES_PER_ACT = 12;

// Total number of ACTs
export const TOTAL_ACTS = 3;
