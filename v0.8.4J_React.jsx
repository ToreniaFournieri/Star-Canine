import React, { useState, useEffect } from ‘react’;

// === CSV PARSER ===
const parseCSV = (csv) => {
const lines = csv.trim().split(’\n’).map(line => line.trim()).filter(line => line);
if (lines.length < 2) return [];
const headers = lines[0].split(’,’).map(h => h.trim());
return lines.slice(1).map(line => {
const values = line.split(’,’);
const obj = {};
headers.forEach((header, i) => {
let val = values[i] ? values[i].trim() : “”;
if (val.toLowerCase() === ‘true’) obj[header] = true;
else if (val.toLowerCase() === ‘false’) obj[header] = false;
else if (val === ‘0’ || val === ‘’) {
obj[header] = (header === ‘name’ || header === ‘eq_type’ || header === ‘ability’ || header === ‘mult_target’ || header === ‘skill’) ? val : 0;
}
else if (!isNaN(val)) obj[header] = Number(val);
else obj[header] = val;
});
return obj;
});
};

// === DATA (Japanese) ===
const EQ_CSV = `slots,name,power_stat,eq_type,rarity,disposable,mult_target,mult_power,ability 1,🚀 ランス,40,LONG,0,true,none,0,none 1,🚀 メテオ,45,LONG,1,true,none,0,none 2,🚀🛡️ インターセプター,50,LONG,1,true,none,0,+10 SHIELD 2,🚀 ハープーン,66,LONG,1,true,none,0,none 2,🚀⚠️ アイソレーション,75,LONG,1,true,LONG,0.9,none 2,🚀🔺 ジャベリン,39,LONG,1,true,LONG,1.2,none 2,🚀🔺 ギャンビット,55,LONG,2,true,LONG,1.3,none 1,🔫 クァンタム・ディスプレーサー,40,LONG,3,false,CLOSE,0.5,none 2,🔥🔺 弾頭最適化装置,0,MODULE,3,false,LONG,2,none 1,✈️ ドローン,12,MID,1,false,none,0,none 1,✈️⚠️ スカベンジャー,20,MID,1,false,MID,0.9,none 1,✈️🔺 スクアドラル,8,MID,1,false,MID,1.2,none 1,✈️⤴️ ルーキー・ファイター,5,MID,1,false,none,0,+2 damage per combat 1,✈️✈️ ブルーウルフ,20,MID,2,false,none,0,none 1,🛫🔺 スウォーム・コア,0,MODULE,3,false,LONG,0.5,+10 ALL MID 1,🏗️🔺 スウォーム・ハンガー,0,MODULE,3,false,MID,2,DISABLE_HULL_REPAIR 1,⚡ クロウ,10,CLOSE,0,false,none,0,none 1,⚡🩸 ファング,8,CLOSE,1,false,none,0,LIFE-STEAL 1,⚡⚠️ スタティック・ブレード,22,CLOSE,1,false,CLOSE,0.9,none 1,⚡️🛡️ アイアン・ビーム,5,CLOSE,2,false,none,0,+10 SHIELD 1,⚡ カジェル,25,CLOSE,2,false,none,0,none 1,⚡️🔺 ブースト・レーザー,10,CLOSE,1,false,CLOSE,1.2,none 1,⚡💥 バーン・ソウル,40,CLOSE,2,true,none,0,none 1,💎🔺 プリズマティック・フォーカス,0,MODULE,3,false,CLOSE,2,Simultaneous 1,🛡️ 装甲板,14,SHIELD,0,false,none,0,none 1,🛡️ ヴェール,17,SHIELD,1,false,none,0,none 1,🛡️⚠️ バルクヘッド,25,SHIELD,1,false,SHIELD,0.9,none 1,🛡️💥 エフェメラ・シールド,33,SHIELD,1,true,none,0,none 1,🛡️🛡️ イージス,30,SHIELD,2,false,none,0,none 1,🛡️🔺 バリアー,13,SHIELD,2,false,SHIELD,1.2,none 1,🟫🔺 ダブルシールド,0,MODULE,3,false,SHIELD,2,none 1,🔧 リペアラー,10,HULL,1,false,none,0,none 1,🔧🔧 ベテラン・リペアラー,15,HULL,2,false,none,0,none 1,♨️🔺 娯楽施設,2,MODULE,2,false,HULL,2,none`;

