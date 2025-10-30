import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameEvent, Enemy, CombatLogMessage, Character, StatusEffect, PlayerAbility, EquipmentSlot, Item, ArchetypeName, ItemAffix, AbilityRankData, DamagePopupType, UltimateAbility } from '../types';
import { Element } from '../types';
import { Icons, ARCHETYPES, PLAYER_ABILITIES, ULTIMATE_ABILITIES, PASSIVE_TALENTS } from '../constants'; // Added ULTIMATE_ABILITIES and PASSIVE_TALENTS
import { soundEffects } from '../sound'; // Aktiverar importen av ljudeffekter
import CombatBackground from './CombatBackground'; // Import the new CombatBackground component

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
  ultimateCooldowns: Partial<Record<string, number>>; // New: Track ultimate cooldowns
};


type DamagePopup = { id: number; text: string; x: number; y: number; type: DamagePopupType; };
type VisualEffect = { id: number; type: 'slash' | 'fireball' | 'heal' | 'haste' | 'frozen' | 'paralyzed' | 'meteor_impact' | 'earthquake_vfx' | 'wind_burst_vfx' | 'water_bless_vfx' | 'electrified_vfx' | 'molten_ground_vfx' | 'quicksand_vfx'; targetId: string; originId: string; }; // Added new VFX types

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

