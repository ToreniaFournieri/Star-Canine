// Enemy Ranks (shorthand)
export const R = { N: 'NORMAL', E: 'ELITE', B: 'BOSS' };

// Enemy Skills
export const SK = {
  GATE: { id: 'GATE',     name: '防壁',   desc: "ターン終了時、シールドを指定値まで再生成する。" },
  REG:  { id: 'REGEN',    name: '自己修復', desc: "毎ターン、耐久値を回復する。" },
  DEG:  { id: 'DEGEN',    name: '腐食',   desc: "毎ターン、耐久値が減少する。" },
  EXP:  { id: 'EXPLOSIVE', name: '自爆',  desc: "第4ターンに固定ダメージを相手に与える自爆攻撃を行い、自壊する。" },
  OVR:  { id: 'OVERLOAD', name: '過負荷', desc: "第4ターン以降、攻撃ダメージが上昇する。" },
  DOR:  { id: 'DORMANT',  name: '休眠',   desc: "第4ターン以降、攻撃を停止する。" },
  CL:   { id: 'COUNTER_LONG', name: '迎撃', desc: "長距離攻撃を受けた際、長距離武装数×指定値で反撃する。" },
};

// Enemy Schema
export const EN_SCHEMA = ['difficulty', 'name', 'hull', 'shield', 'rank', 'attacks', 'skills'];

// Enemy Data
// [difficulty, name, hull, shield, rank, attacks, skills]
export const EN = [
  [1, "スカミッシャー", 40, 0, R.N, [0, 0, 10], []],
  [2, "ドリフター", 51, 5, R.N, [20, 0, 10], []],
  [3, "自己修復機", 60, 10, R.N, [0, 10, 15], [[SK.REG, 8]]],
  [4, "ゾンビ", 25, 90, R.N, [0, 0, 20], [[SK.DEG, 5]]],
  [5, "遺物哨戒機", 80, 30, R.N, [30, 30, 0], [[SK.DOR, 0]]],
  [6, "特攻フリゲート", 20, 75, R.N, [0, 0, 0], [[SK.EXP, 180]]],
  [7, "重装巡洋艦", 80, 80, R.N, [5, 10, 10], [[SK.GATE, 5]]],
  [8, "シールド・ゲート", 100, 20, R.E, [10, 10, 5], [[SK.GATE, 20]]],
  [9, "オーバーロード・エンフォーサー", 120, 30, R.E, [20, 20, 15], [[SK.OVR, 1.5]]],
  [10, "セレスティアル・リーパー", 140, 60, R.B, [40, 20, 25], [[SK.CL, 25]]],
];
