/**
 * STAR CANINE: Japanese Localization Master (v0.8.2)
 * Integration: Use logic keys (English) to look up display strings (Japanese).
 */

const LOCALIZATION = {
  // Navigation & Nodes
  nodes: {
    combat: { label: "戦闘", icon: "⚔️" },
    elite: { label: "精鋭", icon: "⚔️⭐️" },
    dock: { label: "ドック", icon: "⚓️" },
    boss: { label: "ボス", icon: "💀" }
  },

  // Stats & Ship Data
  stats: {
    hull: "耐久値",
    shield: "シールド",
    slots: "スロット",
    inventory: "倉庫",
    equipped: "装備中",
    power: "威力",
    rarity: "レア度",
    stage: "第 {n} ステージ"
  },

  // Range Categories
  ranges: {
    LONG: "遠距離",
    MID: "中距離",
    CLOSE: "近距離"
  },

  // UI Actions
  actions: {
    engage: "戦闘開始",
    continue: "次へ進む",
    claim: "報酬を受け取る",
    repair: "修理を実行",
    restart: "再起動",
    launch: "発進",
    back: "戻る"
  },

  // Combat Outcomes
  outcomes: {
    victory: "完全勝利",
    defeat: "通信途絶（敗北）",
    draw: "引き分け",
    clear: "任務完了"
  },

  // Equipment & Enemy Names Mapping
  names: {
    // LONG
    "🚀 Lance": "🚀 ランス",
    "🚀 Meteor": "🚀 メテオ",
    "🚀🛡️ Interceptor": "🚀🛡️ インターセプター",
    "🚀 Harpoon": "🚀 ハープーン",
    "🚀⚠️ Isolation": "🚀⚠️ アイソレーション",
    "🚀🔺 Javelin": "🚀🔺 ジャベリン",
    "🚀🔺 Gambit": "🚀🔺 ギャンビット",
    "🔫 Quantum Displacer": "🔫 クォンタム・ディスプレーサー",
    "🔥🔺 Warhead Optimizer": "🔥🔺 ウォーヘッド・オプティマイザー",
    // MID
    "✈️ Drones": "✈️ ドローン",
    "✈️⚠️ Scavenger": "✈️⚠️ スカベンジャー",
    "✈️🔺 Squadron": "✈️🔺 スクアドラ",
    "✈️⤴️ Rookie fighter": "✈️⤴️ ルーキーファイター",
    "✈️✈️ Blue Wolf": "✈️✈️ ブルーウルフ",
    "🛫🔺 Swarm Core": "🛫🔺 スウォーム・コア",
    "🏗️🔺 Swarm Hanger": "🏗️🔺 スウォーム・ハンガー",
    // CLOSE
    "⚡ Fang": "⚡ ファング",
    "⚡ Claw": "⚡ クロウ",
    "⚡⚠️ Static Blade": "⚡⚠️ スタティック・ブレード",
    "⚡️🛡️ Iron Beam": "⚡️🛡️ アイアン・ビーム",
    "⚡ Cudgel": "⚡ カジェル",
    "⚡️🔺 Boost laser": "⚡️🔺 ブースト・レーザー",
    "⚡💥 Burn soul": "⚡💥 バーンソウル",
    "💎🔺 Prismatic Focus": "💎🔺 プリズマティック・フォーカス",
    // OTHERS
    "🛡️ Plating": "🛡️ 外装プレート",
    "🛡️ Veil": "🛡️ ヴェール",
    "🛡️⚠️ Bulkhead": "🛡️⚠️ バルクヘッド",
    "🛡️💥 Ephemera shield": "🛡️💥 エフェメラ・シールド",
    "🛡️🛡️ Aegis": "🛡️🛡️ イージス",
    "🛡️🔺 Barrier": "🛡️🔺 バリアー",
    "🟫🔺 Double Shield": "🟫🔺 ダブルシールド",
    "🔧 Repairer": "🔧 リペアラー",
    "🔧🔧 Veteran Repairer": "🔧🔧 ベテラン・リペアラー",
    "♨️🔺 Recreational facility": "♨️🔺 娯楽施設",
    // ENEMIES
    "Skirmisher": "スカミッシャー",
    "Drifter": "ドリフター",
    "Self-Repairer": "自己修復機",
    "Zombie": "ゾンビシップ",
    "Relic Sentry": "遺物守護者",
    "Kamikaze Frigate": "特攻フリゲート",
    "Shield Gate": "シールド・ゲート",
    "Overload Enforcer": "オーバーロード・エンフォーサー",
    "Celestial Reaper": "セレスティアル・リーパー"
  },

  // Skills & Abilities Descriptions
  descriptions: {
    // Enemy Skills
    REGEN: "【自己修復】毎ターン、耐久値を回復する。",
    DEGEN: "【腐食】毎ターン、自己侵食により耐久値が減少する。",
    EXPLOSIVE: "【自爆】第4ターンに超高火力の自爆攻撃を行い、自身は撃破される。",
    DORMANT: "【起動待機】待機中。第4ターン以降、攻撃力が大幅に上昇する。",
    OVERLOAD: "【過負荷】過負荷状態。第4ターン以降、火力が上昇する。",
    GATE: "【防壁】ターン終了時、一定値までシールドを強制再生成する。",
    "COUNTER(LONG)": "【遠距離反撃】遠距離攻撃に対し、LONG兵装数に応じた反撃を行う。",
    // Equipment Abilities
    "+X SHIELD": "開始時、シールド値を加算する。",
    "+X ALL MID": "すべての中距離兵装の威力を加算する。",
    "+X damage per combat": "戦闘終了後、この装備の威力が永続的に上昇する。",
    "Simultaneous": "【同時攻撃】敵を撃破してもそのターンの反撃を受ける。",
    "DISABLE_HULL_REPAIR": "修理機能を停止する代わりに、他の出力を強化する。",
    // Boss Bonuses
    "Expansion": "船体スロットを2つ拡張する。",
    "Reinforcement": "スロット+1、最大耐久値を80上昇させる。",
    "Logistics": "兵站支援。毎回の戦闘前に「🚀 ランス」を1つ無償支給する。"
  },

  // Story Text
  story: {
    intro: `機体ID: STAR CANINE

「私よ。K9（ケーナイン）は墜落した。
ソーラーベアにこの星を奪われたわ。
私も捕まったみたい。
お願い…死なないで。」

> 通信途絶。
> 目的地：惑星K9へ進路固定。`,
    
    ending: `惑星K9 到着。
ライカを救出した。
「…戻ってきてくれたのね。」`
  }
};
