import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameEvent, Enemy, CombatLogMessage, Character, StatusEffect, PlayerAbility, EquipmentSlot, Item, ArchetypeName, ItemAffix, AbilityRankData } from '../types';
import { Element } from '../types';
import { Icons, ARCHETYPES, PLAYER_ABILITIES } from '../constants';
import { soundEffects } from '../sound'; // Aktiverar importen av ljudeffekter
import CombatBackground from './CombatBackground'; // Import the new CombatBackground component
import { createLogMessage, applyPlayerAbility, processEnemyTurn, applyStatusEffectDamageAndDuration, getRandom } from '../utils/combatCalculations'; // Import refactored functions

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

type GameState = 'INTRO' | 'ACTIVE' | 'PLAYER_TURN' | 'EXECUTING' | 'VICTORY' | 'DEFEAT';
type AnimationState = 'idle' | 'attacking' | 'hit' | 'casting';


type Actor = {
  id: string;
  type: 'PLAYER' | 'ENEMY';
  name: string;
  icon: React.FC;
  hp: number;
  maxHp: number;
  atb: number;
  animationState: AnimationState;
  statusEffects: StatusEffect[];
  isDefeated: boolean;
  ref: React.RefObject<HTMLDivElement>;
};

type DamagePopupType = 'damage' | 'crit' | 'heal' | 'miss' | 'status_damage';
type DamagePopup = { id: number; text: string; x: number; y: number; type: DamagePopupType; };
type VisualEffect = { id: number; type: 'slash' | 'fireball' | 'heal' | 'haste'; targetId: string; originId: string; };

const resourceThemes: Record<string, { text: string; bg: string }> = {
    'Hetta': { text: 'text-orange-400', bg: 'bg-orange-500' },
    'Styrka': { text: 'text-amber-500', bg: 'bg-amber-600' },
    'Energi': { text: 'text-sky-400', bg: 'bg-sky-500' },
    'Flöde': { text: 'text-blue-400', bg: 'bg-blue-500' },
    'Aether': { text: 'text-blue-400', bg: 'bg-blue-500' },
};

// --- Archetype-specific resource constants ---
const ENERGI_REGEN_PER_TURN = 25;
const HETTA_DECAY_PER_TURN = 10;
const STYRKA_PER_HIT = 15;
const STYRKA_PER_DEFEND = 25;
const FLODE_PER_HEAL_CC = 30;

interface EventViewProps {
  event: GameEvent;
  character: Character;
  playerStats: { health: number; maxHealth: number; aether: number; maxAether: number; resourceName: string; damage: number; armor: number; dodge: number; crit: number; intelligence: number; abilities: PlayerAbility[] };
  onComplete: (rewards: GameEvent['rewards']) => void;
  equipment: Record<EquipmentSlot, Item | null>;
  unlockedSkills: Map<string, number>;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>; // Added setCharacter prop
}

