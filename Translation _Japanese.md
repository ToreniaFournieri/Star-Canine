/**
 * STAR CANINE: Japanese Localization Mapping (from v0.8.2)
 * Usage: Use 'en' keys for logic, 'jp' values for the UI.
 */

```
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
    equipped: "装備済み",
    power: "威力",
    rarity: "レア度"
  },

  // Range Categories
  ranges: {
    LONG: "遠距離",
    MID: "中距離",
    CLOSE: "近距離"
  },

  // Enemy Skills (logic stays English, UI displays Japanese)
  skills: {
    REGEN: "自己修復",
    DEGEN: "腐食",
    EXPLOSIVE: "自爆兵装",
    OVERLOAD: "過負荷",
    DORMANT: "再起動待機",
    GATE: "防壁",
    "COUNTER(LONG)": "遠距離反撃"
  },

  // UI Actions
  actions: {
    engage: "戦闘開始",
    continue: "次へ進む",
    claim: "報酬を受け取る",
    repair: "修理を実行",
    restart: "再起動",
    launch: "発進"
  },

  // Combat Outcomes
  outcomes: {
    victory: "完全勝利",
    defeat: "通信途絶（敗北）",
    draw: "引き分け",
    clear: "任務完了"
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

/**
 * PRO-TIP: Implementation Example
 * Instead of: <div>Stage {stg}</div>
 * Use: <div>第 {stg} ステージ</div>
 */
```

LONG

| English Key | Japanese Name |
| :--- | :--- |
| 🚀 Lance | 🚀 ランス |
| 🚀 Meteor | 🚀 メテオ |
| 🚀🛡️ Interceptor | 🚀🛡️ インターセプター |
| 🚀 Harpoon | 🚀 ハープーン |
| 🚀⚠️ Isolation | 🚀⚠️ アイソレーション |
| 🚀🔺 Javelin | 🚀🔺 ジャベリン |
| 🚀🔺 Gambit | 🚀🔺 ギャンビット |
| 🔫 Quantum Displacer | 🔫 クォンタム・ディスプレーサー |
| 🔥🔺 Warhead Optimizer | 🔥🔺 ウォーヘッド・オプティマイザー |


MID
| English Key | Japanese Name |
| :--- | :--- |
| ✈️ Drones | ✈️ ドローン |
| ✈️⚠️ Scavenger | ✈️⚠️ スカベンジャー |
| ✈️🔺 Squadron | ✈️🔺 スクアドラ |
| ✈️⤴️ Rookie fighter | ✈️⤴️ ルーキーファイター |
| ✈️✈️ Blue Wolf | ✈️✈️ ブルーウルフ |
| 🛫🔺 Swarm Core | 🛫🔺 スウォーム・コア |
| 🏗️🔺 Swarm Hanger | 🏗️🔺 スウォーム・ハンガー |

CLOSE
| English Key | Japanese Name |
| :--- | :--- |
| ⚡ Fang | ⚡ ファング |
| ⚡ Claw | ⚡ クロウ |
| ⚡⚠️ Static Blade | ⚡⚠️ スタティック・ブレード |
| ⚡️🛡️ Iron Beam | ⚡️🛡️ アイアン・ビーム |
| ⚡ Cudgel | ⚡ カジェル |
| ⚡️🔺 Boost laser | ⚡️🔺 ブースト・レーザー |
| ⚡💥 Burn soul | ⚡💥 バーンソウル |
| 💎🔺 Prismatic Focus | 💎🔺 プリズマティック・フォーカス |


OTHERS
| English Key | Japanese Name |
| :--- | :--- |
| 🛡️ Plating | 🛡️ 外装プレート |
| 🛡️ Veil | 🛡️ ヴェール |
| 🛡️⚠️ Bulkhead | 🛡️⚠️ バルクヘッド |
| 🛡️💥 Ephemera shield | 🛡️💥 エフェメラ・シールド |
| 🛡️🛡️ Aegis | 🛡️🛡️ イージス |
| 🛡️🔺 Barrier | 🛡️🔺 バリアー |
| 🟫🔺 Double Shield | 🟫🔺 ダブルシールド |
| 🔧 Repairer | 🔧 リペアラー |
| 🔧🔧 Veteran Repairer | 🔧🔧 ベテラン・リペアラー |
| ♨️🔺 Recreational facility | ♨️🔺 娯楽施設 |


ENEMY
| English Key | Japanese Name |
| :--- | :--- |
| Skirmisher | スカミッシャー |
| Drifter | ドリフター |
| Self-Repairer | 自己修復機 |
| Zombie | ゾンビシップ |
| Relic Sentry | 遺物守護者 |
| Kamikaze Frigate | 特攻フリゲート |
| Shield Gate | シールド・ゲート |
| Overload Enforcer | オーバーロード・エンフォーサー |
| Celestial Reaper | セレスティアル・リーパー |

BOSS REWARD, SKILL
| English Key | Japanese Name |
| :--- | :--- |
| Expansion | スロット拡張 (+2) |
| Reinforcement | 装甲強化 (スロット+1 / 耐久+80) |
| Logistics | 標準支給プロトコル (戦闘毎に🚀ランス) |
| REGEN | 自己修復 |
| DEGEN | 腐食 |
| EXPLOSIVE | 自爆 |
| DORMANT | 起動待機 |
| OVERLOAD | 過負荷 |
| GATE | 防壁 |
| COUNTER(LONG) | 遠距離反撃 |
