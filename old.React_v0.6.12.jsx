import React, { useState, useEffect } from ‘react’;

// === SANITIZING CSV PARSER ===
const parseCSV = (csv) => {
const lines = csv.trim().split(’\n’).map(l => l.trim()).filter(l => l);
const headers = lines[0].split(’,’).map(h => h.trim());
return lines.slice(1).map(line => {
const values = line.split(’,’);
const obj = {};
headers.forEach((h, i) => {
let val = values[i]?.trim();
if (val === ‘0’ || val === ‘’) obj[h] = 0;
else if (!isNaN(val) && val !== ‘’) obj[h] = Number(val);
else obj[h] = val;
});
return obj;
});
};

// === STATIC DATA ===
const EQUIPMENT_CSV = `name,power_stat,ammo_cost,eq_type,rarity,disposable,ability 🚀 Lance,40,3,LONG,0,0,0 🚀 Interceptor,40,3,LONG,1,0,+10 shield 🚀 Meteor,50,4,LONG,1,0,0 🚀 Nova,65,5,LONG,1,0,0 🚀🚀 Resurrection,40,1,LONG,1,0,0 🚀💥 Gambit,80,3,LONG,1,1,0 🔥 Warhead Optimizer,2,0,MODULE_LONG,3,0,0 ✈️ Drones,15,0,MID,1,0,0 ✈️ Defender,10,1,MID,1,0,+10 shield ✈️ Wing,20,1,MID,1,0,0 ✈️ Squadron,35,2,MID,1,0,0 ✈️✈️ Rookie fighter,5,1,MID,1,0,+3 damage per combat ✈️💥 Kamikaze,80,2,MID,1,1,0 ✈️✈️✈️ Blue Wolf,60,2,MID,2,0,0 ⚡ Fang,10,0,CLOSE,0,0,0 ⚡️ Iron Beam,5,0,CLOSE,1,0,+10 armor ⚡ Claw,15,1,CLOSE,1,0,0 ⚡ Cudgel,20,2,CLOSE,1,0,0 ⚡️⚡️ Laser shield,10,0,CLOSE,1,0,+15 shield ⚡💥 Burn soul,40,2,CLOSE,1,1,0 💎 Prismatic Lens,2,0,MODULE_CLOSE,2,0,0 🟫 Plating,25,0,ARMOR,0,0,0 🟫🟫 Heavy armor,35,0,ARMOR,1,0,0 🟫 Improvised armor,60,0,ARMOR,1,1,0 🛡️ Veil,20,0,SHIELD,1,0,0 🛡️🛡️ Aegis,30,0,SHIELD,2,0,0 🛡️🛡️ Ephemera shield,60,0,SHIELD,1,1,0 🔧 Repairer,0,0,UTILITY,1,0,+10 hull repair 🔧🔧 Veteran Repairer,0,0,UTILITY,2,0,+20 hull repair 🔧🔧🔧 Recreational facility,2,0,MODULE_UTILITY,2,0,0 ⚠️ Broken Scrap,0,0,JUNK,0,0,0`;

const ENEMY_CSV = `difficulty,name,hull,shield,armor,rank,attack_LONG,attack_MID,attack_CLOSE 1,Skirmisher,30,0,0,NORMAL,0,0,10 2,Drifter,35,5,0,NORMAL,20,0,10 3,Scout,40,0,10,NORMAL,0,0,15 3,Lancer,45,10,0,NORMAL,30,0,15 5,Raider,50,10,10,ELITE,30,0,20 4,Interceptor,55,15,10,NORMAL,35,0,20 6,Frigate,65,0,20,NORMAL,20,0,25 7,Enforcer,70,20,15,ELITE,40,0,25 8,Howler,80,25,20,ELITE,45,0,30 10,Celestial Reaper,100,30,40,BOSS,50,0,35`;

const STAGE_CSV = `stage,type,difficulty,rank 1,combat,1,NORMAL 2,combat,2,NORMAL 3,combat,5,ELITE 4,dock,, 5,combat,3,NORMAL 6,combat,4,NORMAL 7,combat,7,ELITE 8,combat,6,NORMAL 9,dock,, 10,combat,10,BOSS`;

