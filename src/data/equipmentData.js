// Equipment Types
export const T = {
  L: { id: 'LONG',   name: '長' },
  M: { id: 'MID',    name: '中' },
  C: { id: 'CLOSE',  name: '近' },
  S: { id: 'SHIELD', name: '盾' },
  H: { id: 'HULL',   name: '回' },
  X: { id: 'MODULE', name: '機' },
};

// Equipment Abilities
export const AB = {
  SH:  { id: 'SHIELD',      name: 'シールド加算', format: (v) => `+${v}シールド` },
  AM:  { id: 'ALL_MID',     name: '中距離強化',   format: (v) => `全中距離武装+${v}` },
  SIM: { id: 'SIMULTANEOUS', name: '同時攻撃',    format: () => '同時攻撃' },
  NR:  { id: 'NO_REPAIR',   name: '修復無効',     format: () => '修復無効' },
  LS:  { id: 'LIFE_STEAL',  name: '生命吸収',     format: (v) => `生命吸収(${v ? Math.round(v * 100) : 50}%)` },
  GR:  { id: 'GROWTH',      name: '成長',         format: (v) => `成長+${v}` },
  SB:  { id: 'SHIELD_BREAK', name: 'シールド破壊', format: (v) => `シールド破壊(${v ? Math.round(v * 100) : 50}%)` },
  BF:  { id: 'BACKFIRE',    name: '反動',         format: (v) => `反動${v}` },
  MV:  { id: 'MAVERICK',    name: '一匹狼',     format: () => 'MIDがこの1機のみの場合威力倍増' },
  OVERDRIVE: { id: 'OVERDRIVE', name: '緊急過負荷', format: () => '緊急過負荷(HP-30,シールド+80)' },
  CAPACITOR: { id: 'CAPACITOR', name: 'キャパシタ蓄積', format: () => 'シールド変換30%' },
  COMPACT: { id: 'COMPACT', name: '圧縮設計', format: () => 'スロット圧縮(自身除く)' },
  BERSERKER: { id: 'BERSERKER', name: 'バーサーカー', format: () => 'HP半分以下で威力×1.3' },
};

// Equipment Schema
export const EQ_SCHEMA = ['slots', 'name', 'power', 'type', 'rarity', 'disposable', 'mult', 'ability'];

// Equipment Data
// [slots, name, power, type, rarity, disposable, mult, ability]
export const EQ = [
  // === SCRAP (Dock currency) ===
  [1, "🗑️スクラップ", 0, T.X, 0, 0, null, null],

  // === LONG (Missiles) ===
  [1, "🚀ランス", 40, T.L, 1, 1, null, null],
  [2, "🚀🛡️インターセプター", 60, T.L, 1, 1, null, [AB.SH, 25]],
  [2, "🚀🚀❗ハープーン", 90, T.L, 1, 1, null, [AB.BF, 10]],
  [2, "🚀🚀ジャベリン", 70, T.L, 1, 1, null, null],
  [1, "🚀シューティングスター", 70, T.L, 2, 1, null, null],
  [2, "🚀🚀❗サイレント", 120, T.L, 2, 1, [AB.BF, 20], null],
  [3, "🚀🚀🚀❗️MOP", 185, T.L, 2, 1, [AB.BF, 30], null],
  [1, "🔫クァンタム・ディスプレーサー", 30, T.L, 3, 0, [T.M, 1.1], null],

  // === MID (Fighters) ===
  [1, "✈️ドローン", 15, T.M, 1, 0, null, null],
  [1, "✈️🛡️ディフェンダー", 10, T.M, 1, 0, [AB.SH, 10], null],
  [1, "✈️💥キラードローン", 25, T.M, 1, 1, null, null],
  [1, "✈️⤴️ルーキー・ファイター", 3, T.M, 1, 0, null, [AB.GR, 1]],
  [1, "✈️🐺マーバリック", 12, T.M, 1, 0, null, [AB.MV]],
  [1, "✈️🚀護衛機", 12, T.M, 1, 0, [T.L, 1.1], null],
  [1, "✈️ウイング", 22, T.M, 2, 0, [T.H, 1.1], null],
  [1, "✈️🔹ブルーウルフ", 33, T.M, 3, 0, [T.S, 1.1], null],
  [1, "✈️🔺スクアドラル", 12, T.M, 2, 0, null, [AB.AM, 10]],

  // === CLOSE (Beams) ===
  [1, "⚡クロウ", 15, T.C, 1, 0, null, null],
  [1, "⚡💥ソウル", 30, T.C, 1, 1, null, null],
  [1, "⚡🩸ファング", 10, T.C, 1, 0, null, [AB.LS, 1.0]],
  [1, "⚡🛡️アイアン・ビーム", 12, T.C, 1, 0, null, [AB.SH, 8]],
  [1, "⚡🚀トラッキング・ビーム", 13, T.C, 1, 0, [T.L, 1.1], null],
  [1, "⚡🔺カジェル", 16, T.C, 2, 0, [T.C, 1.2], null],
  [1, "⚡🪓シールド・ブレイカー", 2, T.C, 2, 0, null, [AB.SB, 0.35]],
  [1, "⚡🟫トールハンマー", 30, T.C, 3, 0, [T.H, 1.2], null],

  // === SHIELD ===
  [1, "🛡️装甲板", 20, T.S, 1, 0, null, null],
  [1, "🛡️⚠️シェル", 28, T.S, 1, 0, [T.L, 0.8], null],
  [1, "🛡️💥エフェメラ・シールド", 40, T.S, 1, 1, null, null],
  [1, "🛡️🛡️イージス", 35, T.S, 2, 0, null, null],
  [1, "🛡️🔋キャパシタ", 20, T.S, 2, 0, null, [AB.CAPACITOR]],
  [1, "🛡️⤴️バリアー", 23, T.S, 3, 0, null, [AB.GR, 1]],

  // === HULL ===
  [1, "🔧💥ダメージコントロール", 40, T.H, 1, 1, null, null],
  [1, "🔧自動修理装置", 15, T.H, 1, 0, null, null],

  // === MODULE ===
  [1, "🟫🔺傾斜防壁", 0, T.X, 1, 0, [T.S, 1.67], null],
  [1, "💉緊急防壁", 0, T.X, 2, 0, null, [AB.OVERDRIVE]],
  [2, "⚙️設備最適化", 0, T.X, 2, 0, null, [AB.COMPACT]],
  [1, "🔥バーサーカーコア", 0, T.X, 3, 0, null, [AB.BERSERKER]],
  [1, "🔥🔺弾頭最適化装置", 0, T.X, 3, 0, [T.L, 1.5], null],
  [1, "🏗️🔺スウォーム・ハンガー", 0, T.X, 3, 0, [T.M, 1.5], [AB.NR]],
  [1, "💎🔺プリズマティック・フォーカス", 0, T.X, 3, 0, [T.C, 1.5], [AB.SIM]]
];
