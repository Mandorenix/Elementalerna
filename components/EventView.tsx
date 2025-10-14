import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameEvent, Enemy, CombatLogMessage, Character, StatusEffect, PlayerAbility, EquipmentSlot, Item, ArchetypeName, ItemAffix, AbilityRankData } from '../types';
import { Element } from '../types';
import { Icons, ARCHETYPES, PLAYER_ABILITIES, STATUS_EFFECT_ICONS } from '../constants'; // Lade till STATUS_EFFECT_ICONS
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
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
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

  // Moved handleResetCharacter here so it's declared before being used in useEffect
  const handleResetCharacter = useCallback(() => {
    setCharacter(null);
  }, [setCharacter]);

  // Initialize combatants
  useEffect(() => {
    const archetypeIcon = ARCHETYPES[character.archetype]?.icon || Icons.Start;
    const playerActor: Actor = {
      id: character.id, type: 'PLAYER', name: character.name, icon: archetypeIcon,
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
              character,
              event.enemies,
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
          addLogMessage(enemyLog.map(msg => msg.text).join('\n'));
          addDamagePopup(enemyDamage.toString(), 'player', 'damage');

          if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
             setGameState('ACTIVE');
          }
      }

  }, [actors, updateActorState, gameState, event.environment, character, playerStats.maxAether, event.enemies, addLogMessage, addDamagePopup, setCharacter]);

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
      let attacker = actors.find(a => a.id === attackerId);
      let defender = actors.find(a => a.id === defenderId);
      if(!attacker || !defender || defender.isDefeated) return;
      
      let hettaBonus = 0;
      if (attacker.type === 'PLAYER' && character.archetype === 'Pyromanten') {
        hettaBonus = Math.floor(playerResource / 10);
      }
      const totalBaseDamage = baseDamage + hettaBonus;

      if (!isSkill) soundEffects.slash();
      updateActorState(attackerId, { animationState: 'attacking', atb: 0, statusEffects: attacker.statusEffects.filter(e => e.type !== 'defending') });
      await sleep(300);

      const isBlinded = attacker.statusEffects.some(e => e.type === 'blinded');
      const dodgeRoll = Math.random() * 100;
      const isDodge = isBlinded ? dodgeRoll < 50 : dodgeRoll < (defender.type === 'PLAYER' ? playerStats.dodge : 0);

      if(isDodge) {
          soundEffects.miss();
          addDamagePopup("MISS", defenderId, 'miss');
          addLogMessage(`${attacker.name} attackerade ${defender.name}, men missade!`);
      } else {
          soundEffects.hit();
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
          
          defender = { ...defender, hp: newHp };
          updateActorState(defenderId, { ...defenderUpdates, hp: newHp });

          // --- AFFIX PROCESSING ---
          if (attacker.type === 'PLAYER') {
            for (const item of Object.values(equipment) as (Item | null)[]) {
                if (item?.affix?.trigger === 'ON_HIT') {
                    await applyAffix(item.affix, attacker, defender);
                    defender = actors.find(a => a.id === defenderId)!;
                    if (defender.isDefeated) break;
                }
            }
          } else {
            for (const item of Object.values(equipment) as (Item | null)[]) {
                if (item?.affix?.trigger === 'ON_TAKE_DAMAGE') {
                     await applyAffix(item.affix, defender, attacker);
                     attacker = actors.find(a => a.id === attackerId)!;
                     if (attacker.isDefeated) break;
                }
                const playerActor = actors.find(a => a.type === 'PLAYER');
                if (playerActor && !playerActor.isDefeated) {
                    const retaliateEffect = playerActor.statusEffects.find(e => e.type === 'retaliating');
                    if (retaliateEffect && retaliateEffect.type === 'retaliating' && Math.random() * 100 < 30) {
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

          if(newHp <= 0 && !defender.isDefeated) {
              updateActorState(defenderId, { isDefeated: true });
              addLogMessage(`${defender.name} har besegrats!`);
          }
      }
      
      await sleep(300);
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
                effectiveCost = 0;
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
            case 'fireball': // Changed from fire_1, fire_3 to fireball
            case 'incinerate': // Added incinerate
               if(target && rankData.damageMultiplier) {
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
            case 'cyclone': // Changed from wind_3 to cyclone
                if (target && rankData.damageMultiplier) {
                    const isRootedOrSlowedByMud = target.statusEffects.some(e => e.type === 'rooted' || (e.type === 'slowed' && event.element === Element.MUD));
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
                    const existingBurning = target.statusEffects.find(e => e.type === 'burning');
                    if (abilityInfo.element === Element.WIND && existingBurning && existingBurning.type === 'burning') {
                        addLogMessage(`Vinden fläktar elden och intensifierar bränningen på ${target.name}!`);
                        updateActorState(target.id, {
                            statusEffects: target.statusEffects.filter(e => e.type !== 'burning')
                        });
                        const bonusFireDamage = Math.floor(existingBurning.damage * 1.5);
                        const newBurnDamage = Math.floor(existingBurning.damage * 1.2);
                        
                        await performAttack(player.id, target.id, bonusFireDamage, Element.FIRE, true);
                        
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
            case 'freeze': // Changed from ice to freeze
               if(target && rankData.damageMultiplier) await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true, () => {
                 if (rankData.duration) {
                    updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== 'slowed'), { type: 'slowed', duration: rankData.duration }] });
                    addLogMessage(`${target.name} saktas ner av isen!`);
                 }
               });
               break;
            case 'fire_shield': // Changed from fire_2 to fire_shield
              if(target && rankData.damageMultiplier && rankData.dotDamage) {
                await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true, () => {
                  const burnDamage = Math.floor(rankData.dotDamage! + playerStats.intelligence * 0.2);
                  updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== 'burning'), { type: 'burning', duration: 3, damage: burnDamage }] });
                  addLogMessage(`${target.name} brinner!`);
                });
              }
              break;
            case 'harden_skin': // Changed from earth_1 to harden_skin
              if (rankData.duration) {
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
            case 'earthquake': // Changed from earth_3 to earthquake
            case 'healing_wave': // Changed from water_3 to healing_wave
              if(target && rankData.damageMultiplier && rankData.duration) {
                await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true, () => {
                   updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== 'slowed'), { type: 'slowed', duration: rankData.duration! }] });
                   addLogMessage(`${target.name} saktas ner!`);
                });
              }
              break;
            case 'evasive_maneuver': // Changed from wind_1 to evasive_maneuver
              if (rankData.duration) {
                addVisualEffect('haste', player.id, player.id);
                updateActorState(player.id, { atb: 0, statusEffects: [...player.statusEffects.filter(e => e.type !== 'hasted'), {type: 'hasted', duration: rankData.duration}] });
                await sleep(500);
              }
              break;
            case 'water_bolt': // Changed from water_1 to water_bolt
              if (rankData.healMultiplier) {
                healAmount = Math.floor(player.maxHp * rankData.healMultiplier + playerStats.intelligence);
                if(hasFullFlow) healAmount = Math.floor(healAmount * 1.5);
                soundEffects.heal();
                const newHp = Math.min(player.maxHp, player.hp + healAmount);
                addVisualEffect('heal', player.id, player.id);
                await sleep(300);
                updateActorState(player.id, { hp: newHp, atb: 0 });
                addDamagePopup(`+${healAmount}`, player.id, 'heal');
                addLogMessage(`Du läker dig själv för ${healAmount} HP.`);
                await sleep(500);
              }
              break;
            case 'growth':
              const healPerTurn = Math.floor(playerStats.intelligence * 0.5 + 5);
              updateActorState(player.id, { atb: 0, statusEffects: [...player.statusEffects.filter(e => e.type !== 'regenerating'), {type: 'regenerating', duration: 4, heal: healPerTurn}] });
              addLogMessage(`Du känner en läkande kraft från jorden.`);
              await sleep(500);
              break;
            case 'mud':
                if(target) await performAttack(player.id, target.id, playerStats.damage * 0.25, abilityInfo.element, true, () => {
                   const newEffects = [...target.statusEffects.filter(e => e.type !== 'slowed')];
                   const newStatus: StatusEffect = { type: 'slowed', duration: 2 };
                   updateActorState(target.id, { statusEffects: [...newEffects, newStatus] });
                   addLogMessage(`${target.name} fastnar i lera och saktas ner!`);
                });
                break;
          }
      }
      
      updateActorState(player.id, { atb: 0 });
      if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
          setGameState('ACTIVE');
      }
  };

  const handleTargetSelect = (enemyId: string) => {
      setSelectedTarget(enemyId);
      setShowAbilityMenu(true);
  };

  const handleAbilitySelect = (abilityId: string) => {
      handlePlayerAction('SKILL', abilityId);
      setSelectedTarget(null);
      setShowAbilityMenu(false);
  };

  const allEnemiesDefeated = actors.filter(a => a.type === 'ENEMY').every(a => a.isDefeated);
  const playerDefeated = actors.find(a => a.type === 'PLAYER')?.isDefeated;

  useEffect(() => {
    if (allEnemiesDefeated && gameState !== 'VICTORY') {
      setGameState('VICTORY');
      addLogMessage("Alla fiender besegrade! Seger!");
      soundEffects.victory();
      setTimeout(() => {
        if (event.rewards) {
          onComplete(event.rewards);
        }
      }, 2000);
    } else if (playerDefeated && gameState !== 'DEFEAT') {
      setGameState('DEFEAT');
      addLogMessage("Du har besegrats! Spelet är slut.");
      setTimeout(() => {
        // Optionally, reset game or show game over screen
        handleResetCharacter(); // Example: reset character on defeat
      }, 2000);
    }
  }, [allEnemiesDefeated, playerDefeated, gameState, event.rewards, onComplete, handleResetCharacter]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <CombatBackground element={event.element} />

      <div className="absolute inset-0 flex flex-col z-10">
        {/* Top Bar: Event Title */}
        <div className="w-full p-4 text-center bg-black/50 text-yellow-400 text-xl pixelated-border-b">
          {event.title}
        </div>

        {/* Combat Area */}
        <div className="flex-grow flex items-center justify-between p-8 relative" ref={popupContainerRef}>
          {/* Player */}
          <div className="relative w-48 h-48 flex items-center justify-center" ref={playerRef}>
            <div className={`w-32 h-32 bg-blue-700/50 rounded-full flex items-center justify-center text-5xl pixelated-border ${actors.find(a => a.type === 'PLAYER')?.animationState === 'attacking' ? 'animate-attack-player' : ''} ${actors.find(a => a.type === 'PLAYER')?.animationState === 'hit' ? 'animate-hit-flash' : ''} ${actors.find(a => a.type === 'PLAYER')?.isDefeated ? 'animate-defeat' : 'animate-idle-bob'}`}>
              {actors.find(a => a.type === 'PLAYER')?.icon()}
            </div>
            {/* Player Status Effects VFX */}
            {actors.find(a => a.type === 'PLAYER')?.statusEffects.some(e => e.type === 'burning') && (
                <div className="status-vfx-overlay vfx-burning-overlay"></div>
            )}
            {actors.find(a => a.type === 'PLAYER')?.statusEffects.some(e => e.type === 'poisoned') && (
                <div className="status-vfx-overlay vfx-poison-overlay"></div>
            )}
            {actors.find(a => a.type === 'PLAYER')?.statusEffects.some(e => e.type === 'steamed') && (
                <div className="status-vfx-overlay vfx-steamed-overlay"></div>
            )}
            {/* Damage Popups */}
            {damagePopups.filter(p => p.id === 'player' || p.id === actors.find(a => a.type === 'PLAYER')?.id).map(popup => (
                <div key={popup.id} className={`damage-popup damage-popup-${popup.type}`} style={{ left: popup.x, top: popup.y }}>
                    {popup.text}
                </div>
            ))}
            {/* VFX */}
            {visualEffects.filter(vfx => vfx.targetId === actors.find(a => a.type === 'PLAYER')?.id).map(vfx => (
                <div key={vfx.id} className={`absolute ${vfx.type === 'heal' ? 'vfx-heal-drop' : ''}`}></div>
            ))}
          </div>

          {/* Enemies */}
          <div className="flex space-x-8">
            {actors.filter(a => a.type === 'ENEMY').map((enemy, index) => (
              <div key={enemy.id} className="relative w-48 h-48 flex items-center justify-center" ref={enemy.ref}>
                <div 
                    onClick={() => handleTargetSelect(enemy.id)}
                    className={`w-32 h-32 bg-red-700/50 rounded-full flex items-center justify-center text-5xl pixelated-border cursor-pointer
                                ${enemy.animationState === 'attacking' ? 'animate-attack-enemy' : ''} 
                                ${enemy.animationState === 'hit' ? 'animate-hit-flash' : ''} 
                                ${enemy.isDefeated ? 'animate-defeat' : 'animate-idle-bob'}
                                ${selectedTarget === enemy.id ? 'border-yellow-400 shadow-[0_0_15px_rgba(252,211,77,0.7)]' : ''}`}
                >
                  {enemy.icon()}
                </div>
                {/* Enemy Status Effects VFX */}
                {enemy.statusEffects.some(e => e.type === 'burning') && (
                    <div className="status-vfx-overlay vfx-burning-overlay"></div>
                )}
                {enemy.statusEffects.some(e => e.type === 'poisoned') && (
                    <div className="status-vfx-overlay vfx-poison-overlay"></div>
                )}
                {enemy.statusEffects.some(e => e.type === 'steamed') && (
                    <div className="status-vfx-overlay vfx-steamed-overlay"></div>
                )}
                {/* Damage Popups */}
                {damagePopups.filter(p => p.id === enemy.id).map(popup => (
                    <div key={popup.id} className={`damage-popup damage-popup-${popup.type}`} style={{ left: popup.x, top: popup.y }}>
                        {popup.text}
                    </div>
                ))}
                {/* VFX */}
                {visualEffects.filter(vfx => vfx.targetId === enemy.id).map(vfx => (
                    <div key={vfx.id} className={`absolute ${vfx.type === 'slash' ? 'vfx-slash' : vfx.type === 'fireball' ? 'vfx-fireball' : ''}`}></div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom UI */}
        <div className="w-full p-4 bg-black/70 pixelated-border-t flex justify-between items-end">
          {/* Player Info */}
          <div className="w-1/3 p-2 bg-black/50 pixelated-border">
            <div className="text-lg text-yellow-300">{character.name}</div>
            <div className="flex items-center mt-1">
              <div className="w-full bg-gray-700 h-4 pixelated-border">
                <div className="bg-green-500 h-full" style={{ width: `${(actors.find(a => a.type === 'PLAYER')?.hp / actors.find(a => a.type === 'PLAYER')?.maxHp || 0) * 100}%` }}></div>
              </div>
              <span className="ml-2 text-xs">{actors.find(a => a.type === 'PLAYER')?.hp} / {actors.find(a => a.type === 'PLAYER')?.maxHp}</span>
            </div>
            <div className="flex items-center mt-1">
              <div className="w-full bg-gray-700 h-4 pixelated-border">
                <div className={`${resourceTheme.bg} h-full`} style={{ width: `${(playerResource / playerStats.maxAether) * 100}%` }}></div>
              </div>
              <span className="ml-2 text-xs">{playerResource} / {playerStats.maxAether}</span>
            </div>
            {/* Player Status Effects */}
            <div className="flex space-x-1 mt-2">
                {actors.find(a => a.type === 'PLAYER')?.statusEffects.map(effect => {
                    const Icon = STATUS_EFFECT_ICONS[effect.type];
                    return (
                        <div key={effect.type} className="status-icon">
                            <Icon />
                            {effect.duration > 0 && <span className="status-duration">{effect.duration}</span>}
                        </div>
                    );
                })}
            </div>
          </div>

          {/* Combat Log */}
          <div className="w-1/3 p-2 bg-black/50 pixelated-border h-32 overflow-y-auto flex flex-col-reverse text-xs text-gray-300">
            {log.map((msg, i) => <p key={i} className="mb-1">{msg}</p>)}
          </div>

          {/* Enemy Info */}
          <div className="w-1/3 p-2 bg-black/50 pixelated-border">
            {actors.filter(a => a.type === 'ENEMY' && !a.isDefeated).map(enemy => (
              <div key={enemy.id} className="mb-2">
                <div className="text-lg text-red-300">{enemy.name}</div>
                <div className="flex items-center mt-1">
                  <div className="w-full bg-gray-700 h-4 pixelated-border">
                    <div className="bg-red-500 h-full" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                  </div>
                  <span className="ml-2 text-xs">{enemy.hp} / {enemy.maxHp}</span>
                </div>
                {/* Enemy Status Effects */}
                <div className="flex space-x-1 mt-2">
                    {enemy.statusEffects.map(effect => {
                        const Icon = STATUS_EFFECT_ICONS[effect.type];
                        return (
                            <div key={effect.type} className="status-icon">
                                <Icon />
                                {effect.duration > 0 && <span className="status-duration">{effect.duration}</span>}
                            </div>
                        );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Command Menu */}
        {gameState === 'PLAYER_TURN' && showCommandMenu && (
          <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex space-x-4 z-20">
            <button onClick={() => handlePlayerAction('ATTACK')} className="px-6 py-3 bg-blue-800/70 border-2 border-blue-600 text-white text-lg pixelated-border hover:bg-blue-700/70">
              Attack
            </button>
            <button onClick={() => setShowAbilityMenu(true)} className="px-6 py-3 bg-purple-800/70 border-2 border-purple-600 text-white text-lg pixelated-border hover:bg-purple-700/70">
              Förmågor
            </button>
            <button onClick={() => handlePlayerAction('DEFEND')} className="px-6 py-3 bg-green-800/70 border-2 border-green-600 text-white text-lg pixelated-border hover:bg-green-700/70">
              Försvara
            </button>
          </div>
        )}

        {/* Ability Menu */}
        {gameState === 'PLAYER_TURN' && showAbilityMenu && (
            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex flex-col space-y-2 p-4 bg-black/80 pixelated-border z-30">
                <h3 className="text-yellow-300 text-center mb-2">Välj Förmåga</h3>
                {playerStats.abilities.map(ability => {
                    const currentRank = unlockedSkills.get(ability.id) || 0;
                    const abilityData = ability.ranks[currentRank - 1];
                    const canAfford = playerResource >= abilityData.resourceCost;
                    const onCooldown = (ability.currentCooldown || 0) > 0;

                    return (
                        <button
                            key={ability.id}
                            onClick={() => handleAbilitySelect(ability.id)}
                            disabled={!canAfford || onCooldown || !selectedTarget}
                            className={`px-4 py-2 text-sm text-left w-64
                                ${canAfford && !onCooldown && selectedTarget ? 'bg-purple-700/50 border-purple-500 hover:bg-purple-600/50' : 'bg-gray-700/50 border-gray-500 text-gray-400 cursor-not-allowed'}
                                border-2 transition-colors flex justify-between items-center`}
                        >
                            <span>{ability.name} (Rank {currentRank})</span>
                            <span className="text-xs text-gray-300">
                                {onCooldown ? `CD: ${ability.currentCooldown}` : `Kostnad: ${abilityData.resourceCost}`}
                            </span>
                        </button>
                    );
                })}
                <button onClick={() => setShowAbilityMenu(false)} className="mt-2 px-4 py-2 bg-gray-600/50 border-2 border-gray-500 text-white text-sm pixelated-border hover:bg-gray-500/50">
                    Tillbaka
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default EventView;