import React, { useState } from 'react';

// === ROBUST CSV PARSER ===
const parseCSV = (csv) => {
  const lines = csv.trim().split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    
    headers.forEach((header, i) => {
      let val = values[i] ? values[i].trim() : "";
      
      if (val.toLowerCase() === 'true') {
        obj[header] = true;
      } 
      else if (val.toLowerCase() === 'false') {
        obj[header] = false;
      } 
      else if (val === '0' || val === '') {
        obj[header] = (header === 'name' || header === 'eq_type' || header === 'ability' || header === 'mult_target' || header === 'skill') ? val : 0;
      } 
      else if (!isNaN(val)) {
        obj[header] = Number(val);
      } 
      else {
        obj[header] = val;
      }
    });
    return obj;
  });
};

// === DATA ===
const EQUIPMENT_CSV = `slots,name,power_stat,eq_type,rarity,disposable,mult_target,mult_power,ability
1,🚀 Lance,40,LONG,0,true,none,0,none
1,🚀 Meteor,45,LONG,1,true,none,0,none
2,🚀🛡️ Interceptor,50,LONG,1,true,none,0,+10 SHIELD
2,🚀 Harpoon,66,LONG,1,true,none,0,none
2,🚀⚠️ Isolation,75,LONG,1,true,LONG,0.9,none
2,🚀🔺 Javelin,39,LONG,1,true,LONG,1.2,none
2,🚀🔺 Gambit,55,LONG,2,true,LONG,1.3,none
1,🔫 Quantum Displacer,40,LONG,3,false,CLOSE,0.5,none
2,🔥🔺 Warhead Optimizer,0,MODULE,3,false,LONG,2,none
1,✈️ Drones,12,MID,1,false,none,0,none
1,✈️⚠️ Scavenger,20,MID,1,false,MID,0.9,none
1,✈️🔺 Squadron,8,MID,1,false,MID,1.2,none
1,✈️⤴️ Rookie fighter,5,MID,1,false,none,0,+2 damage per combat
1,✈️✈️ Blue Wolf,20,MID,2,false,none,0,none
1,🛫🔺 Swarm Core,0,MODULE,3,false,LONG,0.5,+10 ALL MID
1,🏗️🔺 Swarm Hanger,0,MODULE,3,false,MID,2,DISABLE_HULL_REPAIR
1,⚡ Fang,10,CLOSE,0,false,none,0,none
1,⚡ Claw,15,CLOSE,1,false,none,0,none
1,⚡⚠️ Static Blade,22,CLOSE,1,false,CLOSE,0.9,none
1,⚡️🛡️ Iron Beam,5,CLOSE,2,false,none,0,+10 SHIELD
1,⚡ Cudgel,25,CLOSE,2,false,none,0,none
1,⚡️🔺 Boost laser,10,CLOSE,2,false,CLOSE,1.2,none
1,⚡💥 Burn soul,40,CLOSE,1,true,none,0,none
1,💎🔺 Prismatic Focus,0,MODULE,3,false,CLOSE,2,Simultaneous
1,🛡️ Plating,14,SHIELD,0,false,none,0,none
1,🛡️ Veil,17,SHIELD,1,false,none,0,none
1,🛡️⚠️ Bulkhead,25,SHIELD,1,false,SHIELD,0.9,none
1,🛡️💥 Ephemera shield,33,SHIELD,1,true,none,0,none
1,🛡️🛡️ Aegis,30,SHIELD,2,false,none,0,none
1,🛡️🔺 Barrier,13,SHIELD,2,false,SHIELD,1.2,none
1,🟫🔺 Double Shield,0,MODULE,3,false,SHIELD,2,none
1,🔧 Repairer,10,HULL,1,false,none,0,none
1,🔧🔧 Veteran Repairer,15,HULL,2,false,none,0,none
1,♨️🔺 Recreational facility,2,MODULE,2,false,HULL,2,none`;

