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

// === DATA ===
const EQ_CSV = `slots,name,power_stat,eq_type,rarity,disposable,mult_target,mult_power,ability 1,🚀 Lance,40,LONG,0,true,none,0,none 1,🚀 Meteor,45,LONG,1,true,none,0,none 2,🚀🛡️ Interceptor,50,LONG,1,true,none,0,+10 SHIELD 2,🚀 Harpoon,66,LONG,1,true,none,0,none 2,🚀⚠️ Isolation,75,LONG,1,true,LONG,0.9,none 2,🚀🔺 Javelin,39,LONG,1,true,LONG,1.2,none 2,🚀🔺 Gambit,55,LONG,2,true,LONG,1.3,none 1,🔫 Quantum Displacer,40,LONG,3,false,CLOSE,0.5,none 2,🔥🔺 Warhead Optimizer,0,MODULE,3,false,LONG,2,none 1,✈️ Drones,12,MID,1,false,none,0,none 1,✈️⚠️ Scavenger,20,MID,1,false,MID,0.9,none 1,✈️🔺 Squadron,8,MID,1,false,MID,1.2,none 1,✈️⤴️ Rookie fighter,5,MID,1,false,none,0,+2 damage per combat 1,✈️✈️ Blue Wolf,20,MID,2,false,none,0,none 1,🛫🔺 Swarm Core,0,MODULE,3,false,LONG,0.5,+10 ALL MID 1,🏗️🔺 Swarm Hanger,0,MODULE,3,false,MID,2,DISABLE_HULL_REPAIR 1,⚡ Fang,10,CLOSE,0,false,none,0,none 1,⚡ Claw,15,CLOSE,1,false,none,0,none 1,⚡⚠️ Static Blade,22,CLOSE,1,false,CLOSE,0.9,none 1,⚡️🛡️ Iron Beam,5,CLOSE,2,false,none,0,+10 SHIELD 1,⚡ Cudgel,25,CLOSE,2,false,none,0,none 1,⚡️🔺 Boost laser,10,CLOSE,1,false,CLOSE,1.2,none 1,⚡💥 Burn soul,40,CLOSE,2,true,none,0,none 1,💎🔺 Prismatic Focus,0,MODULE,3,false,CLOSE,2,Simultaneous 1,🛡️ Plating,14,SHIELD,0,false,none,0,none 1,🛡️ Veil,17,SHIELD,1,false,none,0,none 1,🛡️⚠️ Bulkhead,25,SHIELD,1,false,SHIELD,0.9,none 1,🛡️💥 Ephemera shield,33,SHIELD,1,true,none,0,none 1,🛡️🛡️ Aegis,30,SHIELD,2,false,none,0,none 1,🛡️🔺 Barrier,13,SHIELD,2,false,SHIELD,1.2,none 1,🟫🔺 Double Shield,0,MODULE,3,false,SHIELD,2,none 1,🔧 Repairer,10,HULL,1,false,none,0,none 1,🔧🔧 Veteran Repairer,15,HULL,2,false,none,0,none 1,♨️🔺 Recreational facility,2,MODULE,2,false,HULL,2,none`;

const EN_CSV = `difficulty,name,hull,shield,rank,attack_LONG,attack_MID,attack_CLOSE,skill,skill_value 1,Skirmisher,30,0,NORMAL,0,0,10,none,0 2,Drifter,31,5,NORMAL,20,0,10,GATE,5 3,Self-Repairer,40,0,NORMAL,0,15,5,REGEN,8 4,Zombie,25,80,NORMAL,5,20,0,DEGEN,5 5,Relic Sentry,60,20,NORMAL,30,30,0,DORMANT,0 5,Kamikaze Frigate,10,100,NORMAL,0,0,0,EXPLOSIVE,60 6,Shield Gate,55,20,ELITE,15,15,20,GATE,20 8,Overload Enforcer,70,20,ELITE,20,20,25,OVERLOAD,2 9,Celestial Reaper,100,60,BOSS,40,20,35,COUNTER(LONG),10`;

const ST_CSV = `stage,type,difficulty,rank 1,combat,1,NORMAL 2,combat,2,NORMAL 3,combat,6,ELITE 4,dock,0, 5,combat,3,NORMAL 6,combat,4,NORMAL 7,combat,8,ELITE 8,combat,5,NORMAL 9,dock,0, 10,combat,9,BOSS`;

const EQ = parseCSV(EQ_CSV);
const EN = parseCSV(EN_CSV);
const ST = parseCSV(ST_CSV);

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
shield: Math.round(Math.max(0, s - d)),
hull: Math.round(Math.max(0, h - (d - sd)))
};
};