const EQUIPMENT_DATA = parseCSV(EQUIPMENT_CSV);
const ENEMY_DATA = parseCSV(ENEMY_CSV);
const STAGE_DATA = parseCSV(STAGE_CSV);

// === UTILITY FUNCTIONS ===
const getActScale = (stageNum) => Math.floor((stageNum - 1) / 10) + 1;
const getStageInAct = (stageNum) => ((stageNum - 1) % 10) + 1;

const createItem = (name) => {
const base = EQUIPMENT_DATA.find(e => e.name === name);
return base ? { …base, id: Math.random().toString(36).substr(2, 9) } : null;
};

const applyDamage = (damage, shield, armor, hull, range) => {
let s = shield, a = armor, h = hull, overflow = 0;
if (range === ‘LONG’) {
overflow = Math.max(0, damage - s);
s = Math.max(0, s - damage);
h = Math.max(0, h - overflow);
} else if (range === ‘MID’) {
h = Math.max(0, h - damage);
} else if (range === ‘CLOSE’) {
overflow = Math.max(0, damage - a);
a = Math.max(0, a - damage);
h = Math.max(0, h - overflow);
}
return { shield: s, armor: a, hull: h };
};

// === MAIN GAME COMPONENT ===
export default function StarCanine() {
const [scene, setScene] = useState(‘start’);
const [stageNum, setStageNum] = useState(1);
const [playerState, setPlayerState] = useState({
max_hull: 200,
hull: 200,
ammo: 12,
max_slots: 6,
inventory: [
createItem(‘🚀 Lance’),
createItem(‘⚡ Fang’),
createItem(‘⚡ Fang’),
createItem(‘🟫 Plating’)
],
equipped: []
});

const advanceStage = (newScene) => {
setStageNum(prev => prev + 1);
setScene(newScene);
};

const sceneMap = {
start: <StartScene onStart={() => setScene(‘main’)} />,
main: <MainLoop playerState={playerState} stageNum={stageNum} setScene={setScene} />,
combat: <CombatScene playerState={playerState} setPlayerState={setPlayerState} stageNum={stageNum} onExit={(next) => setScene(next)} advanceStage={advanceStage} />,
reward: <RewardScene playerState={playerState} setPlayerState={setPlayerState} stageNum={stageNum} advanceStage={advanceStage} />,
dock: <DockScene playerState={playerState} setPlayerState={setPlayerState} advanceStage={advanceStage} />,
gameEnd: <GameEndScene playerState={playerState} stageNum={stageNum} onRestart={() => window.location.reload()} />
};

return <div className="min-h-screen bg-black text-green-400 font-mono p-4">{sceneMap[scene]}</div>;
}

// === START SCENE ===
function StartScene({ onStart }) {
return (
<div className="max-w-4xl mx-auto">
<pre className="text-xs mb-6 whitespace-pre-wrap">{`Ship ID confirmed: STAR CANINE
Command authority: CAPTAIN

Incoming distress signal detected.
Origin: Planet K9
Sender ID: LAIKA

“It’s me.
K9 has fallen.
Solar Bear battleships took the planet.
They took me too.
I know you weren’t here.
I know you’ll come back.
Please… don’t die.”

Signal lost.

Solar Bear Empire detected in K9 orbit.
Occupation status: ACTIVE.

Setting course for K9.`}</pre>
<button onClick={onStart} className="bg-green-700 px-4 py-2 hover:bg-green-600">LAUNCH</button>
</div>
);
}

// === MAIN LOOP ===
function MainLoop({ playerState, stageNum, setScene }) {
useEffect(() => {
const stageInAct = getStageInAct(stageNum);
const stage = STAGE_DATA.find(s => s.stage === stageInAct);
if (!stage) {
setScene(‘gameEnd’);
return;
}
setScene(stage.type === ‘combat’ ? ‘combat’ : ‘dock’);
}, [stageNum, setScene]);

return <div className="text-center">Processing Stage {stageNum}…</div>;
}