const ENEMY_CSV = `difficulty,name,hull,shield,rank,attack_LONG,attack_MID,attack_CLOSE,skill,skill_value
1,Skirmisher,30,0,NORMAL,0,0,10,none,0
2,Drifter,35,5,NORMAL,20,0,10,GATE,5
3,Self-Repairer,40,0,NORMAL,0,15,5,REGEN,8
4,Zombie,25,80,NORMAL,5,20,0,DEGEN,5
5,Relic Sentry,60,20,NORMAL,30,30,0,DORMANT,0
5,Kamikaze Frigate,10,100,NORMAL,0,0,0,EXPLOSIVE,60
6,Shield Gate,55,20,ELITE,15,15,20,GATE,20
8,Overload Enforcer,70,20,ELITE,20,20,25,OVERLOAD,2.0
9,Celestial Reaper,100,60,BOSS,40,20,35,COUNTER(LONG),10`;

const STAGE_CSV = `stage,type,difficulty,rank
1,combat,1,NORMAL
2,combat,2,NORMAL
3,combat,6,ELITE
4,dock,none,none
5,combat,3,NORMAL
6,combat,4,NORMAL
7,combat,8,ELITE
8,combat,5,NORMAL
9,dock,none,none
10,combat,9,BOSS`;

const EQUIPMENT_DATA = parseCSV(EQUIPMENT_CSV);
const ENEMY_DATA = parseCSV(ENEMY_CSV);
const STAGE_DATA = parseCSV(STAGE_CSV);

// === GAME LOGIC ===
const getActFactor = (stage) => {
  if (stage <= 10) return 1.0;
  if (stage <= 20) return 2.0;
  return 3.0;
};

const createEnemy = (stage) => {
  const stageInfo = STAGE_DATA.find(s => s.stage === ((stage - 1) % 10) + 1);
  if (!stageInfo || stageInfo.type !== 'combat') return null;
  
  const enemy = ENEMY_DATA.find(e => 
    e.difficulty === stageInfo.difficulty && e.rank === stageInfo.rank
  );
  
  if (!enemy) return null;
  
  const factor = getActFactor(stage);
  return {
    ...enemy,
    hull: enemy.hull * factor,
    shield: enemy.shield * factor,
    attack_LONG: enemy.attack_LONG * factor,
    attack_MID: enemy.attack_MID * factor,
    attack_CLOSE: enemy.attack_CLOSE * factor
  };
};

const createItem = (name) => {
  const base = EQUIPMENT_DATA.find(e => e.name === name);
  return { ...base, id: Math.random() };
};