const parseAbility = (str) => {
if (!str || str === ‘none’) return null;
if (str === ‘Simultaneous’) return { type: ‘Simultaneous’ };
if (str === ‘DISABLE_HULL_REPAIR’) return { type: ‘No Repair’ };
let m = str.match(/+(\d+)\s+SHIELD/);
if (m) return { type: ‘SHIELD’, value: Number(m[1]) };
m = str.match(/+(\d+)\s+ALL\s+MID/);
if (m) return { type: ‘ALL MID’, value: Number(m[1]) };
m = str.match(/+(\d+)\s+damage per combat/);
if (m) return { type: ‘damage per combat’, value: Number(m[1]) };
return null;
};

// === MAIN ===
export default function Game() {
const [scene, setScene] = useState(‘start’);
const [stage, setStage] = useState(1);
const [player, setPlayer] = useState({
max_hull: 200,
hull: 200,
max_slots: 6,
inventory: [mkItem(‘🚀 Lance’), mkItem(‘⚡ Fang’), mkItem(‘⚡ Fang’), mkItem(‘🛡️ Plating’)],
equipped: []
});

const adv = (s) => { setStage(p => p + 1); setScene(s); };

const scenes = {
start: <Start onStart={() => setScene(‘main’)} />,
main: <Main player={player} stage={stage} setScene={setScene} />,
combat: <Combat player={player} setPlayer={setPlayer} stage={stage} onExit={setScene} adv={adv} />,
reward: <Reward player={player} setPlayer={setPlayer} stage={stage} adv={adv} />,
dock: <Dock player={player} setPlayer={setPlayer} adv={adv} />,
end: <End player={player} stage={stage} onRestart={() => window.location.reload()} />
};

return <div className="min-h-screen bg-black text-green-400 font-mono p-4">{scenes[scene]}</div>;
}

// === SCENES ===
function Start({ onStart }) {
return (
<div className="max-w-4xl mx-auto">
<pre className="text-xs mb-6 whitespace-pre-wrap">{`> Incoming distress signal detected.

> Sender ID: LAIKA

“It’s me.
K9 has fallen.
Solar Bear took the planet.
They took me too.
I know you weren’t here.

Please… don’t die.”

> Signal lost.

> Setting course for K9.`}</pre>
> <button onClick={onStart} className="bg-green-700 px-4 py-2 hover:bg-green-600">LAUNCH</button>
> </div>
> );
> }

function Main({ player, stage, setScene }) {
useEffect(() => {
const s = ST.find(x => x.stage === getStageInAct(stage));
if (!s) { setScene(‘end’); return; }
setScene(s.type === ‘combat’ ? ‘combat’ : ‘dock’);
}, [stage, setScene]);
return <div className="text-center">Processing Stage {stage}…</div>;
}