const EN_CSV = `difficulty,name,hull,shield,rank,attack_LONG,attack_MID,attack_CLOSE,skill,skill_value 1,スカミッシャー,30,0,NORMAL,0,0,10,none,0 2,ドリフター,31,5,NORMAL,20,0,10,GATE,5 3,自己修復機,40,10,NORMAL,0,15,5,REGEN,8 4,ゾンビシップ,25,80,NORMAL,5,20,0,DEGEN,5 5,遺物守護者,60,30,NORMAL,30,30,0,DORMANT,0 5,特攻フリゲート,10,100,NORMAL,0,0,0,EXPLOSIVE,60 6,シールド・ゲート,55,20,ELITE,15,15,20,GATE,20 8,オーバーロード・エンフォーサー,70,30,ELITE,20,20,25,OVERLOAD,2.0 9,セレスティアル・リーパー,100,60,BOSS,40,20,35,COUNTER(LONG),10`;

const ST_CSV = `stage,type,difficulty,rank 1,combat,1,NORMAL 2,combat,2,NORMAL 3,combat,6,ELITE 4,dock,0, 5,combat,3,NORMAL 6,combat,4,NORMAL 7,combat,8,ELITE 8,combat,5,NORMAL 9,dock,0, 10,combat,9,BOSS`;

const EQ = parseCSV(EQ_CSV);
const EN = parseCSV(EN_CSV);
const ST = parseCSV(ST_CSV);

// === SKILL DESCRIPTIONS ===
const SKILL_DESC = {
REGEN: “【自己修復】毎ターン開始時、耐久値を回復する。”,
DEGEN: “【腐食】毎ターン開始時、耐久値が減少する。”,
EXPLOSIVE: “【自爆】第4ターン開始時、固定ダメージの自爆攻撃を行い、自身は撃破される。”,
DORMANT: “【待機】第4ターン開始時以降、攻撃ダメージが上昇する。”,
OVERLOAD: “【過負荷】第4ターン開始時以降、攻撃ダメージが上昇する。”,
GATE: “【防壁】ターン終了時、シールドを指定値まで再生成する。”,
“COUNTER(LONG)”: “【迎撃】長距離攻撃を受けた際、装備中の長距離武装数に応じて反撃する。”,
none: “”
};

const ABILITY_DESC = {
none: “”,
“+10 SHIELD”: “戦闘開始時、シールド+10。”,
“+10 ALL MID”: “中距離武装のダメージ+10。”,
Simultaneous: “【同時攻撃】撃破判定を攻撃直後ではなく、ターン終了時に行う。”,
DISABLE_HULL_REPAIR: “【修復無効】戦闘終了後の耐久値回復を無効化する。”,
“LIFE-STEAL”: “【生命吸収】敵シールドが0の状態でダメージを与えた場合、耐久値を回復する。”,
“+2 damage per combat”: “【成長】戦闘終了ごとにダメージが永久に+2される。”
};

// === HELPERS ===
const mkItem = (name) => {
const base = EQ.find(e => e.name === name);
return base ? { …base, id: Math.random().toString(36).substr(2, 9) } : null;
};

const getAct = (stage) => Math.floor((stage - 1) / 10) + 1;
const getStageInAct = (stage) => ((stage - 1) % 10) + 1;
const getActScale = (act) => act === 1 ? 1 : act === 2 ? 1.5 : 2;

const dmg = (d, s, h) => {
const sd = Math.min(s, d);
return {
shield: Math.max(0, s - d),
hull: Math.max(0, h - (d - sd))
};
};