const simulateCombat = (player, enemy, equipped) => {
  const log = [];
  let pHull = player.hull;
  let eHull = enemy.hull;
  let eShield = enemy.shield;
  
  // Calculate base sums
  let longBase = 0, midBase = 0, closeBase = 0, shieldBase = 0;
  equipped.forEach(item => {
    if (item.eq_type === 'LONG') longBase += item.power_stat;
    if (item.eq_type === 'MID') midBase += item.power_stat;
    if (item.eq_type === 'CLOSE') closeBase += item.power_stat;
    if (item.eq_type === 'SHIELD') shieldBase += item.power_stat;
  });
  
  // Calculate multipliers
  let longMult = 1, midMult = 1, closeMult = 1, shieldMult = 1;
  equipped.forEach(item => {
    const target = String(item.mult_target || "none");
    const power = parseFloat(item.mult_power);
    
    if (target !== "none" && !isNaN(power) && power > 0) {
      if (target === 'LONG') longMult *= power;
      if (target === 'MID') midMult *= power;
      if (target === 'CLOSE') closeMult *= power;
      if (target === 'SHIELD') shieldMult *= power;
    }
  });
  
  // Apply multipliers
  let longDmg = longBase * longMult;
  let midDmg = midBase * midMult;
  let closeDmg = closeBase * closeMult;
  let battleShield = shieldBase * shieldMult;
  
  // Apply flat ability bonuses
  let hasSimultaneous = false;
  let longItemCount = 0;
  
  equipped.forEach(item => {
    const ability = String(item.ability || "none");
    
    if (ability.includes('+10 SHIELD')) battleShield += 10;
    if (ability.includes('+10 ALL MID')) midDmg += 10;
    if (ability === 'Simultaneous') hasSimultaneous = true;
    if (item.eq_type === 'LONG') longItemCount++;
  });
  
  log.push(`=== COMBAT INITIALIZATION ===`);
  log.push(`Player: Hull ${Math.round(pHull)}, Shield ${Math.round(battleShield)}`);
  log.push(`Enemy: ${enemy.name} [${enemy.rank}]`);
  log.push(`Enemy: Hull ${Math.round(eHull)}, Shield ${Math.round(eShield)}`);
  if (enemy.skill !== 'none') log.push(`Enemy Skill: ${enemy.skill} (${enemy.skill_value})`);
  log.push(`Player Stats: LONG ${Math.round(longDmg)}, MID ${Math.round(midDmg)}, CLOSE ${Math.round(closeDmg)}`);
  log.push(``);
  
  const ranges = ['LONG', 'MID', 'CLOSE', 'CLOSE', 'MID', 'LONG'];
  
  for (let turn = 0; turn < 6; turn++) {
    const range = ranges[turn];
    log.push(`--- TURN ${turn + 1}: ${range} ---`);
    
    // Player action
    let pDmg = 0;
    if (range === 'LONG') pDmg = longDmg;
    if (range === 'MID') pDmg = midDmg;
    if (range === 'CLOSE') pDmg = closeDmg;
    
    if (pDmg > 0) {
      const absorbed = Math.min(eShield, pDmg);
      eShield -= absorbed;
      const overflow = pDmg - absorbed;
      if (overflow > 0) eHull -= overflow;
      log.push(`Player deals ${Math.round(pDmg)} damage`);
      log.push(`Enemy shield absorbs ${Math.round(absorbed)}, hull takes ${Math.round(overflow)}`);
    } else {
      log.push(`Player has no weapons for ${range} range`);
    }
    
    // COUNTER(LONG) check
    if (range === 'LONG' && enemy.skill === 'COUNTER(LONG)' && longItemCount > 0) {
      const counterDmg = enemy.skill_value * longItemCount;
      const absorbed = Math.min(battleShield, counterDmg);
      battleShield -= absorbed;
      const overflow = counterDmg - absorbed;
      if (overflow > 0) pHull -= overflow;
      log.push(`Enemy counters! ${Math.round(counterDmg)} damage`);
      log.push(`Shield absorbs ${Math.round(absorbed)}, hull takes ${Math.round(overflow)}`);
      
      if (pHull <= 0) {
        log.push(`SHIP DESTROYED BY COUNTER`);
        log.push(``);
        return { result: 'defeat', pHull: Math.round(pHull), log, equipped };
      }
    }
    
    // Check if enemy dies (skip if Simultaneous)
    if (!hasSimultaneous && eHull <= 0) {
      log.push(`ENEMY DESTROYED`);
      log.push(``);
      return { result: 'victory', pHull: Math.round(pHull), log, equipped };
    }
    
    // Enemy action - Passive skills first
    if (enemy.skill === 'REGEN') {
      eHull += enemy.skill_value;
      log.push(`Enemy regenerates ${enemy.skill_value} hull`);
    }
    if (enemy.skill === 'DEGEN') {
      eHull -= enemy.skill_value;
      log.push(`Enemy loses ${enemy.skill_value} hull (DEGEN)`);
      if (eHull <= 0) {
        log.push(`ENEMY DESTROYED (DEGEN)`);
        log.push(``);
        return { result: 'victory', pHull: Math.round(pHull), log, equipped };
      }
    }
    
    // Enemy attack
    let eDmg = 0;
    if (range === 'LONG') eDmg = enemy.attack_LONG;
    if (range === 'MID') eDmg = enemy.attack_MID;
    if (range === 'CLOSE') eDmg = enemy.attack_CLOSE;
    
    // DORMANT/OVERLOAD check
    if ((enemy.skill === 'DORMANT' || enemy.skill === 'OVERLOAD') && turn >= 3) {
      eDmg *= enemy.skill_value;
      log.push(`Enemy ${enemy.skill} activates! (x${enemy.skill_value})`);
    }
    
    // EXPLOSIVE check
    if (enemy.skill === 'EXPLOSIVE' && turn === 3) {
      eDmg += enemy.skill_value;
      log.push(`Enemy EXPLOSIVE detonates! (+${enemy.skill_value})`);
    }
    
    if (eDmg > 0) {
      const absorbed = Math.min(battleShield, eDmg);
      battleShield -= absorbed;
      const overflow = eDmg - absorbed;
      if (overflow > 0) pHull -= overflow;
      log.push(`Enemy deals ${Math.round(eDmg)} damage`);
      log.push(`Shield absorbs ${Math.round(absorbed)}, hull takes ${Math.round(overflow)}`);
    } else {
      log.push(`Enemy has no weapons for ${range} range`);
    }
    
    // EXPLOSIVE self-destruct
    if (enemy.skill === 'EXPLOSIVE' && turn === 3) {
      eHull = 0;
      log.push(`Enemy self-destructs!`);
    }
    
    // Check if player dies
    if (pHull <= 0) {
      log.push(`SHIP DESTROYED`);
      log.push(``);
      return { result: 'defeat', pHull: Math.round(pHull), log, equipped };
    }
    
    // Check if enemy dies (Simultaneous case)
    if (hasSimultaneous && eHull <= 0) {
      log.push(`ENEMY DESTROYED (Simultaneous)`);
      log.push(``);
      return { result: 'victory', pHull: Math.round(pHull), log, equipped };
    }
    
    // GATE check (end of turn)
    if (enemy.skill === 'GATE' && eShield < enemy.skill_value) {
      const restored = enemy.skill_value - eShield;
      eShield = enemy.skill_value;
      log.push(`Enemy shield GATE activates! (+${Math.round(restored)} shield)`);
    }
    
    log.push(``);
  }
  
  if (enemy.rank === 'BOSS' && eHull > 0) {
    log.push(`BOSS SURVIVED - DEFEAT`);
    return { result: 'defeat', pHull: Math.round(pHull), log, equipped };
  }
  
  log.push(`DRAW - Both ships survived`);
  return { result: 'draw', pHull: Math.round(pHull), log, equipped };
};

