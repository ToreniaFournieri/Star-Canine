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
| Expansion | 拡張|
| Reinforcement | 耐久 |
| Logistics | 攻勢 |
| REGEN | 自己修復 |
| DEGEN | 腐食 |
| EXPLOSIVE | 自爆 |
| DORMANT | 起動待機 |
| OVERLOAD | 過負荷 |
| GATE | 防壁 |
| COUNTER(LONG) | 遠距離反撃 |

SKILL DESCRIPTION
| Skill Key | Japanese Description | Logic / 効果 |
| :--- | :--- | :--- |
| REGEN | 毎ターン、耐久値を回復する。 | ターン毎に耐久値+Value |
| DEGEN | 毎ターン、自己侵食により耐久値が減少する。 | ターン毎に耐久値-Value |
| EXPLOSIVE | 第4ターンに超高火力の自爆攻撃を行い、自身は撃破される。 | T4で威力+Valueの攻撃後、HPが0になる |
| DORMANT | 起動待機中。第4ターン以降、攻撃力が大幅に上昇する。 | T4以降、攻撃威力 x Value |
| OVERLOAD | 過負荷状態。第4ターン以降、リミッターを解除し火力が上昇する。 | T4以降、攻撃威力 x Value |
| GATE | ターン終了時、一定値までシールドを強制再生成する。 | 終了時、シールド < ValueならValueに固定 |
| COUNTER(LONG) | 遠距離攻撃に対し、装備中の遠距離兵装の数に応じた反撃を行う。 | LONG攻撃時、(装備LONG数 x Value)の反撃 |

ABILITY
| Ability Key | Japanese Description | Logic / 効果 |
| :--- | :--- | :--- |
| +X SHIELD | 戦闘開始時、シールド値を加算する。 | 開始時、Battle_Shield + X |
| +X ALL MID | すべての中距離兵装の威力を加算する。 | 全MIDスロットの威力 + X |
| +X damage per combat | 戦闘終了後、この装備の威力が永久的に上昇する。 | 戦闘毎にPower_Stat + X (永続) |
| Simultaneous | 敵の撃破判定をターン終了時まで遅延させ、相打ちを可能にする。 | 敵HP0でも敵の攻撃を最後まで受ける |
| DISABLE_HULL_REPAIR | 修理機能を停止する代わりに、他の出力を強化する。 | 戦闘後のHULL修理を0にする |
| Simultaneous | 同時攻撃。敵を撃破してもそのターンの反撃を受ける。 | 相互撃破を許可する |

BONUS 
| Bonus Key | Japanese Description | Effect / 効果 |
| :--- | :--- | :--- |
| Expansion | 船体スロットを2つ拡張する。 | max_slots + 2 |
| Reinforcement | スロットを1つ拡張し、最大耐久値を80上昇させる。 | max_slots + 1 / max_hull + 80 |
| Logistics | 兵站支援。毎回の戦闘前に「🚀 ランス」を1つ無償支給する。 | 戦闘準備フェーズで🚀ランスを補充 |