const EventView: React.FC<{
  event: GameEvent;
  character: Character;
  playerStats: { health: number; maxHealth: number; aether: number; maxAether: number; resourceName: string; damage: number; armor: number; dodge: number; crit: number; intelligence: number; abilities: PlayerAbility[] };
  onComplete: (rewards: GameEvent['rewards']) => void;
  equipment: Record<EquipmentSlot, Item | null>;
  unlockedSkills: Map<string, number>;
}> = ({ event, character, playerStats, onComplete, equipment, unlockedSkills }) => {
  const [gameState, setGameState] = useState<GameState>('INTRO');
  const [actors, setActors] = useState<Actor[]>([]);
  const [playerResource, setPlayerResource] = useState(playerStats.aether);
  const [log, setLog] = useState<string[]>([]);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showAbilityMenu, setShowAbilityMenu] = useState(false);
  const [showUltimateMenu, setShowUltimateMenu] = useState(false); // New state for ultimate menu
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const enemyRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const resourceTheme = resourceThemes[playerStats.resourceName] || resourceThemes['Aether'];

  // Initialize combatants
  useEffect(() => {
    const archetypeIcon = ARCHETYPES.find(a => a.name === character.archetype)?.icon || Icons.Start;
    const playerActor: Actor = {
      id: 'player', type: 'PLAYER', name: character.name, icon: archetypeIcon,
      hp: playerStats.health, maxHp: playerStats.maxHealth, atb: 0, 
      animationState: 'idle', statusEffects: [], isDefeated: false, ref: playerRef,
      ultimateCooldowns: {} // Initialize cooldowns
    };
    const enemyActors: Actor[] = event.enemies.map((e, i) => {
      enemyRefs.current[i] = React.createRef<HTMLDivElement>();
      return {
        id: e.id, type: 'ENEMY', name: e.name, icon: e.icon,
        hp: e.stats.health, maxHp: e.stats.maxHealth, atb: Math.random() * 50, 
        animationState: 'idle', statusEffects: [], isDefeated: false, ref: enemyRefs.current[i],
        ultimateCooldowns: {} // Enemies don't use ultimates, but keep for type consistency
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
                          if (effect.status === 'burning' || effect.status === 'poisoned' || effect.status === 'retaliating' || effect.status === 'steamed' || effect.status === 'bleeding') {
                              (newStatus as any).damage = effect.value; // Assuming value is damage for these
                          }
                          if (effect.status === 'regenerating') {
                              (newStatus as any).heal = effect.value;
                          }
                          if (effect.status === 'paralyzed' || effect.status === 'frightened') {
                              (newStatus as any).chanceToMissTurn = effect.value;
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
      let skipTurn = false;

      for (const effect of newStatusEffects) { // Iterate over potentially updated effects
          if (effect.type === 'burning' && effect.damage) {
              hp = Math.max(0, hp - effect.damage);
              soundEffects.burn(); // Aktiverad ljudeffekt
              addLogMessage(`${actor.name} tar ${effect.damage} brännskada!`);
              addDamagePopup(effect.damage.toString(), actor.id, 'status_damage');
          }
           if (effect.type === 'poisoned' && effect.damage) {
              hp = Math.max(0, hp - effect.damage);
              addLogMessage(`${actor.name} tar ${effect.damage} giftskada!`);
              addDamagePopup(effect.damage.toString(), actor.id, 'status_damage');
          }
           if (effect.type === 'regenerating' && effect.heal) {
              hp = Math.min(actor.maxHp, hp + effect.heal);
              addLogMessage(`${actor.name} regenererar ${effect.heal} hälsa!`);
              addDamagePopup(`+${effect.heal}`, actor.id, 'heal');
          }
          if (effect.type === 'steamed' && effect.damage) {
              hp = Math.max(0, hp - effect.damage);
              addLogMessage(`${actor.name} tar ${effect.damage} ångskada!`);
              addDamagePopup(effect.damage.toString(), actor.id, 'status_damage');
          }
          if (effect.type === 'bleeding' && effect.damage) {
              hp = Math.max(0, hp - effect.damage);
              addLogMessage(`${actor.name} blöder och tar ${effect.damage} skada!`);
              addDamagePopup(effect.damage.toString(), actor.id, 'status_damage');
          }
          if (effect.type === 'frozen') {
              skipTurn = true;
              addLogMessage(`${actor.name} är frusen och kan inte agera!`);
              addVisualEffect('frozen', actor.id, actor.id);
          }
          if (effect.type === 'paralyzed' && 'chanceToMissTurn' in effect && Math.random() * 100 < effect.chanceToMissTurn) {
              skipTurn = true;
              addLogMessage(`${actor.name} är förlamad och kan inte agera!`);
              addVisualEffect('paralyzed', actor.id, actor.id);
          }
          if (effect.type === 'stunned') {
              skipTurn = true;
              addLogMessage(`${actor.name} är bedövad och kan inte agera!`);
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
                  case 'armor_reduction': effectsAfterTurn.push({ type: 'armor_reduction', duration: newDuration, value: effect.value }); break;
                  case 'stunned': effectsAfterTurn.push({ type: 'stunned', duration: newDuration }); break;
                  case 'frozen': effectsAfterTurn.push({ type: 'frozen', duration: newDuration }); break;
                  case 'paralyzed': effectsAfterTurn.push({ type: 'paralyzed', duration: newDuration, chanceToMissTurn: effect.chanceToMissTurn }); break;
                  case 'damage_reduction': effectsAfterTurn.push({ type: 'damage_reduction', duration: newDuration, value: effect.value, isPercentage: effect.isPercentage }); break;
                  case 'bleeding': effectsAfterTurn.push({ type: 'bleeding', duration: newDuration, damage: effect.damage }); break;
                  case 'frightened': effectsAfterTurn.push({ type: 'frightened', duration: newDuration, chanceToMissTurn: effect.chanceToMissTurn, chanceToAttackRandom: effect.chanceToAttackRandom }); break;
                  case 'reflecting': effectsAfterTurn.push({ type: 'reflecting', duration: newDuration, element: effect.element, value: effect.value }); break;
                  case 'absorbing': effectsAfterTurn.push({ type: 'absorbing', duration: newDuration, element: effect.element, value: effect.value }); break;
              }
          } else {
             if (effect.type === 'rooted') addLogMessage(`${actor.name} är inte längre rotad.`);
             if (effect.type === 'blinded') addLogMessage(`${actor.name} är inte längre bländad.`);
             if (effect.type === 'steamed') addLogMessage(`${actor.name} är inte längre ångad.`);
             if (effect.type === 'frozen') addLogMessage(`${actor.name} är inte längre frusen.`);
             if (effect.type === 'paralyzed') addLogMessage(`${actor.name} är inte längre förlamad.`);
             if (effect.type === 'stunned') addLogMessage(`${actor.name} är inte längre bedövad.`);
          }
      }
      
      // Decrement ultimate cooldowns for player
      if (actor.type === 'PLAYER') {
          const newCooldowns: Partial<Record<string, number>> = {};
          for (const ultId in actor.ultimateCooldowns) {
              const currentCd = actor.ultimateCooldowns[ultId] || 0;
              if (currentCd > 0) {
                  newCooldowns[ultId] = currentCd - 1;
              }
          }
          updateActorState(actorId, { hp, statusEffects: effectsAfterTurn, ultimateCooldowns: newCooldowns });
      } else {
          updateActorState(actorId, { hp, statusEffects: effectsAfterTurn });
      }
      
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
      const isFrozen = actor.statusEffects.some(e => e.type === 'frozen');
      const isStunned = actor.statusEffects.some(e => e.type === 'stunned');
      const isParalyzed = actor.statusEffects.some(e => e.type === 'paralyzed' && 'chanceToMissTurn' in e && Math.random() * 100 < e.chanceToMissTurn);

      if (skipTurn || isRooted || isFrozen || isStunned || isParalyzed) {
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
          await handleEnemyAction(actor.id);
          if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
             setGameState('ACTIVE');
          }
      }

  }, [actors, updateActorState, gameState, event.environment, character.archetype, playerStats.maxAether, character.element, event.enemies]);

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
    } else if (affix.effect.type === 'APPLY_STATUS') {
        const effect = affix.effect;
        let newStatus: StatusEffect | undefined;
        let existingEffects = targetActor.statusEffects.filter(s => s.type !== effect.status); // Remove existing of same type

        switch (effect.status) {
            case 'burning':
                newStatus = { type: 'burning', duration: effect.duration || 1, damage: effect.damage || 0 };
                break;
            case 'poisoned':
                newStatus = { type: 'poisoned', duration: effect.duration || 1, damage: effect.damage || 0 };
                break;
            case 'slowed':
                newStatus = { type: 'slowed', duration: effect.duration || 1 };
                break;
            case 'retaliating':
                newStatus = { type: 'retaliating', duration: effect.duration || 1, damage: effect.damage || 0 };
                break;
            case 'blinded':
                newStatus = { type: 'blinded', duration: effect.duration || 1 };
                break;
            case 'steamed':
                newStatus = { type: 'steamed', duration: effect.duration || 1, damage: effect.damage, accuracyReduction: effect.accuracyReduction };
                break;
            case 'rooted':
                newStatus = { type: 'rooted', duration: effect.duration || 1 };
                break;
            case 'paralyzed':
                newStatus = { type: 'paralyzed', duration: effect.duration || 1, chanceToMissTurn: effect.value || 0 }; // Assuming 'value' is chanceToMissTurn
                break;
            case 'defending':
                newStatus = { type: 'defending', duration: effect.duration || 1, value: effect.value };
                break;
            case 'hasted':
                newStatus = { type: 'hasted', duration: effect.duration || 1 };
                break;
            case 'regenerating':
                newStatus = { type: 'regenerating', duration: effect.duration || 1, heal: effect.value || 0 };
                break;
            case 'armor_reduction':
                newStatus = { type: 'armor_reduction', duration: effect.duration || 1, value: effect.value || 0 };
                break;
            case 'stunned':
                newStatus = { type: 'stunned', duration: effect.duration || 1 };
                break;
            case 'frozen':
                newStatus = { type: 'frozen', duration: effect.duration || 1 };
                break;
            case 'damage_reduction':
                newStatus = { type: 'damage_reduction', duration: effect.duration || 1, value: effect.value || 0, isPercentage: effect.isPercentage };
                break;
            case 'bleeding':
                newStatus = { type: 'bleeding', duration: effect.duration || 1, damage: effect.damage || 0 };
                break;
            case 'frightened':
                newStatus = { type: 'frightened', duration: effect.duration || 1, chanceToMissTurn: effect.value || 0, chanceToAttackRandom: effect.value || 0 };
                break;
            case 'reflecting':
                newStatus = { type: 'reflecting', duration: effect.duration || 1, element: effect.element!, value: effect.value || 0 };
                break;
            case 'absorbing':
                newStatus = { type: 'absorbing', duration: effect.duration || 1, element: effect.element!, value: effect.value || 0 };
                break;
            // Add other status effects as needed
            default:
                console.warn(`Unhandled status effect type in affix: ${effect.status}`);
                break;
        }

        if (newStatus) {
            updateActorState(targetActor.id, { statusEffects: [...existingEffects, newStatus] });
            addLogMessage(`${targetActor.name} får status: ${effect.status}!`);
            // Potentially add a visual effect for status application
            await sleep(300);
        }
    }
  };
  
  const performAttack = useCallback(async (attackerId: string, defenderId: string, baseDamage: number, damageElement: Element = Element.NEUTRAL, isSkill: boolean = false, skillEffect?: () => void) => {
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
          const resistanceValue = defender.type === 'ENEMY' && enemyData?.resistances ? (enemyData.resistances[damageElement] || 0) : 0;
          
          let resistanceMultiplier = 1;
          let popupType: DamagePopupType = isCrit ? 'crit' : 'damage';

          if (resistanceValue !== 0) {
              resistanceMultiplier = 1 - (resistanceValue / 100);
              if (resistanceValue > 0) { // Resistance
                  addLogMessage(`${defender.name} motstår ${Element[damageElement]} skada!`);
                  popupType = 'resisted';
              } else { // Weakness (resistanceValue < 0)
                  addLogMessage(`${defender.name} är svag mot ${Element[damageElement]} skada!`);
                  popupType = 'weakness';
              }
          }

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
          
          addDamagePopup(finalDamage.toString(), defenderId, popupType); // Use dynamic popupType
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
  }, [actors, addDamagePopup, addLogMessage, addVisualEffect, character.archetype, event.enemies, equipment, playerResource, playerStats.armor, playerStats.crit, playerStats.dodge, playerStats.maxAether, setPlayerResource, updateActorState]);

  const handlePlayerAction = async (action: 'ATTACK' | 'SKILL' | 'DEFEND' | 'ULTIMATE', abilityId?: string) => {
      setShowCommandMenu(false);
      setShowAbilityMenu(false);
      setShowUltimateMenu(false); // Close ultimate menu
      setGameState('EXECUTING');
      let player = actors.find(a => a.type === 'PLAYER');
      if (!player) return;

      const abilityInfo = abilityId ? PLAYER_ABILITIES[abilityId] : null;
      const ultimateInfo = abilityId ? ULTIMATE_ABILITIES[abilityId] : null;
      const rank = abilityId && abilityInfo ? (unlockedSkills.get(abilityId) || 1) : 1;
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
                 const isRooted = target.statusEffects.some(e => e.type === 'rooted');
                 const isSlowed = target.statusEffects.some(e => e.type === 'slowed');

                 // Reaction: Fire + Rooted/Slowed (Earth-like) = Molten Ground
                 if (abilityInfo.element === Element.FIRE && (isRooted || isSlowed)) {
                     addLogMessage(`Elden smälte marken och skapade glödande lera på ${target.name}!`);
                     updateActorState(target.id, {
                         statusEffects: target.statusEffects.filter(e => e.type !== 'rooted' && e.type !== 'slowed')
                     });
                     const moltenDamage = Math.floor(baseSkillDamage * 0.3);
                     const newBurningStatus: StatusEffect = { type: 'burning', duration: 3, damage: moltenDamage };
                     const newSlowedStatus: StatusEffect = { type: 'slowed', duration: 2 };
                     updateActorState(target.id, {
                         statusEffects: [...target.statusEffects.filter(e => e.type !== 'burning' && e.type !== 'slowed'), newBurningStatus, newSlowedStatus]
                     });
                     addDamagePopup(moltenDamage.toString(), target.id, 'status_damage');
                     addVisualEffect('molten_ground_vfx', player.id, target.id);
                     await sleep(500);
                 }
                 // Existing Reaction: Fire + Slowed = Steamed (This was a bug, Fire + Water = Steamed)
                 // This block is now removed as the Water + Burning reaction handles Steam.
                 else {
                    await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true);
                 }
               }
               break;
            case 'wind_3': // Cyklon
                if (target && rankData.damageMultiplier) {
                    const isSlowed = target.statusEffects.some(e => e.type === 'slowed');

                    // Reaction: Wind + Slowed (Water-like) = Electrified Water
                    if (abilityInfo.element === Element.WIND && isSlowed) {
                        addLogMessage(`Vinden laddade vattnet med elektricitet och bedövade ${target.name}!`);
                        updateActorState(target.id, {
                            statusEffects: target.statusEffects.filter(e => e.type !== 'slowed')
                        });
                        const electrifiedDamage = Math.floor(baseSkillDamage * 0.5);
                        const newStunnedStatus: StatusEffect = { type: 'stunned', duration: 1 };
                        updateActorState(target.id, {
                            statusEffects: [...target.statusEffects.filter(e => e.type !== 'stunned'), newStunnedStatus]
                        });
                        await performAttack(player.id, target.id, electrifiedDamage, Element.STORM, true); // Deal direct damage
                        addVisualEffect('electrified_vfx', player.id, target.id);
                        await sleep(500);
                    }
                    // Existing Reaction: Wind + Rooted/Slowed (from Mud) = Blinded
                    else if (target.statusEffects.some(e => e.type === 'rooted' || (e.type === 'slowed' && event.element === Element.MUD))) { // Assuming Mud environment for slowed
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
                    // Existing Reaction: Wind + Burning = Intensified Burn
                    else if (abilityInfo.element === Element.WIND && target.statusEffects.some(e => e.type === 'burning')) {
                        const existingBurning = target.statusEffects.find(e => e.type === 'burning');
                        if (existingBurning && existingBurning.type === 'burning') {
                            addLogMessage(`Vinden fläktar elden och intensifierar bränningen på ${target.name}!`);
                            updateActorState(target.id, {
                                statusEffects: target.statusEffects.filter(e => e.type !== 'burning')
                            });
                            const bonusFireDamage = Math.floor(existingBurning.damage * 1.5); // 50% more immediate damage
                            const newBurnDamage = Math.floor(existingBurning.damage * 1.2); // 20% stronger DoT
                            
                            await performAttack(player.id, target.id, bonusFireDamage, Element.FIRE, true);
                            
                            const newBurningStatus: StatusEffect = { type: 'burning', duration: 3, damage: newBurnDamage };
                            updateActorState(target.id, {
                                statusEffects: [...target.statusEffects.filter(e => e.type !== 'burning'), newBurningStatus]
                            });
                            addLogMessage(`${target.name} tar ${bonusFireDamage} bonus eldskada och brinner nu för ${newBurnDamage} per runda!`);
                            await sleep(500);
                        }
                    } else {
                        await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true);
                    }
                }
                break;
            case 'ice':
               if(target && rankData.damageMultiplier) await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true, () => {
                 if (rankData.duration) {
                    updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== 'slowed' && e.type !== 'frozen'), { type: 'frozen', duration: rankData.duration }] });
                    addLogMessage(`${target.name} fryses av isen!`);
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
                    addLogMessage(`Jordens kraft renar you from giftet!`);
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
              if(target && rankData.damageMultiplier && rankData.duration) {
                const isSlowed = target.statusEffects.some(e => e.type === 'slowed');

                // Reaction: Earth + Slowed (Water-like) = Quicksand
                if (abilityInfo.element === Element.EARTH && isSlowed) {
                    addLogMessage(`Jorden sög upp vattnet och skapade kvicksand för ${target.name}!`);
                    updateActorState(target.id, {
                        statusEffects: target.statusEffects.filter(e => e.type !== 'slowed')
                    });
                    const quicksandDamage = Math.floor(baseSkillDamage * 0.4);
                    const newRootedStatus: StatusEffect = { type: 'rooted', duration: 2 };
                    const newPoisonedStatus: StatusEffect = { type: 'poisoned', duration: 3, damage: Math.floor(quicksandDamage * 0.5) };
                    updateActorState(target.id, {
                        statusEffects: [...target.statusEffects.filter(e => e.type !== 'rooted' && e.type !== 'poisoned'), newRootedStatus, newPoisonedStatus]
                    });
                    addDamagePopup(quicksandDamage.toString(), target.id, 'status_damage');
                    addVisualEffect('quicksand_vfx', player.id, target.id);
                    await sleep(500);
                } else {
                    await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true, () => {
                       updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== 'slowed'), { type: 'slowed', duration: rankData.duration! }] });
                       addLogMessage(`${target.name} saktas ner!`);
                    });
                }
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
            case 'water_3': // Tidvattenvåg
              if(target && rankData.damageMultiplier && rankData.duration) {
                const isBurning = target.statusEffects.some(e => e.type === 'burning');

                // Reaction: Water + Burning (Fire-like) = Steamed
                if (abilityInfo.element === Element.WATER && isBurning) {
                    addLogMessage(`Vattnet släckte elden och skapade skållhet ånga på ${target.name}!`);
                    updateActorState(target.id, {
                        statusEffects: target.statusEffects.filter(e => e.type !== 'burning')
                    });
                    const steamedDamage = Math.floor(baseSkillDamage * 0.3);
                    const newSteamedStatus: StatusEffect = { type: 'steamed', duration: 2, damage: steamedDamage, accuracyReduction: 20 };
                    updateActorState(target.id, {
                        statusEffects: [...target.statusEffects.filter(e => e.type !== 'steamed'), newSteamedStatus]
                    });
                    addDamagePopup(steamedDamage.toString(), target.id, 'status_damage');
                    await sleep(500);
                } else {
                    await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, abilityInfo.element, true, () => {
                       updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== 'slowed'), { type: 'slowed', duration: rankData.duration! }] });
                       addLogMessage(`${target.name} saktas ner!`);
                    });
                }
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
                 const newEffects = [...target.statusEffects.filter(e => e.type !== 'slowed' && e.type !== 'rooted'), { type: 'slowed', duration: 3 }];
                 let log = `${target.name} fastnar i leran och saktas ner!`;
                 if (Math.random() < 0.25) { // 25% chance to root
                    newEffects.push({ type: 'rooted', duration: 2 });
                    log = `${target.name} sitter fast i leran!`
                 }
                 updateActorState(target.id, { statusEffects: newEffects });
                 addLogMessage(log);
              });
              break;
             case 'magma': // Magma Armor
              const retaliateDamage = Math.floor(playerStats.intelligence * 0.8);
              updateActorState(player.id, { atb: 0, statusEffects: [
                  ...player.statusEffects.filter(e => e.type !== 'retaliating'),
                  { type: 'retaliating', duration: 4, damage: retaliateDamage },
                  { type: 'defending', duration: 4 }
              ]});
              addLogMessage(`Du omger dig med Magma Armor!`);
              await sleep(500);
              break;
             case 'sand': // Sandstorm
              const livingEnemies = actors.filter(a => a.type === 'ENEMY' && !a.isDefeated);
              updateActorState(player.id, { animationState: 'casting', atb: 0 });
              for (const enemy of livingEnemies) {
                  let sandstormDamage = playerStats.damage * 0.6 + playerStats.intelligence;
                  if (hasFullFlow) sandstormDamage *= 1.5;
                  
                  const enemyData = event.enemies.find(e => e.id === enemy.id);
                  const resistance = enemyData?.resistances ? (enemyData.resistances[abilityInfo.element] || 0) : 0;
                  const resistanceMultiplier = 1 - (resistance / 100);
                  
                  const enemyArmor = enemyData?.stats.armor || 0;
                  const finalDamage = Math.floor(Math.max(1, (sandstormDamage - enemyArmor) * resistanceMultiplier));
                  const newHp = Math.max(0, enemy.hp - finalDamage);
                  const newStatusEffects: StatusEffect[] = [...enemy.statusEffects.filter(e => e.type !== 'blinded'), { type: 'blinded', duration: 3 }];
                  
                  updateActorState(enemy.id, { hp: newHp, statusEffects: newStatusEffects, animationState: 'hit' });
                  addDamagePopup(finalDamage.toString(), enemy.id, 'damage');
                  addLogMessage(`Sandstormen skadar ${enemy.name}!`);
                  
                  if (newHp <= 0) {
                      updateActorState(enemy.id, { isDefeated: true });
                      addLogMessage(`${enemy.name} har besegrats!`);
                  }
              }
              await sleep(500);
              livingEnemies.forEach(e => updateActorState(e.id, { animationState: 'idle' }));
              updateActorState(player.id, { animationState: 'idle' });
              break;
            default:
              addLogMessage("Färdigheten är inte implementerad än.");
              updateActorState(player.id, { atb: 0 });
              await sleep(500);
              break;
          }
           // --- POST-ACTION RESOURCE LOGIC ---
          if (character.archetype === 'Tidvattenvävaren') {
            if (hasFullFlow) {
              setPlayerResource(0);
              updateActorState(player.id, { statusEffects: player.statusEffects.filter(e => e.type !== 'full_flow')});
              addLogMessage("Fullt Flöde har förbrukats!");
            } else if (abilityInfo.category === 'heal' || abilityInfo.category === 'cc') {
              const newFlode = playerResource - effectiveCost + FLODE_PER_HEAL_CC; // Recalc based on state before this action
              setPlayerResource(r => {
                  const updatedFlode = r + FLODE_PER_HEAL_CC;
                  if (updatedFlode >= playerStats.maxAether) {
                      updateActorState(player.id, { statusEffects: [...player.statusEffects.filter(e => e.type !== 'full_flow'), {type: 'full_flow', duration: 99}] });
                      addLogMessage("Fullt Flöde uppnått! Nästa förmåga är förstärkt!");
                  }
                  return Math.min(playerStats.maxAether, updatedFlode);
              });
            }
          }
      } else if (action === 'ULTIMATE' && ultimateInfo) {
          if (player.ultimateCooldowns[ultimateInfo.id] && player.ultimateCooldowns[ultimateInfo.id] > 0) {
              addLogMessage(`${ultimateInfo.name} är på nedkylning (${player.ultimateCooldowns[ultimateInfo.id]} rundor kvar)!`);
              setGameState('PLAYER_TURN'); // Return to player turn if ultimate is on cooldown
              setShowUltimateMenu(true);
              return;
          }

          addLogMessage(`Du använder din ultimata förmåga: ${ultimateInfo.name}!`);
          updateActorState(player.id, { animationState: 'casting', atb: 0, ultimateCooldowns: { ...player.ultimateCooldowns, [ultimateInfo.id]: ultimateInfo.cooldown } });
          await sleep(500); // Casting animation

          const livingEnemies = actors.filter(a => a.type === 'ENEMY' && !a.isDefeated);
          const allActors = actors.filter(a => !a.isDefeated);

          switch (ultimateInfo.effect.type) {
              case 'AOE_DAMAGE':
                  addVisualEffect('meteor_impact', player.id, livingEnemies[0]?.id || player.id); // VFX targets first enemy or self
                  await sleep(500);
                  for (const enemy of livingEnemies) {
                      let ultimateDamage = (ultimateInfo.effect.damage || 0) + (playerStats.intelligence * 2);
                      
                      const enemyData = event.enemies.find(e => e.id === enemy.id);
                      const resistance = enemyData?.resistances ? (enemyData.resistances[ultimateInfo.element] || 0) : 0;
                      const resistanceMultiplier = 1 - (resistance / 100);
                      
                      const enemyArmor = enemyData?.stats.armor || 0;
                      const finalDamage = Math.floor(Math.max(1, (ultimateDamage - enemyArmor) * resistanceMultiplier));
                      const newHp = Math.max(0, enemy.hp - finalDamage);
                      
                      updateActorState(enemy.id, { hp: newHp, animationState: 'hit' });
                      addDamagePopup(finalDamage.toString(), enemy.id, 'damage');
                      addLogMessage(`${enemy.name} tar ${finalDamage} skada från ${ultimateInfo.name}!`);
                      
                      if (ultimateInfo.effect.buff && ultimateInfo.effect.duration) {
                          const buffType = ultimateInfo.effect.buff;
                          let newStatus: StatusEffect | undefined;

                          switch (buffType) {
                              case 'burning':
                                  newStatus = { type: 'burning', duration: ultimateInfo.effect.duration, damage: ultimateInfo.effect.value || 0 };
                                  break;
                              case 'armor_reduction':
                                  newStatus = { type: 'armor_reduction', duration: ultimateInfo.effect.duration, value: ultimateInfo.effect.value || 0 };
                                  break;
                              case 'stunned':
                                  newStatus = { type: 'stunned', duration: ultimateInfo.effect.duration };
                                  break;
                              case 'frozen':
                                  newStatus = { type: 'frozen', duration: ultimateInfo.effect.duration };
                                  break;
                              case 'regenerating':
                                  newStatus = { type: 'regenerating', duration: ultimateInfo.effect.duration, heal: ultimateInfo.effect.value || 0 };
                                  break;
                              case 'damage_reduction':
                                  newStatus = { type: 'damage_reduction', duration: ultimateInfo.effect.duration, value: ultimateInfo.effect.value || 0, isPercentage: ultimateInfo.effect.isPercentage };
                                  break;
                              case 'paralyzed':
                                  newStatus = { type: 'paralyzed', duration: ultimateInfo.effect.duration, chanceToMissTurn: ultimateInfo.effect.value || 0 };
                                  break;
                              case 'frightened':
                                  newStatus = { type: 'frightened', duration: ultimateInfo.effect.duration, chanceToMissTurn: ultimateInfo.effect.value || 0, chanceToAttackRandom: ultimateInfo.effect.value || 0 };
                                  break;
                              case 'reflecting':
                              case 'absorbing':
                                  newStatus = { type: buffType, duration: ultimateInfo.effect.duration, element: ultimateInfo.element, value: ultimateInfo.effect.value || 0 };
                                  break;
                              case 'bleeding':
                                  newStatus = { type: 'bleeding', duration: ultimateInfo.effect.duration, damage: ultimateInfo.effect.value || 0 };
                                  break;
                              case 'steamed':
                                  newStatus = { type: 'steamed', duration: ultimateInfo.effect.duration, damage: ultimateInfo.effect.value, accuracyReduction: ultimateInfo.effect.value };
                                  break;
                              case 'slowed':
                              case 'blinded':
                              case 'rooted':
                              case 'defending':
                              case 'hasted':
                              case 'full_flow':
                              case 'overheated':
                                  newStatus = { type: buffType, duration: ultimateInfo.effect.duration } as StatusEffect;
                                  break;
                              case 'pushed_back':
                              case 'cleanse_debuffs_action':
                              case 'cleanse_all_debuffs_action':
                                  // These are not StatusEffect objects, so we don't create a newStatus for them here.
                                  break;
                              default:
                                  console.warn(`Unknown buff type encountered: ${buffType}`);
                                  break;
                          }

                          if (newStatus) {
                              updateActorState(enemy.id, { statusEffects: [...enemy.statusEffects.filter(e => e.type !== newStatus!.type), newStatus!] });
                              addLogMessage(`${enemy.name} får status: ${newStatus!.type}!`);
                          }
                      }

                      if (newHp <= 0) {
                          updateActorState(enemy.id, { isDefeated: true });
                          addLogMessage(`${enemy.name} har besegrats!`);
                      }
                      await sleep(200);
                  }
                  break;
              case 'MASS_HEAL':
                  addVisualEffect('water_bless_vfx', player.id, player.id);
                  await sleep(500);
                  for (const actor of allActors) {
                      if (actor.type === 'PLAYER') { // Only heal player for now
                          let healAmount = (ultimateInfo.effect.heal || 0) + (playerStats.intelligence * 1.5);
                          const newHp = Math.min(actor.maxHp, actor.hp + healAmount);
                          updateActorState(actor.id, { hp: newHp });
                          addDamagePopup(`+${healAmount}`, actor.id, 'heal');
                          addLogMessage(`${actor.name} läker för ${healAmount} HP!`);

                          if (ultimateInfo.effect.buff === 'cleanse_debuffs_action' || ultimateInfo.effect.buff === 'cleanse_all_debuffs_action') {
                              updateActorState(actor.id, { statusEffects: [] }); // Cleanses all debuffs
                              addLogMessage(`${actor.name} renas från alla negativa effekter!`);
                          }
                          if (ultimateInfo.effect.buff === 'regenerating' && ultimateInfo.effect.duration && ultimateInfo.effect.value) {
                              const newStatus: StatusEffect = { type: 'regenerating', duration: ultimateInfo.effect.duration, heal: ultimateInfo.effect.value };
                              updateActorState(actor.id, { statusEffects: [...actor.statusEffects.filter(e => e.type !== newStatus.type), newStatus] });
                              addLogMessage(`${actor.name} får regenerering!`);
                          }
                      }
                  }
                  break;
              case 'GLOBAL_BUFF':
                  addVisualEffect('earthquake_vfx', player.id, player.id); // Placeholder VFX
                  await sleep(500);
                  for (const actor of allActors) {
                      if (actor.type === 'PLAYER' && ultimateInfo.effect.buff === 'damage_reduction' && ultimateInfo.effect.duration && ultimateInfo.effect.value) {
                          const newStatus: StatusEffect = { type: 'damage_reduction', duration: ultimateInfo.effect.duration, value: ultimateInfo.effect.value, isPercentage: ultimateInfo.effect.isPercentage };
                          updateActorState(actor.id, { statusEffects: [...actor.statusEffects.filter(e => e.type !== newStatus.type), newStatus] });
                          addLogMessage(`${actor.name} får skadereduktion!`);
                      }
                  }
                  break;
              case 'SINGLE_TARGET_DAMAGE':
                  if (target) {
                      let ultimateDamage = (ultimateInfo.effect.damage || 0) + (playerStats.intelligence * 3);
                      
                      const enemyData = event.enemies.find(e => e.id === target.id);
                      const resistance = enemyData?.resistances ? (enemyData.resistances[ultimateInfo.element] || 0) : 0;
                      const resistanceMultiplier = 1 - (resistance / 100);
                      
                      const enemyArmor = enemyData?.stats.armor || 0;
                      const finalDamage = Math.floor(Math.max(1, (ultimateDamage - enemyArmor) * resistanceMultiplier));
                      const newHp = Math.max(0, target.hp - finalDamage);
                      
                      updateActorState(target.id, { hp: newHp, animationState: 'hit' });
                      addDamagePopup(finalDamage.toString(), target.id, 'damage');
                      addLogMessage(`${target.name} tar ${finalDamage} skada från ${ultimateInfo.name}!`);

                      if (ultimateInfo.effect.buff === 'frozen' && ultimateInfo.effect.duration) {
                          const newStatus: StatusEffect = { type: 'frozen', duration: ultimateInfo.effect.duration };
                          updateActorState(target.id, { statusEffects: [...target.statusEffects.filter(e => e.type !== newStatus.type), newStatus] });
                          addLogMessage(`${target.name} fryses av isen!`);
                      }

                      if (newHp <= 0) {
                          updateActorState(target.id, { isDefeated: true });
                          addLogMessage(`${target.name} har besegrats!`);
                      }
                  }
                  break;
          }
          await sleep(500);
          updateActorState(player.id, { animationState: 'idle' });
          livingEnemies.forEach(e => updateActorState(e.id, { animationState: 'idle' })); // Reset enemy animation states
      }
      
      if(gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
         setGameState('ACTIVE');
      }
  };

  const handleEnemyAction = async (enemyId: string) => {
      let player = actors.find(a => a.type === 'PLAYER');
      if (!player || player.hp <= 0 || player.isDefeated) return;
      
      const enemyData = event.enemies.find(e => e.id === enemyId);
      const enemyActor = actors.find(a => a.id === enemyId);
      if (!enemyData || !enemyActor) return;
      
      // Check if enemy is blinded
      const isBlinded = enemyActor.statusEffects.some(e => e.type === 'blinded');
      if (isBlinded && Math.random() < 0.5) { // 50% chance to miss if blinded
          addLogMessage(`${enemyData.name} är bländad och missar sin attack!`);
          updateActorState(enemyId, { atb: 0 });
          await sleep(500);
          if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
             setGameState('ACTIVE');
          }
          return;
      }

      if (enemyData.specialAbility === 'HASTE_SELF' && Math.random() < 0.4) { // 40% chance
          const existingEffects = enemyActor.statusEffects.filter(e => e.type !== 'hasted');
          const newEffects: StatusEffect[] = [...existingEffects, { type: 'hasted', duration: 4 }];
          
          updateActorState(enemyId, { atb: 0, statusEffects: newEffects });
          addVisualEffect('haste', enemyId, enemyId);
          addLogMessage(`${enemyData.name} använder vindhastighet!`);
          await sleep(500);
      } else {
          await performAttack(enemyId, player.id, enemyData?.stats.damage || 5, enemyData.element);
      }
      
      // Check for retaliation damage
      player = actors.find(a => a.type === 'PLAYER'); // Re-fetch player state
      if (player && !player.isDefeated) {
          const retaliateEffect = player.statusEffects.find(e => e.type === 'retaliating');
          const currentAttacker = actors.find(a => a.id === enemyId);
          // FIX: Re-order conditions to help TypeScript with type narrowing.
          // The optional chaining with a type check is correct, but can be made more explicit
          // to potentially help older/stricter TS versions. The `find` predicate doesn't
          // always narrow the return type for the compiler.
          if (retaliateEffect && retaliateEffect.type === 'retaliating' && currentAttacker && !currentAttacker.isDefeated) {
              await sleep(300);
              const retaliateDamage = retaliateEffect.damage;
              const newAttackerHp = Math.max(0, currentAttacker.hp - retaliateDamage);
              updateActorState(enemyId, { hp: newAttackerHp, animationState: 'hit' });
              addDamagePopup(retaliateDamage.toString(), enemyId, 'damage');
              addLogMessage(`${player.name}'s Magma Armor skadar ${enemyData.name}!`);
              if (newAttackerHp <= 0) {
                  updateActorState(enemyId, { isDefeated: true });
                  addLogMessage(`${enemyData.name} besegrades av Magma Armor!`);
              }
              await sleep(300);
              updateActorState(enemyId, { animationState: 'idle' });
          }
      }
  };
  
  useEffect(() => {
    if (gameState === 'PLAYER_TURN') {
      const livingEnemies = actors.filter(a => a.type === 'ENEMY' && !a.isDefeated);
      if (livingEnemies.length > 0) {
        // If an AoE skill is selected, no target is needed. For now, we simplify and always select one.
        if (!livingEnemies.some(e => e.id === selectedTarget)) {
            setSelectedTarget(livingEnemies[0].id);
        }
      }
    }
  }, [actors, gameState, selectedTarget]);


  useEffect(() => {
      if (gameState === 'VICTORY' || gameState === 'DEFEAT') return;
      
      const activeEnemies = actors.filter(a => a.type === 'ENEMY' && !a.isDefeated);
      const player = actors.find(a => a.type === 'PLAYER');

      if (actors.length > 1 && player && player.isDefeated) {
          setGameState('DEFEAT');
      } else if (actors.length > 1 && activeEnemies.length === 0) {
          soundEffects.victory(); // Aktiverad ljudeffekt
          setGameState('VICTORY');
      }
  }, [actors, gameState]);
  
  const handleDefeatAnimationEnd = (actorId: string) => {
      setActors(prev => prev.filter(a => a.id !== actorId));
  }

  const abilitiesByElement = playerStats.abilities.reduce((acc: Record<string, { element: Element, abilities: PlayerAbility[] }>, ability) => {
    const elementName = Element[ability.element];
    if (!acc[elementName]) {
        acc[elementName] = { element: ability.element, abilities: [] };
    }
    acc[elementName].abilities.push(ability);
    return acc;
  }, {} as Record<string, { element: Element, abilities: PlayerAbility[] }>);

  const elementSortOrder = [
      Element.FIRE, Element.EARTH, Element.WIND, Element.WATER,
      Element.MAGMA, Element.OBSIDIAN, Element.FIRESTORM, Element.HOT_AIR, Element.STEAM,
      Element.HOT_SPRINGS, Element.SAND, Element.EROSION, Element.MUD, Element.GROWTH,
      Element.ICE, Element.STORM,
      Element.VOLCANIC_STORM, Element.ELECTRIFIED_MUD, Element.VITRIFIED_STORM,
      Element.NEUTRAL
  ];

  const sortedAbilities = Object.entries(abilitiesByElement).sort((
    [, a]: [string, { element: Element, abilities: PlayerAbility[] }],
    [, b]: [string, { element: Element, abilities: PlayerAbility[] }]
  ) => {
      return elementSortOrder.indexOf(a.element) - elementSortOrder.indexOf(b.element);
  });

  const unlockedUltimateAbilities = character.unlockedUltimateAbilities.map(id => ULTIMATE_ABILITIES[id]);


  const ActorSprite: React.FC<{actor: Actor; onDefeatAnimationEnd: (id: string) => void; equipment?: Record<EquipmentSlot, Item | null>}> = ({ actor, onDefeatAnimationEnd, equipment }) => {
    const isSelected = selectedTarget === actor.id && (showCommandMenu || showAbilityMenu || showUltimateMenu) && actor.type === 'ENEMY';
    const Icon = actor.icon;
    
    let animationClass = actor.isDefeated ? 'animate-defeat' : 'animate-idle-bob';
    if(actor.animationState === 'attacking' && !actor.isDefeated) {
        animationClass = actor.type === 'PLAYER' ? 'animate-attack-player' : 'animate-attack-enemy';
    } else if (actor.animationState === 'hit' && !actor.isDefeated) {
        animationClass = 'animate-hit-flash';
    }

    const statusIconMap: Partial<Record<StatusEffect['type'], { icon: React.FC; title: string; }>> = {
        'defending': { icon: Icons.Shield, title: "Defending" },
        'hasted': { icon: Icons.Wind, title: "Hasted" },
        'burning': { icon: Icons.Burn, title: "Burning" },
        'poisoned': { icon: Icons.Poison, title: "Poisoned" },
        'slowed': { icon: Icons.Slow, title: "Slowed" },
        'blinded': { icon: Icons.Blinded, title: "Blinded" }, // New
        'retaliating': { icon: Icons.Magma, title: "Retaliating" },
        'full_flow': { icon: Icons.FullFlow, title: "Full Flow" },
        'overheated': { icon: Icons.Overheat, title: "Overheated" },
        'rooted': { icon: Icons.Rooted, title: "Rooted" }, // New
        'steamed': { icon: Icons.Steamed, title: "Steamed" }, // New
        'regenerating': { icon: Icons.Regenerating, title: "Regenerating" },
        'frozen': { icon: Icons.Frozen, title: "Frozen" }, // New
        'paralyzed': { icon: Icons.Paralyzed, title: "Paralyzed" }, // New
    };


    return (
       <div 
          ref={actor.ref} 
          className={`relative flex flex-col items-center ${animationClass}`}
          onAnimationEnd={() => { if(actor.isDefeated) onDefeatAnimationEnd(actor.id) }}
        >
          {isSelected && <div className="absolute -top-4 text-yellow-400 text-2xl">▼</div>}
          
          <div className="relative transform scale-[3] w-12 h-12 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <Icon />
              {/* FIX: Explicitly type 'item' to prevent 'unknown' type errors. */}
              {equipment && Object.values(equipment).map((item: Item | null) => {
                  if (item && item.visual) {
                      const VisualComponent = item.visual;
                      return (
                          <div key={item.id} className="absolute inset-0 flex items-center justify-center">
                              <VisualComponent />
                          </div>
                      );
                  }
                  return null;
              })}
            </div>
            {/* Status Effect Visuals */}
            <div className="status-vfx-overlay">
                {actor.statusEffects.some(e => e.type === 'burning') && <div className="vfx-burning-overlay" />}
                {actor.statusEffects.some(e => e.type === 'poisoned') && <div className="vfx-poison-overlay" />}
                {actor.statusEffects.some(e => e.type === 'steamed') && <div className="vfx-steamed-overlay" />} {/* New VFX for steamed */}
            </div>
            {/* Status Effect Icons */}
             <div className="absolute top-0 left-0 w-full h-full">
                {actor.statusEffects.map((effect, index) => {
                    const iconData = statusIconMap[effect.type];
                    if (!iconData) return null;
                    const Icon = iconData.icon;
                    // Position icons around the sprite
                    const angle = (index / actor.statusEffects.length) * 2 * Math.PI;
                    const x = Math.cos(angle) * 12 - 4;
                    const y = Math.sin(angle) * 12 - 4;
                    return (
                        <div
                            key={effect.type}
                            className="status-icon"
                            style={{ transform: `translate(${x}px, ${y}px)` }}
                            title={`${iconData.title} (${effect.duration} turns left)`}
                        >
                            <Icon />
                            <span className="status-duration">{effect.duration}</span>
                        </div>
                    );
                })}
            </div>
          </div>

          <div className="w-24 mt-2">
            <div className="text-xs text-center">{actor.name}</div>
            <div className="w-full bg-gray-700 h-2 mt-1 border border-black">
                <div className="health-bar-fg h-full" style={{width: `${(actor.hp / actor.maxHp) * 100}%`}}></div>
            </div>
            {actor.type === 'ENEMY' && (
              <div className="w-full atb-bar-bg h-2 mt-1 border border-black/50">
                  <div className="atb-bar-fg h-full" style={{width: `${actor.atb}%`}}></div>
              </div>
            )}
          </div>
       </div>
    );
  };
  
  const VFXLayer = () => {
    return (
      <>
        {visualEffects.map(vfx => {
            const origin = actors.find(a => a.id === vfx.originId);
            const target = actors.find(a => a.id === vfx.targetId);
            if (!origin?.ref?.current || !target?.ref?.current) return null;
            
            const originRect = origin.ref.current.getBoundingClientRect();
            const targetRect = target.ref.current.getBoundingClientRect();

            if (vfx.type === 'fireball') {
                return <div key={vfx.id} className="vfx-fireball absolute" style={{ left: originRect.left, top: originRect.top, transform: `translate(${targetRect.left - originRect.left}px, ${targetRect.top - originRect.top}px)` }} />;
            }
            if(vfx.type === 'slash') {
                return <div key={vfx.id} className="vfx-slash absolute" style={{ left: targetRect.left + 10, top: targetRect.top + 10 }} />
            }
            if (vfx.type === 'heal') {
                return <div key={vfx.id} className="absolute" style={{ left: targetRect.left + targetRect.width / 2, top: targetRect.top }}>
                    {[...Array(5)].map((_, i) => <div key={i} className="vfx-heal-drop" style={{ left: `${Math.random() * 40 - 20}px`, animationDelay: `${i * 0.1}s` }} />)}
                </div>
            }
             if (vfx.type === 'haste') {
                return <div key={vfx.id} className="absolute w-16 h-16 border-2 border-dashed border-sky-400 rounded-full animate-spin" style={{ left: targetRect.left, top: targetRect.top }} />
            }
            if (vfx.type === 'frozen') {
                return <div key={vfx.id} className="absolute w-16 h-16 bg-blue-300/50 rounded-full animate-pulse" style={{ left: targetRect.left, top: targetRect.top }} />
            }
            if (vfx.type === 'paralyzed') {
                return <div key={vfx.id} className="absolute w-16 h-16 border-4 border-yellow-400 rounded-full animate-pulse" style={{ left: targetRect.left, top: targetRect.top }} />
            }
            if (vfx.type === 'meteor_impact') {
                return <div key={vfx.id} className="absolute w-24 h-24 bg-red-500/70 rounded-full animate-pulse-glow" style={{ left: targetRect.left - 24, top: targetRect.top - 24, boxShadow: '0 0 30px 15px #ef4444' }} />
            }
            if (vfx.type === 'earthquake_vfx') {
                return <div key={vfx.id} className="absolute w-full h-full bg-amber-700/30 animate-pulse" style={{ left: 0, top: 0, boxShadow: 'inset 0 0 50px #a16207' }} />
            }
            if (vfx.type === 'wind_burst_vfx') {
                return <div key={vfx.id} className="absolute w-full h-full bg-sky-500/30 animate-pulse" style={{ left: 0, top: 0, boxShadow: 'inset 0 0 50px #0ea5e9' }} />
            }
            if (vfx.type === 'water_bless_vfx') {
                return <div key={vfx.id} className="absolute w-full h-full bg-blue-500/30 animate-pulse" style={{ left: 0, top: 0, boxShadow: 'inset 0 0 50px #3b82f6' }} />
            }
            if (vfx.type === 'electrified_vfx') {
                return <div key={vfx.id} className="absolute w-20 h-20 border-4 border-yellow-300 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #facc15' }} />
            }
            if (vfx.type === 'molten_ground_vfx') {
                return <div key={vfx.id} className="absolute w-20 h-20 bg-orange-600/50 rounded-full animate-pulse-glow" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #d97706' }} />
            }
            if (vfx.type === 'quicksand_vfx') {
                return <div key={vfx.id} className="absolute w-20 h-20 bg-stone-700/50 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #78350f' }} />
            }
            return null;
        })}
      </>
    )
  }

  return (
    <div className="flex-grow w-full h-full p-2 text-white flex flex-col items-center justify-center bg-black/80 relative overflow-hidden">
        {/* Combat Background */}
        <CombatBackground element={event.element} />

        {/* Environment Display */}
        {event.environment && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 pixelated-border p-3 text-center z-10 max-w-md">
                <h3 className="text-lg text-yellow-400 mb-1">{event.environment.name}</h3>
                <p className="text-xs text-gray-300">{event.environment.description}</p>
            </div>
        )}

        {/* Battle Scene */}
        <div className="w-full flex justify-between items-end px-16 absolute bottom-64 z-10">
             <div className="flex space-x-8">
                 {actors.filter(a => a.type === 'ENEMY').map(enemy => <ActorSprite key={enemy.id} actor={enemy} onDefeatAnimationEnd={handleDefeatAnimationEnd} />)}
             </div>
             <div className="flex">
                 {actors.find(a => a.type === 'PLAYER') && <ActorSprite actor={actors.find(a => a.type === 'PLAYER')!} onDefeatAnimationEnd={handleDefeatAnimationEnd} equipment={equipment} />}
             </div>
        </div>

        {/* UI Panels */}
        <div className="absolute bottom-0 left-0 right-0 h-48 flex z-20">
            {/* Command & Ability Menus */}
            {showCommandMenu && (
                <div className="ff-panel w-48">
                    <ul>
                        <li onClick={() => handlePlayerAction('ATTACK')} className="p-1 hover:bg-white/20 cursor-pointer">Attackera</li>
                        <li onClick={() => { setShowCommandMenu(false); setShowAbilityMenu(true); }} className="p-1 hover:bg-white/20 cursor-pointer">Förmågor</li>
                        <li onClick={() => { setShowCommandMenu(false); setShowUltimateMenu(true); }} className="p-1 hover:bg-white/20 cursor-pointer">Ultimata</li> {/* New button */}
                        <li onClick={() => handlePlayerAction('DEFEND')} className="p-1 hover:bg-white/20 cursor-pointer">Försvara</li>
                    </ul>
                </div>
            )}
            {showAbilityMenu && (
                <div className="ff-panel w-64 text-xs">
                    <ul className="h-full overflow-y-auto">
                      {sortedAbilities.map(([elementName, { abilities }]: [string, { element: Element, abilities: PlayerAbility[] }]) => (
                          <React.Fragment key={elementName}>
                              <li className="p-1 pt-2 font-bold text-yellow-400 capitalize">{elementName.toLowerCase().replace('_', ' ')}</li>
                              {abilities.map(ability => {
                                  const rank = unlockedSkills.get(ability.id) || 1;
                                  const rankData = ability.ranks[rank - 1];
                                  if (!rankData) return null;

                                  const hasFullFlow = actors.find(a => a.type === 'PLAYER')?.statusEffects.some(e => e.type === 'full_flow');
                                  const effectiveCost = hasFullFlow ? 0 : rankData.resourceCost;
                                  const canAfford = character.archetype === 'Pyromanten' ? true : playerResource >= effectiveCost;
                                  const costText = character.archetype === 'Pyromanten' ? `+${rankData.resourceCost}` : `${effectiveCost}`;
        
                                  return (
                                    <li key={ability.id}
                                        onClick={() => canAfford ? handlePlayerAction('SKILL', ability.id) : undefined}
                                        className={`p-1 flex justify-between ${canAfford ? 'hover:bg-white/20 cursor-pointer pl-3' : 'text-gray-500 pl-3'}`}>
                                        <span>{ability.name} {hasFullFlow && '⚡'}</span>
                                        <span className={character.archetype === 'Pyromanten' ? 'text-green-400' : ''}>{costText}</span>
                                    </li>
                                  )
                              })}
                          </React.Fragment>
                      ))}
                    </ul>
                    <button onClick={() => { setShowAbilityMenu(false); setShowCommandMenu(true); }} className="text-center w-full mt-1 text-gray-400 hover:text-white">Tillbaka</button>
                </div>
            )}
            {showUltimateMenu && ( // New Ultimate Abilities Menu
                <div className="ff-panel w-64 text-xs">
                    <ul className="h-full overflow-y-auto">
                        {unlockedUltimateAbilities.length > 0 ? (
                            unlockedUltimateAbilities.map(ultimate => {
                                const playerActor = actors.find(a => a.type === 'PLAYER');
                                const currentCooldown = playerActor?.ultimateCooldowns[ultimate.id] || 0;
                                const isReady = currentCooldown === 0;
                                const Icon = ultimate.icon;

                                return (
                                    <li key={ultimate.id}
                                        onClick={() => isReady ? handlePlayerAction('ULTIMATE', ultimate.id) : undefined}
                                        className={`p-1 flex justify-between items-center ${isReady ? 'hover:bg-white/20 cursor-pointer pl-3' : 'text-gray-500 pl-3'}`}>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 flex items-center justify-center"><Icon /></div>
                                            <span>{ultimate.name}</span>
                                        </div>
                                        <span>{isReady ? 'Redo' : `CD: ${currentCooldown}`}</span>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="p-1 text-gray-500 text-center">Inga ultimata förmågor upplåsta.</li>
                        )}
                    </ul>
                    <button onClick={() => { setShowUltimateMenu(false); setShowCommandMenu(true); }} className="text-center w-full mt-1 text-gray-400 hover:text-white">Tillbaka</button>
                </div>
            )}
            
            {/* Log */}
            <div className="ff-panel flex-grow h-full overflow-hidden">
                 {log.map((msg, i) => <p key={i} className="text-sm">{msg}</p>)}
            </div>

            {/* Player Status */}
            <div className="ff-panel w-96 text-sm">
                <div className="grid grid-cols-3 gap-x-2 items-center">
                    <span className="text-right">{character.name}</span>
                    <span className="text-cyan-400">HP</span>
                    <span>{actors.find(a=>a.type==='PLAYER')?.hp} / {playerStats.maxHealth}</span>

                    <span></span>
                    <span className={resourceTheme.text}>{playerStats.resourceName}</span>
                    <span>{Math.floor(playerResource)} / {playerStats.maxAether}</span>
                    
                    <span></span>
                    <span className="text-yellow-400">ATB</span>
                    <div className="atb-bar-bg h-3 border border-black/50">
                        <div className="atb-bar-fg h-full" style={{width: `${actors.find(a=>a.type==='PLAYER')?.atb || 0}%`}}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Victory/Defeat Modal */}
        {(gameState === 'VICTORY' || gameState === 'DEFEAT') && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
                <div className="ff-panel text-center p-8">
                    <h2 className="text-4xl mb-4">{gameState === 'VICTORY' ? 'Seger!' : 'Besegrad...'}</h2>
                    {gameState === 'VICTORY' && (
                        <div className="text-yellow-300">
                            <p>Du får {event.rewards.xp} erfarenhet.</p>
                            {event.rewards.items.map((item, i) => <p key={i}>Föremål: {item.name}</p>)}
                        </div>
                    )}
                     {gameState === 'DEFEAT' && (
                        <div className="text-red-400">
                            <p>Du har fallit i strid. Resan tar slut här... för nu.</p>
                        </div>
                    )}
                    <button onClick={() => onComplete(gameState === 'VICTORY' ? event.rewards : {xp: 0, items: []})} className="mt-6 px-4 py-2 border-2 text-lg bg-gray-800/50 border-gray-600 hover:border-yellow-400 text-white transition-colors">
                        Fortsätt
                    </button>
                </div>
            </div>
        )}
        
        <div ref={popupContainerRef} className="absolute inset-0 pointer-events-none">
            <VFXLayer/>
            
            {/* Damage Popups */}
            {damagePopups.map(p => (
                <div key={p.id} className={`damage-popup damage-popup-${p.type}`} style={{ left: p.x, top: p.y }}>
                    {p.text}
                </div>
            ))}
        </div>
    </div>
  );
};

export default EventView;