const parseAbility = (str) => {
if (!str || str === ‘none’) return null;
if (str === ‘Simultaneous’) return { type: ‘Simultaneous’ };
if (str === ‘DISABLE_HULL_REPAIR’) return { type: ‘No Repair’ };
if (str === ‘LIFE-STEAL’) return { type: ‘LIFE-STEAL’ };
let m = str.match(/+(\d+)\s+SHIELD/);
if (m) return { type: ‘SHIELD’, value: Number(m[1]) };
m = str.match(/+(\d+)\s+ALL\s+MID/);
if (m) return { type: ‘ALL MID’, value: Number(m[1]) };
m = str.match(/+(\d+)\s+damage per combat/);
if (m) return { type: ‘damage per combat’, value: Number(m[1]) };
return null;
};

const translateEqType = (type) => {
const map = { LONG: ‘長距離武装’, MID: ‘中距離武装’, CLOSE: ‘近距離武装’, SHIELD: ‘シールド’, HULL: ‘耐久補助’, MODULE: ‘モジュール’ };
return map[type] || type;
};

const translateRange = (range) => {
const map = { LONG: ‘長距離’, MID: ‘中距離’, CLOSE: ‘近距離’ };
return map[range] || range;
};

const translateRank = (rank) => {
const map = { NORMAL: ‘通常’, ELITE: ‘エリート’, BOSS: ‘ボス’ };
return map[rank] || rank;
};

// === MAIN ===
export default function Game() {
const getInitialPlayer = () => ({
max_hull: 200,
hull: 200,
max_slots: 6,
inventory: [mkItem(‘🚀 ランス’), mkItem(‘🚀 ランス’), mkItem(‘⚡ クロウ’), mkItem(‘⚡ クロウ’), mkItem(‘🛡️ 装甲板’)],
equipped: [],
logistics: false
});

const [scene, setScene] = useState(‘start’);
const [stage, setStage] = useState(1);
const [player, setPlayer] = useState(getInitialPlayer());

const adv = (s) => { setStage(p => p + 1); setScene(s); };

const restart = () => {
setStage(1);
setPlayer(getInitialPlayer());
setScene(‘start’);
};

const scenes = {
start: <Start onStart={() => setScene(‘main’)} />,
main: <Main player={player} stage={stage} setScene={setScene} />,
combat: <Combat player={player} setPlayer={setPlayer} stage={stage} onExit={setScene} adv={adv} />,
reward: <Reward player={player} setPlayer={setPlayer} stage={stage} adv={adv} />,
dock: <Dock player={player} setPlayer={setPlayer} adv={adv} />,
end: <End player={player} stage={stage} onRestart={restart} />
};

return <div className="min-h-screen bg-black text-green-400 font-mono p-4">{scenes[scene]}</div>;
}

// === SCENES ===
function Start({ onStart }) {
return (
<div className="max-w-4xl mx-auto">
<pre className="text-xs mb-6 whitespace-pre-wrap">{`> 遭難信号を受信。

> 送信元: LAIKA

「私よ。
K9が陥落した。
ソーラー・ベアが惑星を奪った。
私も捕らえられた。
あなたがここにいなかったことは知っている。

どうか…死なないで。」

> 信号途絶。

> K9へ航路設定中。`}</pre>
> <button onClick={onStart} className="bg-green-700 px-4 py-2 hover:bg-green-600">発進</button>
> </div>
> );
> }

function Main({ player, stage, setScene }) {
useEffect(() => {
const s = ST.find(x => x.stage === getStageInAct(stage));
if (!s) { setScene(‘end’); return; }
setScene(s.type === ‘combat’ ? ‘combat’ : ‘dock’);
}, [stage, setScene]);
return <div className="text-center">ステージ {stage} 処理中…</div>;
}