function Combat({ player, setPlayer, stage, onExit, adv }) {
const [started, setStarted] = useState(false);
const [log, setLog] = useState([]);
const [result, setResult] = useState(null);
const [temp, setTemp] = useState({ …player });

const act = getAct(stage);
const scale = getActScale(act);
const stData = ST.find(s => s.stage === getStageInAct(stage));
const enBase = EN.find(e => e.difficulty === stData.difficulty && e.rank === stData.rank);

if (!enBase) return <div>ERROR: Enemy not found</div>;

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

let pS = finalS, pH = temp.hull, eH = enemy.hull, eS = enemy.shield;

l.push(`=== ACT ${act} | Stage ${stage} | ${enemy.name} ===`);
l.push(`Player: ${Math.round(pH)}HP | S:${Math.round(pS)}`);
l.push(`Enemy: ${eH}HP | S:${eS} | ${enemy.skill}${enemy.skill_value > 0 ? ':' + enemy.skill_value : ''}`);
l.push(`Stats: L${Math.round(finalL)} M${Math.round(finalM)} C${Math.round(finalC)}`);
l.push('');

for (let turn = 0; turn < 6; turn++) {
  const r = ranges[turn];
  l.push(`--- T${turn + 1}: ${r} ---`);

  // Player attack
  const pDmg = r === 'LONG' ? finalL : r === 'MID' ? finalM : finalC;
  if (pDmg > 0) {
    const before = eH;
    const res = dmg(pDmg, eS, eH);
    eS = res.shield; eH = res.hull;
    l.push(`  Player: ${Math.round(pDmg)} dmg → ${before}HP → ${eH}HP`);
  } else {
    l.push(`  No ${r}`);
  }

  // Counter
  if (r === 'LONG' && enemy.skill === 'COUNTER(LONG)' && longCount > 0) {
    const counter = Math.round(enemy.skill_value * longCount);
    const before = pH;
    const res = dmg(counter, pS, pH);
    pS = res.shield; pH = res.hull;
    l.push(`  Counter: ${counter} dmg (${longCount} LONG) → ${before}HP → ${pH}HP`);
    if (pH <= 0) { l.push(`  PLAYER DESTROYED`); break; }
  }

  if (!simultaneous && eH <= 0) { l.push(`  ENEMY DESTROYED`); break; }

  // Enemy skill
  if (enemy.skill === 'REGEN' && enemy.skill_value > 0) {
    eH += enemy.skill_value;
    l.push(`  REGEN: +${enemy.skill_value}HP → ${eH}HP`);
  }
  if (enemy.skill === 'DEGEN' && enemy.skill_value > 0) {
    eH -= enemy.skill_value;
    l.push(`  DEGEN: -${enemy.skill_value}HP → ${eH}HP`);
    if (eH <= 0) { l.push(`  ENEMY DESTROYED (DEGEN)`); break; }
  }

  // Enemy attack
  let eDmg = r === 'LONG' ? enemy.attack_LONG : r === 'MID' ? enemy.attack_MID : enemy.attack_CLOSE;
  
  if ((enemy.skill === 'OVERLOAD' || enemy.skill === 'DORMANT') && turn >= 3) {
    eDmg = Math.round(eDmg * enemy.skill_value);
    l.push(`  ${enemy.skill}: ATK x${enemy.skill_value}`);
  }

  if (enemy.skill === 'EXPLOSIVE' && turn === 3) {
    eDmg += enemy.skill_value;
    l.push(`  EXPLOSIVE: +${enemy.skill_value} dmg`);
  }

  if (eDmg > 0) {
    const before = pH;
    const res = dmg(eDmg, pS, pH);
    pS = res.shield; pH = res.hull;
    l.push(`  Enemy: ${eDmg} dmg → ${before}HP → ${pH}HP`);
  }

  if (enemy.skill === 'EXPLOSIVE' && turn === 3) {
    eH = 0;
    l.push(`  EXPLOSIVE: Suicide`);
  }

  if (simultaneous) {
    if (eH <= 0) l.push(`  ENEMY DOWN (Sim)`);
    if (pH <= 0) l.push(`  PLAYER DOWN (Sim)`);
    if (eH <= 0 || pH <= 0) break;
  } else if (pH <= 0) {
    l.push(`  PLAYER DESTROYED`);
    break;
  }

  // Gate
  if (enemy.skill === 'GATE' && eS < enemy.skill_value && eH > 0) {
    const before = eS;
    eS = enemy.skill_value;
    l.push(`  GATE: Shield ${before} → ${eS}`);
  }

  l.push('');
}

l.push(`=== END ===`);

// Post-combat
const newInv = temp.inventory.filter(i => !(temp.equipped.includes(i.id) && i.disposable));

newInv.forEach(i => {
  if (temp.equipped.includes(i.id)) {
    const ab = parseAbility(i.ability);
    if (ab && ab.type === 'damage per combat') {
      i.power_stat += ab.value;
      l.push(`${i.name} evolved: +${ab.value} → ${i.power_stat}`);
    }
  }
});

if (pH > 0) {
  const repair = noRepair ? 0 : finalH;
  if (repair > 0) {
    pH = Math.min(temp.max_hull, Math.round(pH + repair));
    l.push(`Repair: +${Math.round(repair)}HP → ${pH}HP`);
  }
}

const newEq = temp.equipped.filter(id => newInv.some(i => i.id === id));
setPlayer({ ...temp, hull: pH, inventory: newInv, equipped: newEq });

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

if (!started) {
return (
<div className="max-w-6xl mx-auto">
<h2 className="text-xl mb-2">STAGE {stage} | ACT {act}</h2>
<div className="grid grid-cols-2 gap-4 text-sm mb-4">
<div>
<div className="font-bold">STAR CANINE</div>
<div>Hull: {temp.hull}/{temp.max_hull}</div>
<div>Slots: {used}/{temp.max_slots}</div>
</div>
<div>
<div className="font-bold">{enemy.name} ({enemy.rank})</div>
<div>HP:{enemy.hull} S:{enemy.shield}</div>
<div>ATK: L{enemy.attack_LONG} M{enemy.attack_MID} C{enemy.attack_CLOSE}</div>
<div>Skill: {enemy.skill} {enemy.skill_value > 0 && `(${enemy.skill_value})`}</div>
</div>
</div>
<div className="mb-4">
<div className="font-bold mb-2">EQUIPPED ({used}/{temp.max_slots})</div>
{eqd.map(i => (
<div key={i.id} className=“text-xs mb-1 cursor-pointer hover:bg-green-900” onClick={() => toggle(i)}>
✓ [{i.slots}] {i.name} | {i.eq_type} P:{i.power_stat} {i.disposable && ‘💥’} {i.mult_target !== ‘none’ && `${i.mult_target}x${i.mult_power}`} {i.ability !== ‘none’ && i.ability}
</div>
))}
</div>
<div className="mb-4">
<div className="font-bold mb-2">INVENTORY</div>
{uneq.map(i => (
<div key={i.id} className=“text-xs mb-1 cursor-pointer hover:bg-green-900” onClick={() => toggle(i)}>
[{i.slots}] {i.name} | {i.eq_type} P:{i.power_stat} {i.disposable && ‘💥’} {i.mult_target !== ‘none’ && `${i.mult_target}x${i.mult_power}`} {i.ability !== ‘none’ && i.ability}
</div>
))}
</div>
<button onClick={() => { setPlayer(temp); setStarted(true); run(); }} className=“bg-red-700 px-4 py-2 hover:bg-red-600”>ENGAGE</button>
</div>
);
}

return (
<div className="max-w-4xl mx-auto">
<pre className="text-xs mb-4 whitespace-pre-wrap">{log.join(’\n’)}</pre>
{result && (
<div className="mb-4 text-center text-xl">
{result === ‘clear’ && ‘🎉 CLEAR 🎉’}
{result === ‘victory’ && ‘✓ WIN’}
{result === ‘defeat’ && ‘✗ DEFEAT’}
{result === ‘draw’ && ‘— DRAW —’}
</div>
)}
<button onClick={() => {
if (result === ‘clear’ || result === ‘defeat’) onExit(‘end’);
else if (result === ‘victory’) onExit(‘reward’);
else adv(‘main’);
}} className=“bg-green-700 px-4 py-2 hover:bg-green-600”>CONTINUE</button>
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
}
setPlayer(p);
adv(‘main’);
};

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-xl mb-4">REWARDS</h2>
<div className="mb-4">
<div className="font-bold mb-2">Choose ONE:</div>
{opts.map(e => (
<div key={e.name} className=“text-xs cursor-pointer hover:bg-green-900 mb-1” onClick={() => setSel(e.name)}>
{sel === e.name ? ‘✓’ : ‘○’} [{e.slots}] {e.name} | {e.eq_type} P:{e.power_stat} {e.disposable && ‘💥’} {e.mult_target !== ‘none’ && `${e.mult_target}x${e.mult_power}`} {e.ability !== ‘none’ && e.ability}
</div>
))}
</div>
{enBase.rank === ‘BOSS’ && (
<div className="mb-4">
<div className="font-bold mb-2">BOSS BONUS:</div>
<div className=“text-sm cursor-pointer hover:bg-green-900 mb-1” onClick={() => setBonus(‘a’)}>
{bonus === ‘a’ ? ‘✓’ : ‘○’} Expansion: Slots +2
</div>
<div className=“text-sm cursor-pointer hover:bg-green-900 mb-1” onClick={() => setBonus(‘b’)}>
{bonus === ‘b’ ? ‘✓’ : ‘○’} Reinforcement: Slots +1 & Hull +80
</div>
</div>
)}
<button onClick={claim} disabled={!sel || (enBase.rank === ‘BOSS’ && !bonus)} className={`px-4 py-2 ${sel && (enBase.rank !== 'BOSS' || bonus) ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700 cursor-not-allowed'}`}>CLAIM</button>
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
<h2 className="text-xl mb-4">DOCK</h2>
<div className="mb-4 text-sm">
<div className="font-bold mb-2">STAR CANINE</div>
<div>Hull: {player.hull}/{player.max_hull}</div>
</div>
<button onClick={handleRepair} className="bg-green-700 px-4 py-2 hover:bg-green-600">REPAIR (+{repair}HP)</button>
</div>
);
}

function End({ player, stage, onRestart }) {
const cleared = stage >= 30 && player.hull > 0;
return (
<div className="max-w-4xl mx-auto text-center">
<h2 className="text-2xl mb-4">{cleared ? ‘🎉 MISSION COMPLETE 🎉’ : ‘SIGNAL LOST’}</h2>
{cleared && <pre className="text-xs mb-4 whitespace-pre-wrap">{`K9 orbit cleared.
LAIKA rescued.

“You came back.”`}</pre>}
{!cleared && <div className="mb-4">Stage: {stage}</div>}
<button onClick={onRestart} className="bg-green-700 px-4 py-2 hover:bg-green-600">RESTART</button>
</div>
);
}