// === COMBAT SCENE ===
function CombatScene({ playerState, setPlayerState, stageNum, onExit, advanceStage }) {
const [combatStarted, setCombatStarted] = useState(false);
const [combatLog, setCombatLog] = useState([]);
const [combatResult, setCombatResult] = useState(null);

const stageInAct = getStageInAct(stageNum);
const actScale = getActScale(stageNum);
const stage = STAGE_DATA.find(s => s.stage === stageInAct);

const enemyBase = ENEMY_DATA.find(e => e.difficulty === stage.difficulty && e.rank === stage.rank);
if (!enemyBase) return <div>ERROR: Enemy not found</div>;

const [enemy, setEnemy] = useState({
…enemyBase,
hull: enemyBase.hull * actScale,
shield: enemyBase.shield * actScale,
armor: enemyBase.armor * actScale,
attack_LONG: enemyBase.attack_LONG * actScale,
attack_MID: enemyBase.attack_MID * actScale,
attack_CLOSE: enemyBase.attack_CLOSE * actScale
});

const [tempPlayer, setTempPlayer] = useState({ …playerState });

const toggleEquip = (item) => {
setTempPlayer(prev => {
const isEquipped = prev.equipped.includes(item.id);
let newEquipped = isEquipped
? prev.equipped.filter(id => id !== item.id)
: […prev.equipped, item.id];
if (newEquipped.length > prev.max_slots) newEquipped = newEquipped.slice(0, prev.max_slots);
return { …prev, equipped: newEquipped };
});
};

const runCombat = () => {
const log = [];
const ranges = [‘LONG’, ‘MID’, ‘CLOSE’, ‘CLOSE’, ‘MID’, ‘LONG’];

```
const equipped = tempPlayer.inventory.filter(i => tempPlayer.equipped.includes(i.id));

// Init combat stats
let pShield = equipped.filter(e => e.eq_type === 'SHIELD').reduce((s, e) => s + e.power_stat, 0);
let pArmor = equipped.filter(e => e.eq_type === 'ARMOR').reduce((s, e) => s + e.power_stat, 0);

equipped.forEach(e => {
  const ability = e.ability;
  if (typeof ability === 'string') {
    const shieldMatch = ability.match(/\+(\d+)\s+shield/);
    const armorMatch = ability.match(/\+(\d+)\s+armor/);
    if (shieldMatch) pShield += Number(shieldMatch[1]);
    if (armorMatch) pArmor += Number(armorMatch[1]);
  }
});

// Calculate module multipliers
const moduleLong = equipped.filter(e => e.eq_type === 'MODULE_LONG').reduce((m, e) => m * e.power_stat, 1);
const moduleMid = equipped.filter(e => e.eq_type === 'MODULE_MID').reduce((m, e) => m * e.power_stat, 1);
const moduleClose = equipped.filter(e => e.eq_type === 'MODULE_CLOSE').reduce((m, e) => m * e.power_stat, 1);
const moduleUtility = equipped.filter(e => e.eq_type === 'MODULE_UTILITY').reduce((m, e) => m * e.power_stat, 1);

let pHull = tempPlayer.hull;
let pAmmo = tempPlayer.ammo;
let eHull = enemy.hull;
let eShield = enemy.shield;
let eArmor = enemy.armor;

log.push(`=== COMBAT START ===`);
log.push(`ACT ${actScale} | Stage ${stageNum} | ${enemy.name} (${enemy.rank})`);
log.push(`Player: ${pHull}HP | Shield:${pShield} | Armor:${pArmor} | Ammo:${pAmmo}`);
log.push(`Enemy: ${eHull}HP | Shield:${eShield} | Armor:${eArmor}`);
log.push('');

for (let turn = 0; turn < 6; turn++) {
  const range = ranges[turn];
  log.push(`--- TURN ${turn + 1}: ${range} ---`);

  // Player attack
  const activeWeapons = equipped.filter(e => {
    if (e.eq_type !== range) return false;
    if (e.ammo_cost > pAmmo) return false;
    return true;
  });

  let totalDmg = 0;
  activeWeapons.forEach(w => {
    let dmg = w.power_stat;
    if (range === 'LONG') dmg *= moduleLong;
    if (range === 'MID') dmg *= moduleMid;
    if (range === 'CLOSE') dmg *= moduleClose;
    totalDmg += dmg;
    pAmmo -= w.ammo_cost;
    log.push(`  ${w.name}: ${dmg} dmg (${w.ammo_cost} ammo)`);
  });

  if (totalDmg > 0) {
    const before = { shield: eShield, armor: eArmor, hull: eHull };
    const after = applyDamage(totalDmg, eShield, eArmor, eHull, range);
    eShield = after.shield;
    eArmor = after.armor;
    eHull = after.hull;
    log.push(`  → Enemy: ${before.hull}HP → ${eHull}HP`);
  } else {
    log.push(`  Player has no weapons for ${range}`);
  }

  if (eHull <= 0) {
    log.push(`  ENEMY DESTROYED`);
    break;
  }

  // Enemy attack
  const eAtk = range === 'LONG' ? enemy.attack_LONG : range === 'MID' ? enemy.attack_MID : enemy.attack_CLOSE;
  if (eAtk > 0) {
    const before = { shield: pShield, armor: pArmor, hull: pHull };
    const after = applyDamage(eAtk, pShield, pArmor, pHull, range);
    pShield = after.shield;
    pArmor = after.armor;
    pHull = after.hull;
    log.push(`  Enemy attacks: ${eAtk} dmg`);
    log.push(`  → Player: ${before.hull}HP → ${pHull}HP`);
  }

  if (pHull <= 0) {
    log.push(`  PLAYER DESTROYED`);
    break;
  }

  log.push('');
}

// Combat end processing
log.push(`=== COMBAT END ===`);

// Disposable cleanup
const updatedInv = tempPlayer.inventory.map(item => {
  if (tempPlayer.equipped.includes(item.id) && item.disposable === 1) {
    const scrap = createItem('⚠️ Broken Scrap');
    scrap.id = item.id;
    return scrap;
  }
  return item;
});

// Utility repair
let repairTotal = 0;
equipped.forEach(e => {
  if (e.eq_type === 'UTILITY' && typeof e.ability === 'string') {
    const match = e.ability.match(/\+(\d+)\s+hull repair/);
    if (match) repairTotal += Number(match[1]);
  }
});
repairTotal *= moduleUtility;
pHull = Math.min(tempPlayer.max_hull, pHull + repairTotal);
if (repairTotal > 0) log.push(`Utility repair: +${repairTotal}HP → ${pHull}HP`);

// Permanent stat mutation
updatedInv.forEach(item => {
  if (tempPlayer.equipped.includes(item.id) && typeof item.ability === 'string') {
    const match = item.ability.match(/\+(\d+)\s+damage per combat/);
    if (match) {
      item.power_stat += Number(match[1]);
      log.push(`${item.name} evolved: +${match[1]} power → ${item.power_stat}`);
    }
  }
});

setPlayerState({ ...tempPlayer, hull: pHull, ammo: pAmmo, inventory: updatedInv });

// Determine outcome
let result = 'defeat';
if (stageNum === 30 && eHull <= 0) result = 'clear';
else if (eHull <= 0) result = 'victory';
else if (pHull <= 0) result = 'defeat';
else if (enemy.rank === 'BOSS') result = 'defeat';
else result = 'draw';

setCombatLog(log);
setCombatResult(result);
```

};

const handleContinue = () => {
if (combatResult === ‘clear’ || combatResult === ‘defeat’) onExit(‘gameEnd’);
else if (combatResult === ‘victory’) onExit(‘reward’);
else advanceStage(‘main’);
};

if (!combatStarted) {
const equipped = tempPlayer.inventory.filter(i => tempPlayer.equipped.includes(i.id));
const unequipped = tempPlayer.inventory.filter(i => !tempPlayer.equipped.includes(i.id));

```
return (
  <div className="max-w-6xl mx-auto">
    <div className="mb-4">
      <h2 className="text-xl mb-2">STAGE {stageNum} | ACT {actScale}</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-bold">STAR CANINE</div>
          <div>Hull: {tempPlayer.hull}/{tempPlayer.max_hull}</div>
          <div>Ammo: {tempPlayer.ammo}</div>
        </div>
        <div>
          <div className="font-bold">{enemy.name} ({enemy.rank})</div>
          <div>Hull: {enemy.hull}</div>
          <div>Shield: {enemy.shield} | Armor: {enemy.armor}</div>
          <div>ATK: L{enemy.attack_LONG} M{enemy.attack_MID} C{enemy.attack_CLOSE}</div>
        </div>
      </div>
    </div>

    <div className="mb-4">
      <div className="font-bold mb-2">EQUIPPED ({tempPlayer.equipped.length}/{tempPlayer.max_slots})</div>
      {equipped.map(item => (
        <div key={item.id} className="text-xs mb-1 cursor-pointer hover:bg-green-900" onClick={() => toggleEquip(item)}>
          ✓ {item.name} | {item.eq_type} | PWR:{item.power_stat} | AMMO:{item.ammo_cost} | {item.disposable ? '💥' : '—'} | {item.ability || '—'}
        </div>
      ))}
    </div>

    <div className="mb-4">
      <div className="font-bold mb-2">INVENTORY</div>
      {unequipped.map(item => (
        <div key={item.id} className="text-xs mb-1 cursor-pointer hover:bg-green-900" onClick={() => toggleEquip(item)}>
          {item.name} | {item.eq_type} | PWR:{item.power_stat} | AMMO:{item.ammo_cost} | {item.disposable ? '💥' : '—'} | {item.ability || '—'}
        </div>
      ))}
    </div>

    <button onClick={() => { setPlayerState(tempPlayer); setCombatStarted(true); runCombat(); }} className="bg-red-700 px-4 py-2 hover:bg-red-600">
      ENGAGE COMBAT
    </button>
  </div>
);
```

}

return (
<div className="max-w-4xl mx-auto">
<pre className="text-xs mb-4 whitespace-pre-wrap">{combatLog.join(’\n’)}</pre>
{combatResult && (
<div className="mb-4 text-center text-xl">
{combatResult === ‘clear’ && ‘🎉 GAME CLEAR 🎉’}
{combatResult === ‘victory’ && ‘✓ VICTORY’}
{combatResult === ‘defeat’ && ‘✗ DEFEAT’}
{combatResult === ‘draw’ && ‘— DRAW —’}
</div>
)}
<button onClick={handleContinue} className="bg-green-700 px-4 py-2 hover:bg-green-600">CONTINUE</button>
</div>
);
}