function Combat({ player, setPlayer, stage, onExit, adv }) {
const [started, setStarted] = useState(false);
const [log, setLog] = useState([]);
const [result, setResult] = useState(null);
const [temp, setTemp] = useState(() => {
// Apply logistics bonus if active - add Lance every combat
if (player.logistics) {
const newPlayer = { …player };
newPlayer.inventory = […player.inventory, mkItem(‘🚀 ランス’)];
return newPlayer;
}
return { …player };
});

const act = getAct(stage);
const scale = getActScale(act);
const stData = ST.find(s => s.stage === getStageInAct(stage));
const enBase = EN.find(e => e.difficulty === stData.difficulty && e.rank === stData.rank);

if (!enBase) return <div>エラー: 敵艦データが見つかりません</div>;

const enemy = {
…enBase,
hull: Math.round(enBase.hull * scale),
shield: Math.round(enBase.shield * scale),
attack_LONG: Math.round(enBase.attack_LONG * scale),
attack_MID: Math.round(enBase.attack_MID * scale),
attack_CLOSE: Math.round(enBase.attack_CLOSE * scale)
};

const toggle = (item) => {
const isEq = temp.equipped.includes(item.id);
if (isEq) {
setTemp({ …temp, equipped: temp.equipped.filter(id => id !== item.id) });
} else {
const eqItems = temp.inventory.filter(i => temp.equipped.includes(i.id));
const used = eqItems.reduce((sum, i) => sum + i.slots, 0);
if (used + item.slots <= temp.max_slots) {
setTemp({ …temp, equipped: […temp.equipped, item.id] });
}
}
};

const run = () => {
const l = [];
const ranges = [‘LONG’, ‘MID’, ‘CLOSE’, ‘CLOSE’, ‘MID’, ‘LONG’];
const eq = temp.inventory.filter(i => temp.equipped.includes(i.id));

```
// Base stats
const bL = eq.filter(e => e.eq_type === 'LONG').reduce((s, e) => s + e.power_stat, 0);
const bM = eq.filter(e => e.eq_type === 'MID').reduce((s, e) => s + e.power_stat, 0);
const bC = eq.filter(e => e.eq_type === 'CLOSE').reduce((s, e) => s + e.power_stat, 0);
const bS = eq.filter(e => e.eq_type === 'SHIELD').reduce((s, e) => s + e.power_stat, 0);
const bH = eq.filter(e => e.eq_type === 'HULL').reduce((s, e) => s + e.power_stat, 0);

// Multipliers
const mult = { LONG: 1, MID: 1, CLOSE: 1, SHIELD: 1, HULL: 1 };
eq.forEach(e => {
  if (e.mult_target && e.mult_target !== 'none') {
    mult[e.mult_target] *= e.mult_power;
  }
});

let finalL = bL * mult.LONG;
let finalM = bM * mult.MID;
let finalC = bC * mult.CLOSE;
let finalS = bS * mult.SHIELD;
let finalH = bH * mult.HULL;

// Abilities
let simultaneous = false, noRepair = false;
eq.forEach(e => {
  const ab = parseAbility(e.ability);
  if (ab) {
    if (ab.type === 'SHIELD') finalS += ab.value;
    if (ab.type === 'ALL MID') finalM += ab.value;
    if (ab.type === 'Simultaneous') simultaneous = true;
    if (ab.type === 'No Repair') noRepair = true;
  }
});

const longCount = eq.filter(e => e.eq_type === 'LONG').length;

let pS = Math.round(finalS), pH = Math.round(temp.hull), eH = Math.round(enemy.hull), eS = Math.round(enemy.shield);

l.push(`=== ACT ${act} | ステージ ${stage} | ${enemy.name} ===`);
l.push(`自機: ${pH}HP | シールド:${pS}`);
l.push(`敵艦: ${eH}HP | シールド:${eS} | ${enemy.skill}${enemy.skill_value > 0 ? ':' + enemy.skill_value : ''}`);
l.push(`攻撃力: 長${Math.round(finalL)} 中${Math.round(finalM)} 近${Math.round(finalC)}`);
l.push('');

for (let turn = 0; turn < 6; turn++) {
  const r = ranges[turn];
  l.push(`--- T${turn + 1}: ${translateRange(r)} ---`);

  // Player attack
  const pDmg = r === 'LONG' ? finalL : r === 'MID' ? finalM : finalC;
  if (pDmg > 0) {
    const before = eH;
    
    // Check for LIFE-STEAL BEFORE applying damage (shield must be 0 before attack)
    const rangeItems = eq.filter(e => e.eq_type === r);
    const lifeStealItems = rangeItems.filter(e => {
      const ab = parseAbility(e.ability);
      return ab && ab.type === 'LIFE-STEAL';
    });
    
    const shouldLifeSteal = lifeStealItems.length > 0 && eS === 0;
    
    // Apply damage
    const res = dmg(pDmg, eS, eH);
    eS = Math.round(res.shield); 
    eH = Math.round(res.hull);
    l.push(`  自機攻撃: ${Math.round(pDmg)}ダメージ → ${before}HP → ${eH}HP`);
    
    // LIFE-STEAL: If enemy shield WAS 0 before the attack
    if (shouldLifeSteal) {
      let totalHeal = 0;
      lifeStealItems.forEach(item => {
        const itemMult = mult[r] || 1;
        const heal = Math.round(item.power_stat * itemMult);
        totalHeal += heal;
      });
      
      if (totalHeal > 0) {
        const beforeHeal = pH;
        pH = Math.min(temp.max_hull, Math.round(pH + totalHeal));
        l.push(`  生命吸収: +${totalHeal}HP → ${beforeHeal}HP → ${pH}HP`);
      }
    }
  } else {
    l.push(`  ${translateRange(r)}武装なし`);
  }

  // Counter
  if (r === 'LONG' && enemy.skill === 'COUNTER(LONG)' && longCount > 0) {
    const counter = Math.round(enemy.skill_value * longCount);
    const before = pH;
    const res = dmg(counter, pS, pH);
    pS = Math.round(res.shield); 
    pH = Math.round(res.hull);
    l.push(`  迎撃: ${counter}ダメージ (長距離武装${longCount}基) → ${before}HP → ${pH}HP`);
    if (pH <= 0) { l.push(`  自機撃破を確認。`); break; }
  }

  if (!simultaneous && eH <= 0) { l.push(`  敵艦撃破を確認。`); break; }

  // Enemy skill
  if (enemy.skill === 'REGEN' && enemy.skill_value > 0) {
    eH = Math.round(eH + enemy.skill_value);
    l.push(`  自己修復: +${enemy.skill_value}HP → ${eH}HP`);
  }
  if (enemy.skill === 'DEGEN' && enemy.skill_value > 0) {
    eH = Math.round(eH - enemy.skill_value);
    l.push(`  腐食: -${enemy.skill_value}HP → ${eH}HP`);
    if (eH <= 0) { l.push(`  敵艦撃破を確認（腐食）。`); break; }
  }

  // Enemy attack
  let eDmg = r === 'LONG' ? enemy.attack_LONG : r === 'MID' ? enemy.attack_MID : enemy.attack_CLOSE;
  
  if ((enemy.skill === 'OVERLOAD' || enemy.skill === 'DORMANT') && turn >= 3) {
    eDmg = Math.round(eDmg * enemy.skill_value);
    l.push(`  ${enemy.skill === 'OVERLOAD' ? '過負荷' : '待機'}: 攻撃力 x${enemy.skill_value}`);
  }

  if (enemy.skill === 'EXPLOSIVE' && turn === 3) {
    eDmg += enemy.skill_value;
    l.push(`  自爆: +${enemy.skill_value}ダメージ`);
  }

  if (eDmg > 0) {
    const before = pH;
    const res = dmg(eDmg, pS, pH);
    pS = Math.round(res.shield); 
    pH = Math.round(res.hull);
    l.push(`  敵艦攻撃: ${eDmg}ダメージ → ${before}HP → ${pH}HP`);
  }

  if (enemy.skill === 'EXPLOSIVE' && turn === 3) {
    eH = 0;
    l.push(`  自爆: 敵艦自壊`);
  }

  if (simultaneous) {
    if (eH <= 0) l.push(`  敵艦撃破（同時）`);
    if (pH <= 0) l.push(`  自機撃破（同時）`);
    if (eH <= 0 || pH <= 0) break;
  } else if (pH <= 0) {
    l.push(`  自機撃破を確認。`);
    break;
  }

  // Gate
  if (enemy.skill === 'GATE' && eS < enemy.skill_value && eH > 0) {
    const before = eS;
    eS = Math.round(enemy.skill_value);
    l.push(`  防壁作動: シールド ${before} → ${eS}`);
  }

  l.push('');
}

l.push(`=== 戦闘終了 ===`);

// Post-combat
const newInv = temp.inventory.filter(i => !(temp.equipped.includes(i.id) && i.disposable));

newInv.forEach(i => {
  if (temp.equipped.includes(i.id)) {
    const ab = parseAbility(i.ability);
    if (ab && ab.type === 'damage per combat') {
      i.power_stat += ab.value;
      l.push(`${i.name} 成長: +${ab.value} → ${i.power_stat}`);
    }
  }
});

if (pH > 0) {
  const repair = noRepair ? 0 : finalH;
  if (repair > 0) {
    pH = Math.min(temp.max_hull, Math.round(pH + repair));
    l.push(`戦闘後処理: 耐久値+${Math.round(repair)}回復 → ${pH}HP`);
  }
}

const newEq = temp.equipped.filter(id => newInv.some(i => i.id === id));
setPlayer({ ...temp, hull: Math.round(pH), inventory: newInv, equipped: newEq });

let res = 'defeat';
if (stage === 30 && eH <= 0 && pH > 0) res = 'clear';
else if (eH <= 0 && pH > 0) res = 'victory';
else if (pH <= 0) res = 'defeat';
else if (enemy.rank === 'BOSS') res = 'defeat';
else res = 'draw';

setLog(l);
setResult(res);
```

};

const eqd = temp.inventory.filter(i => temp.equipped.includes(i.id));
const uneq = temp.inventory.filter(i => !temp.equipped.includes(i.id));
const used = eqd.reduce((s, i) => s + i.slots, 0);

// Calculate expected damage preview
const calcDamagePreview = () => {
const eq = temp.inventory.filter(i => temp.equipped.includes(i.id));

```
// Base stats
const bL = eq.filter(e => e.eq_type === 'LONG').reduce((s, e) => s + e.power_stat, 0);
const bM = eq.filter(e => e.eq_type === 'MID').reduce((s, e) => s + e.power_stat, 0);
const bC = eq.filter(e => e.eq_type === 'CLOSE').reduce((s, e) => s + e.power_stat, 0);
const bS = eq.filter(e => e.eq_type === 'SHIELD').reduce((s, e) => s + e.power_stat, 0);

// Multipliers
const mult = { LONG: 1, MID: 1, CLOSE: 1, SHIELD: 1 };
eq.forEach(e => {
  if (e.mult_target && e.mult_target !== 'none') {
    mult[e.mult_target] *= e.mult_power;
  }
});

let finalL = bL * mult.LONG;
let finalM = bM * mult.MID;
let finalC = bC * mult.CLOSE;
let finalS = bS * mult.SHIELD;

// Abilities
eq.forEach(e => {
  const ab = parseAbility(e.ability);
  if (ab) {
    if (ab.type === 'SHIELD') finalS += ab.value;
    if (ab.type === 'ALL MID') finalM += ab.value;
  }
});

return {
  long: Math.round(finalL),
  mid: Math.round(finalM),
  close: Math.round(finalC),
  shield: Math.round(finalS)
};
```

};

const damagePreview = calcDamagePreview();

if (!started) {
return (
<div className="max-w-6xl mx-auto">
<h2 className="text-xl mb-2">ステージ {stage} | ACT {act}</h2>
<div className="grid grid-cols-2 gap-4 text-sm mb-4">
<div>
<div className="font-bold">スターキャナイン</div>
<div>耐久値: {Math.round(temp.hull)}/{temp.max_hull}</div>
<div>スロット: {used}/{temp.max_slots}</div>
<div className="mt-2 p-2 bg-green-900 bg-opacity-30 border border-green-700">
<div className="font-bold mb-1">予想攻撃力:</div>
<div className="text-xs">長距離: {damagePreview.long}</div>
<div className="text-xs">中距離: {damagePreview.mid}</div>
<div className="text-xs">近距離: {damagePreview.close}</div>
<div className="text-xs">シールド: {damagePreview.shield}</div>
</div>
</div>
<div>
<div className="font-bold">{enemy.name} ({translateRank(enemy.rank)})</div>
<div>HP:{enemy.hull} シールド:{enemy.shield}</div>
<div>攻撃力: 長{enemy.attack_LONG} 中{enemy.attack_MID} 近{enemy.attack_CLOSE}</div>
<div className="text-xs">{SKILL_DESC[enemy.skill]}</div>
</div>
</div>
<div className="mb-4">
<div className="font-bold mb-2">装備中 ({used}/{temp.max_slots})</div>
{eqd.map(i => (
<div key={i.id} className=“text-xs mb-1 cursor-pointer hover:bg-green-900” onClick={() => toggle(i)}>
✓ [{i.slots}] {i.name} | {translateEqType(i.eq_type)} 威力:{i.power_stat} {i.disposable && ‘💥’} {i.mult_target !== ‘none’ && `${translateEqType(i.mult_target)}x${i.mult_power}`} {ABILITY_DESC[i.ability]}
</div>
))}
</div>
<div className="mb-4">
<div className="font-bold mb-2">装備一覧</div>
{uneq.map(i => (
<div key={i.id} className=“text-xs mb-1 cursor-pointer hover:bg-green-900” onClick={() => toggle(i)}>
[{i.slots}] {i.name} | {translateEqType(i.eq_type)} 威力:{i.power_stat} {i.disposable && ‘💥’} {i.mult_target !== ‘none’ && `${translateEqType(i.mult_target)}x${i.mult_power}`} {ABILITY_DESC[i.ability]}
</div>
))}
</div>
<button onClick={() => { setPlayer(temp); setStarted(true); run(); }} className=“bg-red-700 px-4 py-2 hover:bg-red-600”>戦闘開始</button>
</div>
);
}

return (
<div className="max-w-4xl mx-auto">
<pre className="text-xs mb-4 whitespace-pre-wrap">{log.join(’\n’)}</pre>
{result && (
<div className="mb-4 text-center text-xl">
{result === ‘clear’ && ‘🎉 クリア 🎉’}
{result === ‘victory’ && ‘✓ 勝利’}
{result === ‘defeat’ && ‘✗ 敗北’}
{result === ‘draw’ && ‘— 引き分け —’}
</div>
)}
<button onClick={() => {
if (result === ‘clear’ || result === ‘defeat’) onExit(‘end’);
else if (result === ‘victory’) onExit(‘reward’);
else adv(‘main’);
}} className=“bg-green-700 px-4 py-2 hover:bg-green-600”>続行</button>
</div>
);
}