// === COMPONENTS ===
const StartScene = ({ onStart }) => (
  <div className="p-4 font-mono text-sm">
    <pre className="text-green-400 mb-4 whitespace-pre-wrap">{`> Incoming distress signal detected.
> Sender ID: LAIKA

"It's me.
K9 has fallen.
Solar Bear took the planet.
They took me too.
I know you weren't here.

Please… don't die."

> Signal lost.

> Setting course for K9.`}</pre>
    <button onClick={onStart} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
      BEGIN MISSION
    </button>
  </div>
);

const CombatScene = ({ player, enemy, stage, onComplete, hasStandardIssue, previousEquipped }) => {
  const [inventory, setInventory] = useState(() => {
    if (hasStandardIssue) {
      return [...player.inventory, createItem('🚀 Lance')];
    }
    return player.inventory;
  });
  const [equipped, setEquipped] = useState(previousEquipped || []);
  const [combatLog, setCombatLog] = useState(null);
  const [combatResult, setCombatResult] = useState(null);
  
  const getEquippedSlots = () => equipped.reduce((sum, item) => sum + item.slots, 0);
  
  const toggleEquip = (item) => {
    if (equipped.find(e => e.id === item.id)) {
      setEquipped(equipped.filter(e => e.id !== item.id));
    } else {
      const newSlots = getEquippedSlots() + item.slots;
      if (newSlots <= player.max_slots) {
        setEquipped([...equipped, item]);
      }
    }
  };
  
  const engage = () => {
    const result = simulateCombat(player, enemy, equipped);
    setCombatResult(result);
    setCombatLog(result.log);
  };
  
  const finish = () => {
    let newInv = [...inventory];
    
    // Remove disposables
    equipped.forEach(item => {
      if (item.disposable === true) {
        newInv = newInv.filter(i => i.id !== item.id);
      }
    });
    
    // Scale items with damage per combat
    equipped.forEach(item => {
      if (item.ability && item.ability.includes('damage per combat')) {
        const match = item.ability.match(/\+(\d+) damage per combat/);
        if (match) {
          const idx = newInv.findIndex(i => i.id === item.id);
          if (idx >= 0) newInv[idx].power_stat += Number(match[1]);
        }
      }
    });
    
    // Calculate hull repair
    let repair = 0;
    const disableRepair = equipped.some(item => 
      item.ability === 'DISABLE_HULL_REPAIR'
    );
    
    if (!disableRepair) {
      let hullBase = 0;
      let hullMult = 1;
      
      equipped.forEach(item => {
        if (item.eq_type === 'HULL') hullBase += item.power_stat;
      });
      
      equipped.forEach(item => {
        const target = String(item.mult_target || "none");
        const power = parseFloat(item.mult_power);
        if (target === 'HULL' && !isNaN(power) && power > 0) {
          hullMult *= power;
        }
      });
      
      repair = hullBase * hullMult;
    }
    
    onComplete({
      result: combatResult.result,
      hull: Math.min(combatResult.pHull + repair, player.max_hull),
      inventory: newInv,
      isBoss: enemy.rank === 'BOSS',
      equipped: equipped
    });
  };
  
  if (combatLog) {
    return (
      <div className="p-4 font-mono text-sm">
        <h2 className="text-xl mb-2 text-yellow-400">COMBAT LOG - Stage {stage}</h2>
        <pre className="text-green-400 mb-4 whitespace-pre-wrap text-xs">{combatLog.join('\n')}</pre>
        <button onClick={finish} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
          CONTINUE
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-4 font-mono text-sm">
      <h2 className="text-xl mb-2 text-yellow-400">STAGE {stage} - {enemy.name} [{enemy.rank}]</h2>
      {hasStandardIssue && <div className="text-green-400 mb-2">📦 Standard Issue Protocol: +1 🚀 Lance</div>}
      
      <div className="mb-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <h3 className="font-bold text-cyan-400">STAR CANINE</h3>
          <div>Hull: {Math.round(player.hull)}/{player.max_hull}</div>
        </div>
        <div>
          <h3 className="font-bold text-red-400">{enemy.name}</h3>
          <div>Hull: {Math.round(enemy.hull)} | Shield: {Math.round(enemy.shield)}</div>
          <div>ATK: L{Math.round(enemy.attack_LONG)} M{Math.round(enemy.attack_MID)} C{Math.round(enemy.attack_CLOSE)}</div>
          {enemy.skill !== 'none' && (
            <div className="text-yellow-400 mt-1">
              <div className="font-bold">Skill: {enemy.skill}</div>
              <div className="text-xs text-gray-300">
                {enemy.skill === 'REGEN' && `Heals ${enemy.skill_value} hull each turn`}
                {enemy.skill === 'DEGEN' && `Loses ${enemy.skill_value} hull each turn`}
                {enemy.skill === 'EXPLOSIVE' && `Deals +${enemy.skill_value} damage on turn 4, then dies`}
                {enemy.skill === 'OVERLOAD' && `Multiplies damage by ${enemy.skill_value}x after turn 3`}
                {enemy.skill === 'DORMANT' && `Multiplies damage by ${enemy.skill_value}x after turn 3`}
                {enemy.skill === 'GATE' && `Shield regenerates to ${enemy.skill_value} at end of turn`}
                {enemy.skill === 'COUNTER(LONG)' && `Counters ${enemy.skill_value} damage per LONG weapon`}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold mb-2 text-cyan-400">EQUIPMENT ({getEquippedSlots()}/{player.max_slots} slots)</h3>
        <div className="space-y-1 text-xs">
          {inventory.map(item => {
            const isEquipped = equipped.find(e => e.id === item.id);
            return (
              <div key={item.id} className="flex items-start">
                <button 
                  onClick={() => toggleEquip(item)}
                  className={`mr-2 px-2 py-1 text-xs ${isEquipped ? 'bg-green-600' : 'bg-gray-700'} hover:opacity-80`}
                >
                  {isEquipped ? '✓' : '○'}
                </button>
                <div className="flex-1">
                  <span className="font-bold">{item.name}</span> [{item.eq_type}] 
                  {item.slots > 1 && <span className="text-yellow-400"> ({item.slots} slots)</span>}
                  <div className="text-gray-400">
                    PWR:{item.power_stat}
                    {item.mult_target !== "none" && ` | ${item.mult_target} x${item.mult_power}`}
                    {item.disposable === true && ' | DISPOSABLE'}
                    {item.ability !== "none" && ` | ${item.ability}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <button 
        onClick={engage} 
        className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
      >
        ENGAGE COMBAT
      </button>
    </div>
  );
};

const RewardScene = ({ isBoss, enemyRank, stage, onSelect, player }) => {
  const [salvageItems] = useState(() => {
    const getRarityForRank = (rank) => {
      if (rank === 'NORMAL') return 1;
      if (rank === 'ELITE') return 2;
      if (rank === 'BOSS') return 3;
      return 1;
    };
    
    const rarity = getRarityForRank(enemyRank);
    return EQUIPMENT_DATA
      .filter(e => e.rarity === rarity)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  });
  
  const [selected, setSelected] = useState(null);
  const [bossReward, setBossReward] = useState(null);
  
  const bossRewards = isBoss && stage < 30 ? [
    { label: 'Expansion: +2 Max Slots', value: 'slots2' },
    { label: 'Reinforcement: +1 Max Slot + 80 Max Hull', value: 'slot_hull' },
    { label: 'Logistics: Standard Issue Protocol', value: 'standard_issue' }
  ] : [];
  
  const confirm = () => {
    const result = { salvage: selected };
    if (isBoss) {
      result.boss = bossReward;
      result.fullRepair = true;
    }
    onSelect(result);
  };
  
  return (
    <div className="p-4 font-mono text-sm">
      <h2 className="text-xl mb-4 text-green-400">VICTORY - Stage {stage}</h2>
      
      <div className="mb-4 text-xs">
        <h3 className="font-bold text-cyan-400 mb-1">STAR CANINE STATUS</h3>
        <div>Hull: {Math.round(player.hull)}/{player.max_hull}</div>
        <div>Slots: {player.max_slots}</div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold mb-2 text-cyan-400">SALVAGE (Pick 1):</h3>
        {salvageItems.map((item, i) => (
          <button
            key={i}
            onClick={() => setSelected(item.name)}
            className={`block mb-2 px-3 py-2 text-left w-full ${selected === item.name ? 'bg-green-600' : 'bg-gray-700'} hover:opacity-80`}
          >
            <div className="font-bold">{item.name} [{item.eq_type}]</div>
            <div className="text-xs text-gray-300">
              PWR:{item.power_stat}
              {item.slots > 1 && ` | ${item.slots} slots`}
              {item.mult_target !== "none" && ` | ${item.mult_target} x${item.mult_power}`}
              {item.disposable === true && ' | DISPOSABLE'}
              {item.ability !== "none" && ` | ${item.ability}`}
            </div>
          </button>
        ))}
      </div>
      
      {isBoss && stage < 30 && (
        <div className="mb-4 border-t border-gray-600 pt-4">
          <h3 className="font-bold mb-2 text-yellow-400">BOSS BONUS (Auto: Full Hull Repair)</h3>
          <div className="font-bold mb-1 text-cyan-400">SELECT ONE:</div>
          {bossRewards.map((r, i) => (
            <button
              key={i}
              onClick={() => setBossReward(r.value)}
              className={`block mb-2 px-3 py-2 text-left w-full ${bossReward === r.value ? 'bg-green-600' : 'bg-gray-700'} hover:opacity-80`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
      
      <button 
        onClick={confirm}
        disabled={!selected || (isBoss && stage < 30 && !bossReward)}
        className="px-4 py-2 bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
      >
        CONFIRM
      </button>
    </div>
  );
};

const DockScene = ({ player, onSelect }) => (
  <div className="p-4 font-mono text-sm">
    <h2 className="text-xl mb-4 text-cyan-400">DOCK STATION</h2>
    <div className="mb-4 text-xs">
      <h3 className="font-bold text-cyan-400 mb-1">STAR CANINE STATUS</h3>
      <div>Hull: {Math.round(player.hull)}/{player.max_hull}</div>
      <div>Slots: {player.max_slots}</div>
    </div>
    <button 
      onClick={() => onSelect('repair')} 
      className="px-4 py-2 bg-green-600 text-white hover:bg-green-700"
    >
      REPAIR (+30% Max Hull)
    </button>
  </div>
);

const GameEndScene = ({ victory, stage }) => (
  <div className="p-4 font-mono text-sm">
    <h2 className="text-xl mb-4 text-yellow-400">
      {victory ? 'MISSION COMPLETE' : 'SHIP DESTROYED'}
    </h2>
    <div className="mb-4">
      {victory ? (
        <pre className="text-green-400 whitespace-pre-wrap">{`K9 LIBERATED
LAIKA RESCUED

Captain's log: Stage ${stage}
The Star Canine returns home.`}</pre>
      ) : (
        <pre className="text-red-400 whitespace-pre-wrap">{`SIGNAL LOST

Captain's log: Stage ${stage}
The Star Canine falls silent.`}</pre>
      )}
    </div>
  </div>
);

// === MAIN APP ===
export default function StarCanine() {
  const [scene, setScene] = useState('start');
  const [stage, setStage] = useState(1);
  const [hasStandardIssue, setHasStandardIssue] = useState(false);
  const [equippedItems, setEquippedItems] = useState([]);
  const [player, setPlayer] = useState({
    hull: 200,
    max_hull: 200,
    max_slots: 6,
    inventory: [
      createItem('🚀 Lance'),
      createItem('⚡ Fang'),
      createItem('⚡ Fang'),
      createItem('🛡️ Plating')
    ]
  });
  
  const currentStageIndex = ((stage - 1) % 10) + 1;
  const currentStage = STAGE_DATA.find(s => s.stage === currentStageIndex);
  const enemy = currentStage?.type === 'combat' ? createEnemy(stage) : null;
  
  const advanceStage = (data) => {
    if (data?.result === 'defeat') {
      setScene('end');
      return;
    }
    
    if (data?.result === 'victory') {
      // Update equipped items after combat
      if (data.equipped) {
        setEquippedItems(data.equipped);
      }
      
      if (data.isBoss && stage === 30) {
        setPlayer(p => ({ ...p, hull: data.hull, inventory: data.inventory }));
        setScene('end');
        return;
      }
      setPlayer(p => ({ ...p, hull: data.hull, inventory: data.inventory }));
      setScene('reward');
      return;
    }
    
    if (data?.result === 'draw') {
      // Update equipped items after combat
      if (data.equipped) {
        setEquippedItems(data.equipped);
      }
      
      setPlayer(p => ({ ...p, hull: data.hull, inventory: data.inventory }));
      const nextStageNum = stage + 1;
      setStage(nextStageNum);
      const nextStageIndex = ((nextStageNum - 1) % 10) + 1;
      const nextStage = STAGE_DATA.find(s => s.stage === nextStageIndex);
      setScene(nextStage?.type || 'combat');
      return;
    }
  };
  
  const handleReward = (reward) => {
    let newPlayer = { ...player };
    
    if (reward.salvage) {
      newPlayer.inventory.push(createItem(reward.salvage));
    }
    
    if (reward.boss) {
      newPlayer.hull = newPlayer.max_hull;
      
      if (reward.boss === 'slots2') {
        newPlayer.max_slots += 2;
      }
      if (reward.boss === 'slot_hull') {
        newPlayer.max_slots += 1;
        newPlayer.max_hull += 80;
        newPlayer.hull = newPlayer.max_hull;
      }
      if (reward.boss === 'standard_issue') {
        newPlayer.max_slots += 1;
        setHasStandardIssue(true);
      }
    }
    
    setPlayer(newPlayer);
    const nextStageNum = stage + 1;
    setStage(nextStageNum);
    const nextStageIndex = ((nextStageNum - 1) % 10) + 1;
    const nextStage = STAGE_DATA.find(s => s.stage === nextStageIndex);
    setScene(nextStage?.type || 'combat');
  };
  
  const handleDock = () => {
    let newPlayer = { ...player };
    newPlayer.hull = Math.min(newPlayer.hull + Math.floor(newPlayer.max_hull * 0.3), newPlayer.max_hull);
    setPlayer(newPlayer);
    setStage(stage + 1);
    setScene('combat');
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {scene === 'start' && <StartScene onStart={() => setScene('combat')} />}
      {scene === 'combat' && enemy && (
        <CombatScene 
          player={player} 
          enemy={enemy} 
          stage={stage}
          onComplete={advanceStage}
          hasStandardIssue={hasStandardIssue}
          previousEquipped={equippedItems}
        />
      )}
      {scene === 'reward' && (
        <RewardScene 
          isBoss={enemy?.rank === 'BOSS'}
          enemyRank={enemy?.rank}
          stage={stage}
          onSelect={handleReward}
          player={player}
        />
      )}
      {scene === 'dock' && <DockScene player={player} onSelect={handleDock} />}
      {scene === 'end' && <GameEndScene victory={stage >= 30} stage={stage} />}
    </div>
  );
}