// === REWARD SCENE ===
function RewardScene({ playerState, setPlayerState, stageNum, advanceStage }) {
const stageInAct = getStageInAct(stageNum);
const stage = STAGE_DATA.find(s => s.stage === stageInAct);
const enemyBase = ENEMY_DATA.find(e => e.difficulty === stage.difficulty && e.rank === stage.rank);

const rarityMap = { NORMAL: 1, ELITE: 2, BOSS: 3 };
const rarity = rarityMap[enemyBase.rank];
const pool = EQUIPMENT_DATA.filter(e => e.rarity === rarity);
const [options] = useState(pool.sort(() => Math.random() - 0.5).slice(0, 3));

const [selectedReward, setSelectedReward] = useState(null);
const [selectedBonus, setSelectedBonus] = useState(null);

const handleClaim = () => {
let newState = { …playerState };

```
if (selectedReward === 'ammo') {
  newState.ammo += 5;
} else if (selectedReward) {
  const newItem = createItem(selectedReward);
  newState.inventory.push(newItem);
}

if (enemyBase.rank === 'BOSS') {
  newState.hull = newState.max_hull;
  newState.ammo += 12;

  if (selectedBonus === 'a') {
    newState.max_slots += 2;
  } else if (selectedBonus === 'b') {
    newState.max_slots += 1;
    newState.max_hull += 80;
    newState.hull += 80;
  } else if (selectedBonus === 'c') {
    newState.max_slots += 1;
    newState.ammo += 12;
  }
}

setPlayerState(newState);
advanceStage('main');
```

};

const canClaim = selectedReward && (enemyBase.rank !== ‘BOSS’ || selectedBonus);

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-xl mb-4">REWARDS</h2>

```
  <div className="mb-4">
    <div className="font-bold mb-2">Choose ONE:</div>
    <div className="text-sm cursor-pointer hover:bg-green-900 mb-1" onClick={() => setSelectedReward('ammo')}>
      {selectedReward === 'ammo' ? '✓' : '○'} +5 Ammo
    </div>
    {options.map(eq => (
      <div key={eq.name} className="text-xs cursor-pointer hover:bg-green-900 mb-1" onClick={() => setSelectedReward(eq.name)}>
        {selectedReward === eq.name ? '✓' : '○'} {eq.name} | {eq.eq_type} | PWR:{eq.power_stat} | AMMO:{eq.ammo_cost} | {eq.disposable ? '💥' : '—'} | {eq.ability || '—'}
      </div>
    ))}
  </div>

  {enemyBase.rank === 'BOSS' && (
    <div className="mb-4">
      <div className="font-bold mb-2">BOSS BONUS (Choose ONE):</div>
      <div className="text-sm cursor-pointer hover:bg-green-900 mb-1" onClick={() => setSelectedBonus('a')}>
        {selectedBonus === 'a' ? '✓' : '○'} Max Slots +2
      </div>
      <div className="text-sm cursor-pointer hover:bg-green-900 mb-1" onClick={() => setSelectedBonus('b')}>
        {selectedBonus === 'b' ? '✓' : '○'} Max Slots +1 & Max Hull +80
      </div>
      <div className="text-sm cursor-pointer hover:bg-green-900 mb-1" onClick={() => setSelectedBonus('c')}>
        {selectedBonus === 'c' ? '✓' : '○'} Max Slots +1 & Ammo +12
      </div>
    </div>
  )}

  <button onClick={handleClaim} disabled={!canClaim} className={`px-4 py-2 ${canClaim ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700 cursor-not-allowed'}`}>
    CLAIM
  </button>
</div>
```

);
}

// === DOCK SCENE ===
function DockScene({ playerState, setPlayerState, advanceStage }) {
const handleChoice = (choice) => {
let newState = { …playerState };
if (choice === ‘repair’) {
newState.hull = Math.min(newState.max_hull, newState.hull + Math.floor(newState.max_hull * 0.3));
} else {
newState.ammo += 7;
}
setPlayerState(newState);
advanceStage(‘main’);
};

const repairAmount = Math.floor(playerState.max_hull * 0.3);

return (
<div className="max-w-4xl mx-auto">
<h2 className="text-xl mb-4">DOCK</h2>

```
  <div className="mb-4 text-sm">
    <div className="font-bold mb-2">STAR CANINE STATUS</div>
    <div>Hull: {playerState.hull}/{playerState.max_hull}</div>
    <div>Ammo: {playerState.ammo}</div>
    <div>Equipment Slots: {playerState.equipped.length}/{playerState.max_slots}</div>
  </div>

  <div className="mb-4 text-sm">Choose ONE:</div>
  <button onClick={() => handleChoice('repair')} className="bg-green-700 px-4 py-2 hover:bg-green-600 mr-2">
    REPAIR (+{repairAmount} Hull)
  </button>
  <button onClick={() => handleChoice('resupply')} className="bg-green-700 px-4 py-2 hover:bg-green-600">
    RESUPPLY (+7 Ammo)
  </button>
</div>
```

);
}

// === GAME END SCENE ===
function GameEndScene({ playerState, stageNum, onRestart }) {
const cleared = stageNum === 30 && playerState.hull > 0;
return (
<div className="max-w-4xl mx-auto text-center">
<h2 className="text-2xl mb-4">{cleared ? ‘🎉 MISSION COMPLETE 🎉’ : ‘SIGNAL LOST’}</h2>
{cleared && (
<pre className="text-xs mb-4 whitespace-pre-wrap">{`K9 orbit cleared.
Solar Bear fleet: ELIMINATED.

Landing bay opened.
LAIKA signal detected.

“You came back.”

Mission status: SUCCESS`}</pre>
)}
{!cleared && <div className="mb-4">Final Stage: {stageNum}</div>}
<button onClick={onRestart} className="bg-green-700 px-4 py-2 hover:bg-green-600">RESTART</button>
</div>
);
}