function Reward({ player, setPlayer, stage, adv }) {
const stData = ST.find(s => s.stage === getStageInAct(stage));
const enBase = EN.find(e => e.difficulty === stData.difficulty && e.rank === stData.rank);
const rarityMap = { NORMAL: 1, ELITE: 2, BOSS: 3 };
const pool = EQ.filter(e => e.rarity === rarityMap[enBase.rank]);
const [opts] = useState(pool.sort(() => Math.random() - 0.5).slice(0, 3));
const [sel, setSel] = useState(null);
const [bonus, setBonus] = useState(null);

const claim = () => {
let p = { …player };
if (sel) p.inventory.push(mkItem(sel));
if (enBase.rank === ‘BOSS’) {
p.hull = p.max_hull;
if (bonus === ‘a’) p.max_slots += 2;
else if (bonus === ‘b’) { p.max_slots += 1; p.max_hull += 80; p.hull += 80; }
else if (bonus === ‘c’) p.logistics = true;
}
setPlayer(p);
adv(‘main’);
};

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-xl mb-4">報酬</h2>
<div className="mb-4">
<div className="font-bold mb-2">1つ選択:</div>
{opts.map(e => (
<div key={e.name} className=“text-xs cursor-pointer hover:bg-green-900 mb-1” onClick={() => setSel(e.name)}>
{sel === e.name ? ‘✓’ : ‘○’} [{e.slots}] {e.name} | {translateEqType(e.eq_type)} 威力:{e.power_stat} {e.disposable && ‘💥’} {e.mult_target !== ‘none’ && `${translateEqType(e.mult_target)}x${e.mult_power}`} {ABILITY_DESC[e.ability]}
</div>
))}
</div>
{enBase.rank === ‘BOSS’ && (
<div className="mb-4">
<div className="font-bold mb-2">ボス特典:</div>
<div className=“text-sm cursor-pointer hover:bg-green-900 mb-1” onClick={() => setBonus(‘a’)}>
{bonus === ‘a’ ? ‘✓’ : ‘○’} 【拡張】装備スロット最大値+2
</div>
<div className=“text-sm cursor-pointer hover:bg-green-900 mb-1” onClick={() => setBonus(‘b’)}>
{bonus === ‘b’ ? ‘✓’ : ‘○’} 【強化】装備スロット最大値+1、耐久値最大値+80
</div>
<div className=“text-sm cursor-pointer hover:bg-green-900 mb-1” onClick={() => setBonus(‘c’)}>
{bonus === ‘c’ ? ‘✓’ : ‘○’} 【兵站】次の戦闘開始時、🚀 ランスを1つ追加
</div>
</div>
)}
<button onClick={claim} disabled={!sel || (enBase.rank === ‘BOSS’ && !bonus)} className={`px-4 py-2 ${sel && (enBase.rank !== 'BOSS' || bonus) ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700 cursor-not-allowed'}`}>獲得</button>
</div>
);
}