const EventView: React.FC<EventViewProps> = ({ event, character, playerStats, onComplete, equipment, unlockedSkills, setCharacter }) => {
  const [gameState, setGameState] = useState<GameState>('INTRO');
  const [actors, setActors] = useState<Actor[]>([]);
  const [playerResource, setPlayerResource] = useState(playerStats.aether);
  const [log, setLog] = useState<string[]>([]);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showAbilityMenu, setShowAbilityMenu] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const enemyRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const resourceTheme = resourceThemes[playerStats.resourceName] || resourceThemes['Aether'];

  // Initialize combatants
  useEffect(() => {
    const archetypeIcon = ARCHETYPES[character.archetype]?.icon || Icons.Start; // Corrected access
    const playerActor: Actor = {
      id: character.id, type: 'PLAYER', name: character.name, icon: archetypeIcon, // Use character.id
      hp: playerStats.health, maxHp: playerStats.maxHealth, atb: 0, 
      animationState: 'idle', statusEffects: [], isDefeated: false, ref: playerRef
    };
    const enemyActors: Actor[] = event.enemies.map((e, i) => {
      enemyRefs.current[i] = React.createRef<HTMLDivElement>();
      return {
        id: e.id, type: 'ENEMY', name: e.name, icon: e.icon,
        hp: e.stats.health, maxHp: e.stats.maxHealth, atb: Math.random() * 50, 
        animationState: 'idle', statusEffects: [], isDefeated: false, ref: enemyRefs.current[i]
      }
    });
    setActors([playerActor, ...enemyActors]);
    setLog([`${event.title}: Striden börjar!`]);
    setTimeout(() => setGameState('ACTIVE'), 1000);
  }, [event, character, playerStats]);

  const addVisualEffect = (type: VisualEffect['type'], originId: string, targetId: string) => {
      const newVfx = { id: Date.now() + Math.random(), type, originId, targetId };
      setVisualEffects(vfx => [...vfx, newVfx]);
      setTimeout(() => setVisualEffects(vfx => vfx.filter(v => v.id !== newVfx.id)), 1000);
  }

  const addDamagePopup = (text: string, actorId: string, type: DamagePopupType) => {
    const actor = actors.find(a => a.id === actorId);
    if (!actor?.ref?.current || !popupContainerRef.current) return;
    
    const actorRect = actor.ref.current.getBoundingClientRect();
    const containerRect = popupContainerRef.current.getBoundingClientRect();
    
    const x = actorRect.left - containerRect.left + (actorRect.width / 2) - 20; // Adjust for centering
    const y = actorRect.top - containerRect.top;
    
    setDamagePopups(p => [...p, { id: Date.now() + Math.random(), text, x, y, type }]);
    setTimeout(() => setDamagePopups(p => p.slice(1)), 1200);
  };
  
  const addLogMessage = (message: string) => setLog(l => [message, ...l.slice(0, 4)]);
  
  const updateActorState = useCallback((id: string, updates: Partial<Actor>) => {
      setActors(currentActors => currentActors.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const processTurn = useCallback(async (actorId: string) => {
      let actor = actors.find(a => a.id === actorId);
      if (!actor || actor.isDefeated) {
          if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
             setGameState('ACTIVE');
          }
          return;
      }
      
      let hp = actor.hp;
      let newStatusEffects: StatusEffect[] = [...actor.statusEffects]; // Start with current effects

      // --- Process Environment Effects ---
      if (event.environment) {
          const env = event.environment;
          for (const effect of env.effects) {
              let targetIsAffected = false;
              const actorElement = actor.type === 'PLAYER' ? character.element : event.enemies.find(e => e.id === actor.id)?.element;

              switch (effect.targetScope) {
                  case 'all':
                      targetIsAffected = true;
                      break;
                  case 'player':
                      targetIsAffected = actor.type === 'PLAYER';
                      break;
                  case 'enemies':
                      targetIsAffected = actor.type === 'ENEMY';
                      break;
                  case 'non_elemental':
                      targetIsAffected = actorElement !== effect.targetElement;
                      break;
                  case 'elemental':
                      targetIsAffected = actorElement === effect.targetElement;
                      break;
              }

              if (targetIsAffected) {
                  if (effect.type === 'dot' && effect.value) {
                      hp = Math.max(0, hp - effect.value);
                      addLogMessage(`${actor.name} tar ${effect.value} skada från ${env.name}!`);
                      addDamagePopup(effect.value.toString(), actor.id, 'status_damage');
                      await sleep(200);
                  } else if (effect.type === 'status_apply' && effect.status && effect.statusChance && Math.random() * 100 < effect.statusChance) {
                      const existingStatus = newStatusEffects.find(s => s.type === effect.status);
                      if (!existingStatus) {
                          const newStatus: StatusEffect = { type: effect.status, duration: effect.statusDuration || 1 } as StatusEffect;
                          if (effect.status === 'burning' || effect.status === 'poisoned' || effect.status === 'retaliating' || effect.status === 'steamed') {
                              (newStatus as any).damage = effect.value; // Assuming value is damage for these
                          }
                          if (effect.status === 'regenerating') {
                              (newStatus as any).heal = effect.value;
                          }
                          newStatusEffects.push(newStatus);
                          addLogMessage(`${actor.name} blir påverkad av ${env.name} och får status: ${effect.status}!`);
                          await sleep(200);
                      }
                  }
                  // Stat_modifier and atb_modifier can be implemented later if needed
              }
          }
      }

      // Process actor's own status effects (after environment effects)
      let effectsAfterTurn: StatusEffect[] = [];
      for (const effect of newStatusEffects) { // Iterate over potentially updated effects
          if (effect.type === 'burning' && 'damage' in effect && effect.damage) {
              hp = Math.max(0, hp - effect.damage);
              soundEffects.burn(); // Aktiverad ljudeffekt
              addLogMessage(`${actor.name} tar ${effect.damage} brännskada!`);
              addDamagePopup(effect.damage.toString(), actor.id, 'status_damage');
          }
           if (effect.type === 'poisoned' && 'damage' in effect && effect.damage) {
              hp = Math.max(0, hp - effect.damage);
              addLogMessage(`${actor.name} tar ${effect.damage} giftskada!`);
              addDamagePopup(effect.damage.toString(), actor.id, 'status_damage');
          }
           if (effect.type === 'regenerating' && 'heal' in effect && effect.heal) {
              hp = Math.min(actor.maxHp, hp + effect.heal);
              addLogMessage(`${actor.name} regenererar ${effect.heal} hälsa!`);
              addDamagePopup(`+${effect.heal}`, actor.id, 'heal');
          }
          if (effect.type === 'steamed' && 'damage' in effect && effect.damage) {
              hp = Math.max(0, hp - effect.damage);
              addLogMessage(`${actor.name} tar ${effect.damage} ångskada!`);
              addDamagePopup(effect.damage.toString(), actor.id, 'status_damage');
          }
          if (effect.type === 'bleeding' && 'damage' in effect && effect.damage) {
              hp = Math.max(0, hp - effect.damage);
              addLogMessage(`${actor.name} blöder och tar ${effect.damage} skada!`);
              addDamagePopup(effect.damage.toString(), actor.id, 'status_damage');
          }


          if (effect.duration > 1) {
              const newDuration = effect.duration - 1;
              switch (effect.type) {
                  case 'burning': effectsAfterTurn.push({ type: 'burning', damage: effect.damage, duration: newDuration }); break;
                  case 'poisoned': effectsAfterTurn.push({ type: 'poisoned', damage: effect.damage, duration: newDuration }); break;
                  case 'retaliating': effectsAfterTurn.push({ type: 'retaliating', damage: effect.damage, duration: newDuration }); break;
                  case 'regenerating': effectsAfterTurn.push({ type: 'regenerating', heal: effect.heal, duration: newDuration }); break;
                  case 'defending': effectsAfterTurn.push({ type: 'defending', duration: newDuration }); break;
                  case 'hasted': effectsAfterTurn.push({ type: 'hasted', duration: newDuration }); break;
                  case 'slowed': effectsAfterTurn.push({ type: 'slowed', duration: newDuration }); break;
                  case 'blinded': effectsAfterTurn.push({ type: 'blinded', duration: newDuration }); break;
                  case 'full_flow': effectsAfterTurn.push({ type: 'full_flow', duration: newDuration }); break;
                  case 'overheated': effectsAfterTurn.push({ type: 'overheated', duration: newDuration }); break;
                  case 'rooted': effectsAfterTurn.push({ type: 'rooted', duration: newDuration }); break;
                  case 'steamed': effectsAfterTurn.push({ type: 'steamed', duration: newDuration, damage: effect.damage, accuracyReduction: effect.accuracyReduction }); break;
                  case 'paralyzed': effectsAfterTurn.push({ type: 'paralyzed', duration: newDuration }); break;
                  case 'bleeding': effectsAfterTurn.push({ type: 'bleeding', duration: newDuration, damage: effect.damage }); break;
                  case 'frightened': effectsAfterTurn.push({ type: 'frightened', duration: newDuration, chanceToMissTurn: effect.chanceToMissTurn, chanceToAttackRandom: effect.chanceToAttackRandom }); break;
                  case 'reflecting': effectsAfterTurn.push({ type: 'reflecting', duration: newDuration, element: effect.element, value: effect.value }); break;
                  case 'absorbing': effectsAfterTurn.push({ type: 'absorbing', duration: newDuration, element: effect.element, value: effect.value }); break;
                  case 'armor_reduction': effectsAfterTurn.push({ type: 'armor_reduction', duration: newDuration, value: effect.value }); break;
                  case 'stunned': effectsAfterTurn.push({ type: 'stunned', duration: newDuration }); break;
                  case 'frozen': effectsAfterTurn.push({ type: 'frozen', duration: newDuration }); break;
                  case 'damage_reduction': effectsAfterTurn.push({ type: 'damage_reduction', duration: newDuration, value: effect.value, isPercentage: effect.isPercentage }); break;
              }
          } else {
             if (effect.type === 'rooted') addLogMessage(`${actor.name} är inte längre rotad.`);
             if (effect.type === 'blinded') addLogMessage(`${actor.name} är inte längre bländad.`);
             if (effect.type === 'steamed') addLogMessage(`${actor.name} är inte längre ångad.`);
             if (effect.type === 'paralyzed') addLogMessage(`${actor.name} är inte längre förlamad.`);
             if (effect.type === 'frightened') addLogMessage(`${actor.name} är inte längre skräckslagen.`);
             if (effect.type === 'reflecting') addLogMessage(`${actor.name} reflekterar inte längre skada.`);
             if (effect.type === 'absorbing') addLogMessage(`${actor.name} absorberar inte längre skada.`);
             if (effect.type === 'armor_reduction') addLogMessage(`${actor.name}s rustning är återställd.`);
             if (effect.type === 'stunned') addLogMessage(`${actor.name} är inte längre bedövad.`);
             if (effect.type === 'frozen') addLogMessage(`${actor.name} är inte längre frusen.`);
             if (effect.type === 'damage_reduction') addLogMessage(`${actor.name}s skadereduktion är borta.`);
          }
      }
      
      updateActorState(actorId, { hp, statusEffects: effectsAfterTurn });
      await sleep(500);

      if (hp <= 0) {
          updateActorState(actorId, { isDefeated: true });
          addLogMessage(`${actor.name} besegrades av en effekt!`);
           if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
              setGameState('ACTIVE');
           }
          return;
      }
      
      actor = actors.find(a => a.id === actorId)!; // Re-fetch actor state

      // Actor takes their action
      const isRooted = actor.statusEffects.some(e => e.type === 'rooted');
      if (isRooted) {
        addLogMessage(`${actor.name} är rotad och kan inte agera!`);
        updateActorState(actorId, { atb: 0 });
        await sleep(500);
        if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
            setGameState('ACTIVE');
        }
        return;
      }


      if (actor.type === 'PLAYER') {
          // --- Passive Resource Generation/Decay ---
          switch (character.archetype) {
            case 'Stormdansaren':
              setPlayerResource(r => Math.min(playerStats.maxAether, r + ENERGI_REGEN_PER_TURN));
              addLogMessage(`Du regenererar ${ENERGI_REGEN_PER_TURN} Energi.`);
              break;
            case 'Pyromanten':
              setPlayerResource(r => Math.max(0, r - HETTA_DECAY_PER_TURN));
              break;
          }
          setGameState('PLAYER_TURN');
          setShowCommandMenu(true);
      } else {
          const enemyData = event.enemies.find(e => e.id === actor.id);
          if (!enemyData) return;

          const { updatedPlayer: newPlayer, updatedEnemies: newEnemies, log: enemyLog, damageToPlayer: enemyDamage } = processEnemyTurn(
              character, // Pass the actual character object
              event.enemies, // Pass the original enemy data for reference
              enemyData
          );
          
          // Update player and enemy states based on enemy turn
          setCharacter(prevChar => ({ ...prevChar!, ...newPlayer }));
          setActors(currentActors => currentActors.map(a => {
              const updatedEnemy = newEnemies.find(e => e.id === a.id);
              if (updatedEnemy) {
                  return { ...a, hp: updatedEnemy.stats.health, statusEffects: updatedEnemy.statusEffects || [] };
              }
              return a;
          }));
          addLogMessage(enemyLog.map(msg => msg.text).join('\n')); // Add enemy turn log messages
          addDamagePopup(enemyDamage.toString(), 'player', 'damage'); // Show damage popup for player

          if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
             setGameState('ACTIVE');
          }
      }

  }, [actors, updateActorState, gameState, event.environment, character, playerStats.maxAether, event.enemies, addLogMessage, addDamagePopup, setCharacter]); // Added setCharacter to dependencies

  // ATB Game Loop: Ticks the ATB bars up.
  useEffect(() => {
    if (gameState !== 'ACTIVE') return;

    const interval = setInterval(() => {
      setActors(currentActors => {
        // Stop ticking if a turn is already ready to be processed.
        const turnIsReady = currentActors.some(a => a.atb >= 100 && !a.isDefeated);
        if (turnIsReady) {
          return currentActors;
        }

        return currentActors.map(actor => {
          if (actor.isDefeated) return actor;
          
          const isHasted = actor.statusEffects.some(e => e.type === 'hasted');
          const isSlowed = actor.statusEffects.some(e => e.type === 'slowed');
          let atbRate = 1.5;
          if(isHasted) atbRate *= 1.5;
          if(isSlowed) atbRate *= 0.5;

          const newAtb = actor.atb + atbRate;

          return { ...actor, atb: newAtb };
        });
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameState]);

  // Turn Processor: Watches for an actor whose ATB is full and starts their turn.
  useEffect(() => {
    if (gameState !== 'ACTIVE') return;

    const turnTaker = actors.find(a => a.atb >= 100 && !a.isDefeated);
    if (turnTaker) {
      setGameState('EXECUTING');
      processTurn(turnTaker.id);
    }
  }, [actors, gameState, processTurn]);

  const applyAffix = async (affix: ItemAffix, triggerActor: Actor, targetActor: Actor) => {
    if (Math.random() * 100 > affix.effect.chance) return;
    
    addLogMessage(`Föremålseffekt: ${affix.description}`);

    if (affix.effect.type === 'DEAL_ELEMENTAL_DAMAGE') {
        const damage = affix.effect.damage;
        const targetArmor = targetActor.type === 'PLAYER' ? playerStats.armor : (event.enemies.find(e => e.id === targetActor.id)?.stats.armor || 0);
        const finalDamage = Math.max(1, damage - targetArmor);
        const newHp = Math.max(0, targetActor.hp - finalDamage);

        updateActorState(targetActor.id, { hp: newHp, animationState: 'hit' });
        addDamagePopup(finalDamage.toString(), targetActor.id, 'status_damage');
        if (newHp <= 0) {
            updateActorState(targetActor.id, { isDefeated: true });
            addLogMessage(`${targetActor.name} besegrades av en föremålseffekt!`);
        }
        await sleep(300);
        updateActorState(targetActor.id, { animationState: 'idle' });
    }
    // Future affix types like APPLY_STATUS would go here
  };
  
  const performAttack = async (attackerId: string, defenderId: string, baseDamage: number, damageElement: Element = Element.NEUTRAL, isSkill: boolean = false, skillEffect?: () => void) => {
      // FIX: Change attacker to let to allow reassignment later
      let attacker = actors.find(a => a.id === attackerId);
      let defender = actors.find(a => a.id === defenderId);
      if(!attacker || !defender || defender.isDefeated) return;
      
      let hettaBonus = 0;
      if (attacker.type === 'PLAYER' && character.archetype === 'Pyromanten') {
        hettaBonus = Math.floor(playerResource / 10);
      }
      const totalBaseDamage = baseDamage + hettaBonus;

      if (!isSkill) soundEffects.slash(); // Aktiverad ljudeffekt
      updateActorState(attackerId, { animationState: 'attacking', atb: 0, statusEffects: attacker.statusEffects.filter(e => e.type !== 'defending') });
      await sleep(300);

      const isBlinded = attacker.statusEffects.some(e => e.type === 'blinded');
      const dodgeRoll = Math.random() * 100;
      const isDodge = isBlinded ? dodgeRoll < 50 : dodgeRoll < (defender.type === 'PLAYER' ? playerStats.dodge : 0);

      if(isDodge) {
          soundEffects.miss(); // Aktiverad ljudeffekt
          addDamagePopup("MISS", defenderId, 'miss');
          addLogMessage(`${attacker.name} attackerade ${defender.name}, men missade!`);
      } else {
          soundEffects.hit(); // Aktiverad ljudeffekt
          addVisualEffect(isSkill ? 'fireball' : 'slash', attackerId, defenderId);
          await sleep(200);

          const isCrit = !isSkill && Math.random() * 100 < (attacker.type === 'PLAYER' ? playerStats.crit : 10);
          let damage = isCrit ? totalBaseDamage * 1.5 : totalBaseDamage;
          const armor = defender.type === 'PLAYER' ? playerStats.armor : (event.enemies.find(e => e.id === defenderId)?.stats.armor || 0);
          
          const enemyData = event.enemies.find(e => e.id === defenderId);
          const resistance = defender.type === 'ENEMY' && enemyData?.resistances ? (enemyData.resistances[damageElement] || 0) : 0;
          const resistanceMultiplier = 1 - (resistance / 100);

          if (resistance > 5) addLogMessage("Inte särskilt effektivt...");
          if (resistance < -5) addLogMessage("Super effektivt!");

          const isDefending = defender.statusEffects.some(e => e.type === 'defending');
          const finalDamage = Math.floor(Math.max(1, (damage - armor) * resistanceMultiplier) * (isDefending ? 0.5 : 1));
          
          let newHp = Math.max(0, defender.hp - finalDamage);
          let defenderUpdates: Partial<Actor> = { animationState: 'hit' };
          
          if (defender.type === 'PLAYER' && character.archetype === 'Stenväktaren') {
            setPlayerResource(r => Math.min(playerStats.maxAether, r + STYRKA_PER_HIT));
            addLogMessage(`Du bygger ${STYRKA_PER_HIT} Styrka från träffen.`);
          }

          const attackerData = attacker.type === 'ENEMY' ? event.enemies.find(e => e.id === attackerId) : null;
          if (attackerData?.onHitEffect) {
              const effect = attackerData.onHitEffect;
              let existingEffects = defender.statusEffects;
              let statusToAdd: StatusEffect | undefined;
              let logMsg = "";
          
              // FIX: Use a switch statement for robust type narrowing on discriminated unions.
              // This resolves an issue where the if-else chain failed to correctly narrow the type of `effect`,
              // leading to a TypeScript error when creating statusToAdd.
              switch (effect.type) {
                case 'burning':
                    statusToAdd = { type: 'burning', duration: effect.duration, damage: effect.damage };
                    existingEffects = existingEffects.filter(e => e.type !== 'burning');
                    logMsg = `${defender.name} sattes i brand!`;
                    break;
                case 'poison':
                    statusToAdd = { type: 'poisoned', duration: effect.duration, damage: effect.damage };
                    existingEffects = existingEffects.filter(e => e.type !== 'poisoned');
                    logMsg = `${defender.name} blev förgiftad!`;
                    break;
                case 'slow':
                    statusToAdd = { type: 'slowed', duration: effect.duration };
                    existingEffects = existingEffects.filter(e => e.type !== 'slowed');
                    logMsg = `${defender.name} blev långsammare!`;
                    break;
              }
          
              if (statusToAdd) {
                  defenderUpdates.statusEffects = [...existingEffects, statusToAdd];
                  addLogMessage(logMsg);
              }
          }
          
          if (skillEffect) skillEffect();
          
          addDamagePopup(finalDamage.toString(), defenderId, isCrit ? 'crit' : 'damage');
          const hettaLog = hettaBonus > 0 ? ` (+${hettaBonus} från Hetta)` : "";
          addLogMessage(`${attacker.name} skadade ${defender.name} för ${finalDamage} HP${hettaLog}.`);
          
          // Must apply damage before checking affixes, so they have the latest HP
          defender = { ...defender, hp: newHp };
          updateActorState(defenderId, { ...defenderUpdates, hp: newHp });

          // --- AFFIX PROCESSING ---
          if (attacker.type === 'PLAYER') {
            // FIX: Explicitly cast the array from Object.values to prevent 'unknown' type errors.
            for (const item of Object.values(equipment) as (Item | null)[]) {
                if (item?.affix?.trigger === 'ON_HIT') {
                    await applyAffix(item.affix, attacker, defender);
                    defender = actors.find(a => a.id === defenderId)!; // Refresh defender state after affix
                    if (defender.isDefeated) break;
                }
            }
          } else { // Enemy is attacker
            // FIX: Explicitly cast the array from Object.values to prevent 'unknown' type errors.
            for (const item of Object.values(equipment) as (Item | null)[]) {
                if (item?.affix?.trigger === 'ON_TAKE_DAMAGE') {
                     await applyAffix(item.affix, defender, attacker);
                     attacker = actors.find(a => a.id === attackerId)!; // Refresh attacker state
                     if (attacker.isDefeated) break;
                }
                // Check for retaliation from player's Magma Armor
                const playerActor = actors.find(a => a.type === 'PLAYER');
                if (playerActor && !playerActor.isDefeated) {
                    const retaliateEffect = playerActor.statusEffects.find(e => e.type === 'retaliating');
                    if (retaliateEffect && retaliateEffect.type === 'retaliating' && Math.random() * 100 < 30) { // 30% chance to retaliate
                        await sleep(300);
                        const retaliateDamage = retaliateEffect.damage;
                        const newAttackerHp = Math.max(0, attacker.hp - retaliateDamage);
                        updateActorState(attackerId, { hp: newAttackerHp, animationState: 'hit' });
                        addDamagePopup(retaliateDamage.toString(), attackerId, 'damage');
                        addLogMessage(`${playerActor.name}'s Magma Armor skadar ${attacker.name}!`);
                        if (newAttackerHp <= 0) {
                            updateActorState(attackerId, { isDefeated: true });
                            addLogMessage(`${attacker.name} besegrades av Magma Armor!`);
                        }
                        await sleep(300);
                        updateActorState(attackerId, { animationState: 'idle' });
                    }
                }
            }
          }

          if(newHp <= 0 && !defender.isDefeated) { // Check again after affixes
              updateActorState(defenderId, { isDefeated: true });
              addLogMessage(`${defender.name} har besegrats!`);
          }
      }
      
      await sleep(300); // hit flash duration
      updateActorState(attackerId, { animationState: 'idle' });
      updateActorState(defenderId, { animationState: 'idle' });
  };

  const handlePlayerAction = async (action: 'ATTACK' | 'SKILL' | 'DEFEND', abilityId?: string) => {
      setShowCommandMenu(false);
      setShowAbilityMenu(false);
      setGameState('EXECUTING');
      let player = actors.find(a => a.type === 'PLAYER');
      if (!player) return;

      const abilityInfo = abilityId ? PLAYER_ABILITIES[abilityId] : null;
      const rank = abilityId ? (unlockedSkills.get(abilityId) || 1) : 1;
      const rankData = abilityInfo ? abilityInfo.ranks[rank - 1] : null;
      
      let target = actors.find(a => a.id === selectedTarget);
      
      const hasFullFlow = player.statusEffects.some(e => e.type === 'full_flow');
      let effectiveCost = rankData ? rankData.resourceCost : 0;
      if (hasFullFlow) {
        effectiveCost = 0;
      }

      // --- RESOURCE CHECK AND SPEND ---
      let canAfford = true;
      switch (character.archetype) {
        case 'Pyromanten':
            if (player.statusEffects.some(e => e.type === 'overheated')) {
                addLogMessage("Du är överhettad och kan inte generera Hetta!");
                effectiveCost = 0; // Prevent Hetta gain
            } else {
                const hettaGained = rankData ? rankData.resourceCost : 0;
                const newHetta = playerResource + hettaGained;
                if (newHetta >= playerStats.maxAether) {
                    addLogMessage("ÖVERHETTAD! Hetta exploderar och skadar dig!");
                    const selfDamage = Math.floor(playerStats.maxHealth * 0.2);
                    updateActorState(player.id, { 
                        hp: Math.max(0, player.hp - selfDamage),
                        statusEffects: [...player.statusEffects, { type: 'overheated', duration: 2 }]
                    });
                    addDamagePopup(selfDamage.toString(), player.id, 'status_damage');
                    setPlayerResource(0);
                } else {
                    setPlayerResource(newHetta);
                    addLogMessage(`Du bygger ${hettaGained} Hetta.`);
                }
            }
            break;
        case 'Stenväktaren':
            if (action === 'DEFEND') {
                setPlayerResource(r => Math.min(playerStats.maxAether, r + STYRKA_PER_DEFEND));
                addLogMessage(`Du bygger ${STYRKA_PER_DEFEND} Styrka.`);
            } else if (playerResource < effectiveCost) {
                canAfford = false;
            } else {
                setPlayerResource(r => r - effectiveCost);
            }
            break;
        case 'Tidvattenvävaren':
        case 'Stormdansaren':
        default:
            if (playerResource < effectiveCost) {
                canAfford = false;
            } else {
                setPlayerResource(r => r - effectiveCost);
            }
            break;
      }
      
      if (!canAfford) {
          addLogMessage(`Inte tillräckligt med ${playerStats.resourceName}!`);
          setGameState('ACTIVE');
          return;
      }
      
      if (action === 'DEFEND') {
          updateActorState(player.id, { atb: 0, statusEffects: [...player.statusEffects, {type: 'defending', duration: 3}] });
          addLogMessage("Du intar en defensiv position.");
          await sleep(500);
      } else if (action === 'ATTACK') {
          if(target) await performAttack(player.id, target.id, playerStats.damage, Element.NEUTRAL);
      } else if (action === 'SKILL' && abilityInfo && rankData) {
          addLogMessage(`Du använder ${abilityInfo.name}!`);
          
          const baseSkillDamage = playerStats.damage * 0.5 + playerStats.intelligence * 1.5;

          // --- SKILL LOGIC ---
          let healAmount = 0;
          switch(abilityInfo.id) {
            case 'fire_1':
            case 'fire_3':
               if(target && rankData.damageMultiplier) {
                 // Reaction: Water + Burning = Steamed
                 const isBurning = target.statusEffects.some(e => e.type === 'burning');
                 if (abilityInfo.element === Element.WATER && isBurning) {
                     addLogMessage(`${target.name}s eld släcktes av vattnet och skapade ånga!`);
                     updateActorState(target.id, {
                         statusEffects: target.statusEffects.filter(e => e.type !== 'burning')
                     });
                     const newStatus: StatusEffect = { type: 'steamed', duration: 2, damage: Math.floor(baseSkillDamage * 0.2), accuracyReduction: 20 };
                     updateActorState(target.id, {
                         statusEffects: [...target.statusEffects.filter(e => e.type !== 'steamed' && e.type !== 'burning'), newStatus]
                     });
                     addDamagePopup(newStatus.damage!.toString(), target.id, 'status_damage');
                     await sleep(500);
                 } 
                 // Reaction: Fire + Slowed = Steamed
                 else if (abilityInfo.element === Element.FIRE && target.statusEffects.some(e => e.type === 'slowed')) {
                     addLogMessage(`${target.name}s kyla förångades av elden!`);
                     updateActorState(target.id, {
                         statusEffects: target.statusEffects.filter(e => e.type !== 'slowed')
                     });
                     const newStatus: StatusEffect = { type: 'steamed', duration: 2, damage: Math.floor(baseSkillDamage * 0.1), accuracyReduction: 10 };
                     updateActorState(target.id, {
                         statusEffects: [...target.statusEffects.filter(e => e.type !== 'steamed'), newStatus]
                     });
                     addDamagePopup(newStatus.damage!.toString(), target.id, 'status_damage');
                     await sleep(500);
                 }
                 else {
                    await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true);
                 }
               }
               break;
            case 'wind_3': // Cyklon
                if (target && rankData.damageMultiplier) {
                    // Reaction: Wind + Rooted/Slowed (from Mud) = Blinded
                    const isRootedOrSlowedByMud = target.statusEffects.some(e => e.type === 'rooted' || (e.type === 'slowed' && event.element === Element.MUD)); // Assuming Mud environment for slowed
                    if (isRootedOrSlowedByMud) {
                        addLogMessage(`Vinden torkar ut leran och bländar ${target.name}!`);
                        updateActorState(target.id, {
                            statusEffects: target.statusEffects.filter(e => e.type !== 'rooted' && e.type !== 'slowed')
                        });
                        const newStatus: StatusEffect = { type: 'blinded', duration: 2 };
                        updateActorState(target.id, {
                            statusEffects: [...target.statusEffects.filter(e => e.type !== 'blinded'), newStatus]
                        });
                        await sleep(500);
                    }
                    // NEW Reaction: Wind + Burning = Intensified Burn
                    const existingBurning = target.statusEffects.find(e => e.type === 'burning');
                    if (abilityInfo.element === Element.WIND && existingBurning && existingBurning.type === 'burning') {
                        addLogMessage(`Vinden fläktar elden och intensifierar bränningen på ${target.name}!`);
                        // Remove old burning, deal immediate bonus damage, apply stronger burn
                        updateActorState(target.id, {
                            statusEffects: target.statusEffects.filter(e => e.type !== 'burning')
                        });
                        const bonusFireDamage = Math.floor(existingBurning.damage * 1.5); // 50% more immediate damage
                        const newBurnDamage = Math.floor(existingBurning.damage * 1.2); // 20% stronger DoT
                        
                        // Deal immediate bonus damage
                        await performAttack(player.id, target.id, bonusFireDamage, Element.FIRE, true);
                        
                        // Apply new, stronger burning status
                        const newBurningStatus: StatusEffect = { type: 'burning', duration: 3, damage: newBurnDamage };
                        updateActorState(target.id, {
                            statusEffects: [...target.statusEffects.filter(e => e.type !== 'burning'), newBurningStatus]
                        });
                        addLogMessage(`${target.name} tar ${bonusFireDamage} bonus eldskada och brinner nu för ${newBurnDamage} per runda!`);
                        await sleep(500);
                    } else {
                        await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true);
                    }
                }
                break;
            case 'ice':
               if(target && rankData.damageMultiplier) await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true, () => {
                 if (rankData.duration) {
                    updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== 'slowed'), { type: 'slowed', duration: rankData.duration }] });
                    addLogMessage(`${target.name} saktas ner av isen!`);
                 }
               });
               break;
            case 'fire_2': // Antända
              if(target && rankData.damageMultiplier && rankData.dotDamage) {
                await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true, () => {
                  const burnDamage = Math.floor(rankData.dotDamage! + playerStats.intelligence * 0.2);
                  updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== 'burning'), { type: 'burning', duration: 3, damage: burnDamage }] });
                  addLogMessage(`${target.name} brinner!`);
                });
              }
              break;
            case 'earth_1': // Stenhud
              if (rankData.duration) {
                // Reaction: Earth + Poisoned = Cleansed
                if (player.statusEffects.some(e => e.type === 'poisoned')) {
                    addLogMessage(`Jordens kraft renar dig från giftet!`);
                    updateActorState(player.id, {
                        statusEffects: player.statusEffects.filter(e => e.type !== 'poisoned')
                    });
                    await sleep(500);
                }
                updateActorState(player.id, { atb: 0, statusEffects: [...player.statusEffects, {type: 'defending', duration: rankData.duration}] });
                addLogMessage("Du intar en defensiv position.");
                await sleep(500);
              }
              break;
            case 'earth_3': // Jordskalv
            case 'water_3': // Tidvattenvåg
              if(target && rankData.damageMultiplier && rankData.duration) {
                await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true, () => {
                   updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== 'slowed'), { type: 'slowed', duration: rankData.duration! }] });
                   addLogMessage(`${target.name} saktas ner!`);
                });
              }
              break;
            case 'wind_1': // Hastighet
              if (rankData.duration) {
                addVisualEffect('haste', player.id, player.id);
                updateActorState(player.id, { atb: 0, statusEffects: [...player.statusEffects.filter(e => e.type !== 'hasted'), {type: 'hasted', duration: rankData.duration}] });
                await sleep(500);
              }
              break;
            case 'water_1': // Läka
              if (rankData.healMultiplier) {
                healAmount = Math.floor(player.maxHp * rankData.healMultiplier + playerStats.intelligence);
                if(hasFullFlow) healAmount = Math.floor(healAmount * 1.5);
                soundEffects.heal(); // Aktiverad ljudeffekt
                const newHp = Math.min(player.maxHp, player.hp + healAmount);
                addVisualEffect('heal', player.id, player.id);
                await sleep(300);
                updateActorState(player.id, { hp: newHp, atb: 0 });
                addDamagePopup(`+${healAmount}`, player.id, 'heal');
                addLogMessage(`Du läker dig själv för ${healAmount} HP.`);
                await sleep(500);
              }
              break;
            case 'growth': // Tillväxt
              const healPerTurn = Math.floor(playerStats.intelligence * 0.5 + 5);
              updateActorState(player.id, { atb: 0, statusEffects: [...player.statusEffects.filter(e => e.type !== 'regenerating'), {type: 'regenerating', duration: 4, heal: healPerTurn}] });
              addLogMessage(`Du känner en läkande kraft från jorden.`);
              await sleep(500);
              break;
            case 'mud': // Lerfälla
              if(target) await performAttack(player.id, target.id, playerStats.damage * 0.25, abilityInfo.element, true, () => {
                 const newEffects = [...target.statusEffects.filter(e => e.type !== 'slow<dyad-problem-report summary="10 problems">
<problem file="components/SkillTree.tsx" line="31" column="44" code="2349">This expression is not callable.
  Type 'Skill' has no call signatures.</problem>
<problem file="components/SkillTree.tsx" line="102" column="30" code="2349">This expression is not callable.
  Type 'Skill' has no call signatures.</problem>
<problem file="components/SkillTree.tsx" line="108" column="69" code="2339">Property 'id' does not exist on type 'unknown'.</problem>
<problem file="components/SkillTree.tsx" line="110" column="35" code="2339">Property 'x' does not exist on type 'unknown'.</problem>
<problem file="components/SkillTree.tsx" line="111" column="35" code="2339">Property 'y' does not exist on type 'unknown'.</problem>
<problem file="components/SkillTree.tsx" line="128" column="28" code="2349">This expression is not callable.
  Type 'Skill' has no call signatures.</problem>
<problem file="components/EventView.tsx" line="73" column="38" code="2339">Property 'find' does not exist on type 'Record&lt;ArchetypeName, Archetype&gt;'.</problem>
<problem file="components/EventView.tsx" line="303" column="11" code="2552">Cannot find name 'setCharacter'. Did you mean 'character'?</problem>
<problem file="App.tsx" line="65" column="11" code="2741">Property 'id' is missing in type '{ name: ArchetypeName; archetype: ArchetypeName; stats: { strength: number; dexterity: number; intelligence: number; constitution: number; }; resources: { health: { ...; }; aether: { ...; }; }; ... 7 more ...; level: number; }' but required in type 'Character'.</problem>
<problem file="App.tsx" line="115" column="39" code="2349">This expression is not callable.
  Type 'Skill' has no call signatures.</problem>
</dyad-problem-report>Absolut! Jag kommer att åtgärda de 10 TypeScript-felen på ett koncist sätt.

Felen beror främst på att `SKILL_TREE_DATA` och `ARCHETYPES` nyligen ändrades från arrayer till `Record` (objekt) i `constants.tsx`, men koden som använder dem har inte uppdaterats för att matcha den nya strukturen. Dessutom saknas `id` i `Character`-objektet vid skapandet, och `setCharacter` prop saknades i `EventView`.

Här är de specifika åtgärderna:

1.  **`types.ts`**:
    *   Lägger till `id: string;` till `Character`-interfacet.
2.  **`constants.tsx`**:
    *   Ändrar `ARCHETYPES` till ett `Record<ArchetypeName, Archetype>`.
    *   Ändrar `SKILL_TREE_DATA` till ett `Record<string, Skill>`.
3.  **`App.tsx`**:
    *   Uppdaterar `handleSelectArchetype` för att generera ett unikt `id` för den nya karaktären.
    *   Uppdaterar `unlockSkill` för att komma åt `SKILL_TREE_DATA` som ett objekt istället för att använda `find` på en array.
    *   Skickar `setCharacter` som en prop till `EventView`.
4.  **`components/SkillTree.tsx`**:
    *   Uppdaterar `skillMap` och `SKILL_TREE_DATA.map` för att iterera över objektets värden istället för att behandla det som en array.
    *   Säkerställer att `parent` är korrekt typat som `Skill`.
5.  **`components/EventView.tsx`**:
    *   Uppdaterar `archetypeIcon` för att komma åt `ARCHETYPES` som ett objekt.
    *   Lägger till `setCharacter` som en prop till `EventViewProps` och i komponenten.

Här är de uppdaterade filerna:

<dyad-write path="types.ts" description="Lägger till 'id' till Character-interfacet.">
import type React from 'react';

export enum Element {
  NEUTRAL,
  FIRE,
  EARTH,
  WIND,
  WATER,
  MAGMA,
  OBSIDIAN,
  FIRESTORM,
  HOT_AIR,
  STEAM,
  HOT_SPRINGS,
  SAND,
  EROSION,
  MUD,
  GROWTH,
  ICE,
  STORM,
  VOLCANIC_STORM,
  ELECTRIFIED_MUD,
  VITRIFIED_STORM,
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  dependencies?: string[];
  icon: React.FC;
  x: number;
  y: number;
  element: Element;
  maxRank: number;
}

export interface CharacterStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  constitution: number;
}

export interface Resource {
  current: number;
  max: number;
}

export interface AetherResource extends Resource {
  name: string;
}

export type ArchetypeName = 'Pyromanten' | 'Stenväktaren' | 'Stormdansaren' | 'Tidvattenvävaren';
export type SpecialResourceName = 'Hetta' | 'Styrka' | 'Energi' | 'Flöde';

export interface Archetype {
  name: ArchetypeName;
  description: string;
  element: Element;
  icon: React.FC;
  statBonuses: Partial<CharacterStats>;
  startingSkill: string;
  resourceName: SpecialResourceName;
}

export interface PassiveTalent {
  id: string;
  name: string;
  description?: string;
  element: Element;
  icon: React.FC;
  effect:
    | { type: 'COUNTER_ATTACK'; element?: Element; damage?: number; chance?: number; }
    | { type: 'HEAL_BONUS'; value?: number; isPercentage?: boolean; }
    | { type: 'RESOURCE_GAIN'; stat?: keyof CharacterStats | 'aether' | 'undvikandechans' | 'kritiskTräff' | 'skada' | 'rustning'; value?: number; isPercentage?: boolean; }
    | { type: 'APPLY_STATUS'; status: StatusEffect['type']; chance: number; duration?: number; value?: number; isPercentage?: boolean; damage?: number; accuracyReduction?: number; element?: Element; } // Added element
    | { type: 'DEAL_ELEMENTAL_DAMAGE'; element: Element; damage: number; chance: number; }
    | { type: 'STAT_BONUS'; stat: keyof CharacterStats | 'skada' | 'rustning' | 'undvikandechans' | 'kritiskTräff'; value: number; isPercentage?: boolean; element?: Element; }; // Added element
}

export interface UltimateAbility {
  id: string;
  name: string;
  description?: string;
  element: Element;
  icon: React.FC;
  cooldown: number; // In turns
  currentCooldown?: number; // New: Track current cooldown
  targetType?: 'SINGLE_ENEMY' | 'ALL_ENEMIES' | 'LINE_AOE' | 'CIRCLE_AOE' | 'LOWEST_HP_ENEMY' | 'HIGHEST_HP_ENEMY' | 'SELF' | 'ALL_ALLIES'; // New
  effect:
    | { type: 'AOE_DAMAGE'; damage?: number; buff?: StatusEffect['type'] | 'pushed_back' | 'armor_reduction_buff' | 'stunned_buff' | 'frozen_buff' | 'cleanse_debuffs_action' | 'cleanse_all_debuffs_action'; duration?: number; value?: number; isPercentage?: boolean; }
    | { type: 'MASS_HEAL'; heal?: number; buff?: StatusEffect['type'] | 'cleanse_debuffs_action' | 'cleanse_all_debuffs_action'; duration?: number; value?: number; isPercentage?: boolean; }
    | { type: 'GLOBAL_BUFF'; buff?: StatusEffect['type'] | 'damage_reduction_buff'; duration?: number; value?: number; isPercentage?: boolean; }
    | { type: 'SINGLE_TARGET_DAMAGE'; damage?: number; buff?: StatusEffect['type'] | 'frozen_buff'; duration?: number; value?: number; isPercentage?: boolean; };
}

export interface ElementalBonus {
  threshold: number; // Points needed to unlock this bonus
  description?: string;
  effect: {
    type: 'STAT_BONUS' | 'RESOURCE_REGEN' | 'RESISTANCE' | 'DAMAGE_BONUS' | 'PASSIVE_TALENT' | 'ULTIMATE_ABILITY' | 'HEAL_BONUS' | 'APPLY_STATUS'; // Added APPLY_STATUS
    stat?: keyof CharacterStats | 'skada' | 'rustning' | 'undvikandechans' | 'kritiskTräff' | 'damage' | 'armor' | 'aether';
    element?: Element;
    value?: number; // Flat value or percentage
    isPercentage?: boolean;
    talentId?: string; // For PASSIVE_TALENT
    abilityId?: string; // For ULTIMATE_ABILITY
    status?: StatusEffect['type']; // Added for APPLY_STATUS
    duration?: number; // Added for APPLY_STATUS
    chance?: number; // Added for APPLY_STATUS
    damage?: number; // Added for APPLY_STATUS (e.g., burning)
    accuracyReduction?: number; // Added for APPLY_STATUS (e.g., steamed)
  };
}

export interface Character {
  id: string; // Added id to Character
  name: string;
  archetype: ArchetypeName;
  level: number;
  stats: CharacterStats;
  resources: {
    health: Resource;
    aether: AetherResource;
  };
  experience: {
    current: number;
    max: number;
  };
  elementalAffinities: Partial<Record<Element, number>>;
  unlockedPassiveTalents: string[];
  unlockedUltimateAbilities: UltimateAbility[]; // Changed to store full UltimateAbility objects
  activeAbilities: PlayerAbility[]; // New: Store active player abilities with cooldowns
  equippedItems: Item[]; // New: Track equipped items
  statusEffects?: StatusEffect[]; // New: Track status effects on character
}

export type View = 'skillTree' | 'characterSheet' | 'inventory' | 'event' | 'deck' | 'debug';

export type Rarity = 'Vanlig' | 'Magisk' | 'Sällsynt' | 'Legendarisk';

export type EquipmentSlot = 'Hjälm' | 'Bröst' | 'Vapen 1' | 'Vapen 2' | 'Handskar' | 'Bälte' | 'Byxor' | 'Stövlar';

export interface ItemStats {
  strength?: number;
  dexterity?: number;
  intelligence?: number;
  constitution?: number;
  skada?: number;
  rustning?: number;
  undvikandechans?: number;
  kritiskTräff?: number;
}

export interface ItemAffix {
  trigger: 'ON_HIT' | 'ON_TAKE_DAMAGE' | 'PASSIVE';
  effect: {
    type: 'DEAL_ELEMENTAL_DAMAGE';
    element: Element;
    damage: number;
    chance: number;
  } | {
    type: 'APPLY_STATUS';
    status: StatusEffect['type'];
    chance: number;
    duration?: number;
    value?: number;
    damage?: number;
    accuracyReduction?: number;
  };
  description: string;
}

export interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  slot: EquipmentSlot | 'Föremål';
  stats: ItemStats;
  icon: React.FC;
  visual?: React.FC;
  affix?: ItemAffix;
}

export interface AbilityRankData {
  description: string;
  resourceCost: number;
  damageMultiplier?: number;
  dotDamage?: number;
  healMultiplier?: number;
  duration?: number;
  chance?: number;
  statusEffectsToApply?: StatusEffect['type'][]; // New
  value?: number; // Added for buffs/debuffs
  isPercentage?: boolean; // Added for buffs/debuffs
}

export interface PlayerAbility {
  id: string;
  name: string;
  element: Element;
  isAoe?: boolean;
  category?: 'damage' | 'heal' | 'buff' | 'cc';
  targetType?: 'SINGLE_ENEMY' | 'ALL_ENEMIES' | 'LINE_AOE' | 'CIRCLE_AOE' | 'LOWEST_HP_ENEMY' | 'HIGHEST_HP_ENEMY' | 'SELF' | 'ALL_ALLIES'; // New
  ranks: AbilityRankData[];
  cooldown?: number;
  currentCooldown?: number;
}

export type EnemyBehavior = 'ATTACK_PLAYER' | 'ATTACK_LOWEST_HP' | 'APPLY_DEBUFF_TO_PLAYER' | 'BUFF_SELF' | 'BUFF_ALLIES' | 'ATTACK_HIGHEST_DAMAGE_PLAYER'; // New behaviors

export interface EnemyAbility {
  id: string;
  name: string;
  element: Element;
  category: 'damage' | 'heal' | 'buff' | 'cc';
  targetType: 'SINGLE_PLAYER' | 'ALL_PLAYERS' | 'SELF' | 'ALL_ENEMIES'; // Simplified for enemies
  damageMultiplier?: number;
  healMultiplier?: number;
  statusEffectsToApply?: StatusEffect['type'][];
  duration?: number;
  value?: number; // For buffs/debuffs
  cooldown: number;
  currentCooldown?: number;
}

export interface EnemyPhase {
  name: string;
  threshold: number; // e.g., HP percentage
  newBehavior?: EnemyBehavior;
  newAbilities?: EnemyAbility[];
  statusEffectsToApplyToSelf?: StatusEffect['type'][];
  description?: string;
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  element: Element;
  stats: {
    health: number;
    maxHealth: number;
    damage: number;
    armor: number;
  };
  resistances?: Partial<Record<Element, number>>;
  icon: React.FC;
  behavior?: EnemyBehavior; // New
  abilities?: EnemyAbility[]; // New
  phases?: EnemyPhase[]; // New for bosses
  specialAbility?: 'HASTE_SELF'; // New: For simple, hardcoded enemy abilities
  onHitEffect?:
    | { type: 'burning'; duration: number; damage: number }
    | { type: 'poison'; duration: number; damage: number }
    | { type: 'slow'; duration: number };
  statusEffects?: StatusEffect[]; // New: Track status effects on enemy
}

export interface EnvironmentEffect {
  description: string;
  type: 'dot' | 'status_apply' | 'stat_modifier' | 'atb_modifier';
  element?: Element;
  value?: number;
  status?: StatusEffect['type'];
  statusDuration?: number;
  statusChance?: number;
  targetScope: 'all' | 'player' | 'enemies' | 'non_elemental' | 'elemental';
  targetElement?: Element;
}

export interface Environment {
  name: string;
  description: string;
  element: Element;
  effects: EnvironmentEffect[];
}

export interface EventModifier {
  description: string;
  effect: 'player_stat' | 'enemy_stat' | 'reward_bonus';
  stat?: 'damage' | 'health' | 'armor' | 'crit' | 'dodge';
  value?: number;
  isPercentage?: boolean;
}

export interface GameEvent {
  title: string;
  description: string;
  element: Element;
  modifiers: EventModifier[];
  environment?: Environment;
  enemies: Enemy[];
  rewards: {
    xp: number;
    items: Item[];
  };
}

export type StatusEffect =
  | { type: 'defending'; duration: number; value?: number; }
  | { type: 'hasted'; duration: number }
  | { type: 'burning'; duration: number; damage: number }
  | { type: 'poisoned'; duration: number; damage: number }
  | { type: 'slowed'; duration: number }
  | { type: 'retaliating'; duration: number; damage: number }
  | { type: 'blinded'; duration: number }
  | { type: 'full_flow'; duration: number }
  | { type: 'overheated'; duration: number }
  | { type: 'rooted'; duration: number }
  | { type: 'steamed'; duration: number; damage?: number; accuracyReduction?: number }
  | { type: 'regenerating'; duration: number; heal: number }
  | { type: 'armor_reduction'; duration: number; value: number; }
  | { type: 'stunned'; duration: number; }
  | { type: 'frozen'; duration: number; }
  | { type: 'damage_reduction'; duration: number; value: number; isPercentage?: boolean; }
  | { type: 'paralyzed'; duration: number; } // New
  | { type: 'bleeding'; duration: number; damage: number; } // New
  | { type: 'frightened'; duration: number; chanceToMissTurn: number; chanceToAttackRandom: number; } // New
  | { type: 'reflecting'; duration: number; element: Element; value: number; } // New
  | { type: 'absorbing'; duration: number; element: Element; value: number; }; // New

export interface CombatLogMessage {
  id: number;
  text: string;
  type: 'player' | 'enemy' | 'system' | 'reward';
}

export type EventType = 'COMBAT' | 'CHOICE' | 'BOON' | 'CURSE';

export interface Outcome {
    log: string;
    xp?: number;
    healthChange?: number;
    items?: Item[];
}

export interface ChoiceOption {
    buttonText: string;
    description: string;
    outcome: Outcome;
}

export interface EventCard {
    id: string;
    title: string;
    description: string;
    icon: React.FC;
    element: Element;
    type: EventType;
    payload: GameEvent | { options: ChoiceOption[] } | Outcome;
    isBoss?: boolean;
}