function Dock({ player, setPlayer, adv }) {
const repair = Math.floor(player.max_hull * 0.3);
const handleRepair = () => {
const p = { …player };
p.hull = Math.min(p.max_hull, p.hull + repair);
setPlayer(p);
adv(‘main’);
};

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-xl mb-4">ドック</h2>
<div className="mb-4 text-sm">
<div className="font-bold mb-2">スターキャナイン</div>
<div>耐久値: {Math.round(player.hull)}/{player.max_hull}</div>
</div>
<button onClick={handleRepair} className="bg-green-700 px-4 py-2 hover:bg-green-600">修理 (+{repair}HP)</button>
</div>
);
}

function End({ player, stage, onRestart }) {
const cleared = stage >= 30 && player.hull > 0;

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-2xl mb-4 text-center">{cleared ? ‘🎉 ミッション完了 🎉’ : ‘信号途絶’}</h2>
{cleared && <pre className="text-xs mb-4 whitespace-pre-wrap text-center">{`K9軌道を制圧。
LAIKAを救出。

「帰ってきてくれたのね。」`}</pre>}
{!cleared && <div className="mb-4 text-center">ステージ: {stage}</div>}

```
  <div className="mb-6 text-sm border border-green-700 p-4">
    <div className="font-bold mb-2 text-center">スターキャナイン - 最終状態</div>
    <div className="mb-2">耐久値: {Math.round(player.hull)}/{player.max_hull}</div>
    <div className="mb-3">スロット: {player.max_slots}</div>
    
    <div className="font-bold mb-2">装備一覧 ({player.inventory.length}個):</div>
    {player.inventory.map(i => (
      <div key={i.id} className="text-xs mb-1">
        [{i.slots}] {i.name} | {translateEqType(i.eq_type)} 威力:{i.power_stat} {i.disposable && '💥'} {i.mult_target !== 'none' && `${translateEqType(i.mult_target)}x${i.mult_power}`} {ABILITY_DESC[i.ability]}
      </div>
    ))}
  </div>
  
  <div className="text-center">
    <button onClick={onRestart} className="bg-green-700 px-4 py-2 hover:bg-green-600">再スタート</button>
  </div>
</div>
```

);
}
