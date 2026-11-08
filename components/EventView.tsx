import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameEvent, Character, StatusEffect, PlayerAbility, EquipmentSlot, Item, ItemAffix, ItemStats, DamagePopupType, EnemyApplyStatusEffect, EnemyAbility, EnemyBehavior } from '../types';
import { Element } from '../types';
import { Icons, ARCHETYPES, PLAYER_ABILITIES, ULTIMATE_ABILITIES } from '../constants'; // Added ULTIMATE_ABILITIES
import { soundEffects } from '../sound'; // Aktiverar importen av ljudeffekter
import CombatBackground from './CombatBackground'; // Import the new CombatBackground component
import { useATBEngine } from '../hooks/useATBEngine';
import { evaluateBossPhase, resolveBehaviorTarget } from '../utils/combatAI';

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
  ultimateCooldowns: Partial<Record<string, number>>; // Track player ultimate cooldowns
  enemyAbilityCooldowns: Partial<Record<string, number>>; // Track enemy active ability cooldowns
  currentBehavior?: EnemyBehavior;   // optional, initieras från e.behavior
  phaseIndex: number;                // required, 0 = inga faser applicerade
};


type DamagePopup = { id: number; text: string; x: number; y: number; type: DamagePopupType; };
type VisualEffect = { id: number; type: 'slash' | 'fireball' | 'heal' | 'haste' | 'frozen' | 'paralyzed' | 'meteor_impact' | 'earthquake_vfx' | 'wind_burst_vfx' | 'water_bless_vfx' | 'electrified_vfx' | 'molten_ground_vfx' | 'quicksand_vfx' | 'petrified_vfx' | 'frail_vfx' | 'frightened_vfx' | 'blood_spatter' | 'burning_spell_vfx' | 'blizzard_storm_vfx' | 'flying_stones_vfx'; targetId: string; originId: string; }; // Added new VFX types

const resourceThemes: Record<string, { text: string; bg: string }> = {
    'Hetta': { text: 'text-orange-400', bg: 'bg-orange-500' },
    'Styrka': { text: 'text-amber-500', bg: 'bg-amber-600' },
    'Energi': { text: 'text-sky-400', bg: 'bg-sky-500' },
    'Flöde': { text: 'text-blue-400', bg: 'bg-blue-500' },
    'Aether': { text: 'text-blue-400', bg: 'bg-blue-500' },
    'Nåd': { text: 'text-yellow-300', bg: 'bg-yellow-500' },
    'Skugga': { text: 'text-purple-400', bg: 'bg-purple-600' },
};

// --- Archetype-specific resource constants ---
const ENERGI_REGEN_PER_TURN = 25;
const HETTA_DECAY_PER_TURN = 10;
const STYRKA_PER_HIT = 15;
const STYRKA_PER_DEFEND = 25;
const FLODE_PER_HEAL_CC = 30;

// Retro Pixel-Art Styled Icons for Combat Actions
const SwordIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size} shrink-0`} viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.5 2a1.5 1.5 0 012.12 0l.38.38a1.5 1.5 0 010 2.12L12 6.5 9.5 4l2-2zM8.5 5L1 12.5V15h2.5L11 7.5 8.5 5zM3 13h1v1H3v-1z" />
  </svg>
);

const SparkIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size} shrink-0`} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1zM4 11l.75 1.75L6.5 13.5l-1.75.75L4 16l-.75-1.75L1.5 13.5l1.75-.75L4 11zm8 0l.75 1.75 1.75.75-1.75.75L12 16l-.75-1.75-1.75-.75 1.75-.75L12 11z" />
  </svg>
);

const UltimateIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size} shrink-0`} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-2a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" />
  </svg>
);

const PotionIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size} shrink-0`} viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 2h6v2H5V2zm1 4h4v8H6V6zm1 2v4h2V8H7z" />
  </svg>
);

const ShieldIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size} shrink-0`} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1.5s5 1.5 5 5c0 3-3 5.5-5 7-2-1.5-5-4-5-7 0-3.5 5-5 5-5z" />
  </svg>
);


const EventView: React.FC<{
  event: GameEvent;
  character: Character;
  playerStats: { health: number; maxHealth: number; aether: number; maxAether: number; resourceName: string; damage: number; armor: number; dodge: number; crit: number; intelligence: number; abilities: PlayerAbility[] };
  onComplete: (rewards: GameEvent['rewards'], isDefeat?: boolean) => void;
  equipment: Record<EquipmentSlot, Item | null>;
  unlockedSkills: Map<string, number>;
  inventory: Item[]; // New: for potion usage
  onConsumePotion: (itemId: string) => void; // New: callback to remove consumed potion
}> = ({ event, character, playerStats, onComplete, equipment, unlockedSkills, inventory, onConsumePotion }) => {
  const characterElement = ARCHETYPES.find(archetype => archetype.name === character.archetype)?.element;
  const [gameState, setGameState] = useState<GameState>('INTRO');
  const [actors, setActors] = useState<Actor[]>([]);
  const [playerResource, setPlayerResource] = useState(playerStats.aether);
  const [log, setLog] = useState<string[]>([]);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showAbilityMenu, setShowAbilityMenu] = useState(false);
  const [showUltimateMenu, setShowUltimateMenu] = useState(false);
  const [showItemMenu, setShowItemMenu] = useState(false); // New: potion/item menu
  const [previewItem, setPreviewItem] = useState<Item | null>(null); // New: item preview before use
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const [shakeClass, setShakeClass] = useState<string>('');

  const triggerShake = useCallback((intensity: 'sm' | 'md' | 'lg') => {
      setShakeClass(`shake-${intensity}`);
      setTimeout(() => setShakeClass(''), intensity === 'sm' ? 300 : intensity === 'md' ? 400 : 600);
  }, []);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const enemyRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const playerAtbBarRef = useRef<HTMLDivElement>(null);
  const resourceTheme = resourceThemes[playerStats.resourceName] || resourceThemes['Aether'];

  // Auto-scroll combat log to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);

  // Initialize combatants
  useEffect(() => {
    const archetype = ARCHETYPES.find(a => a.name === character.archetype);
    const playerSprite = archetype?.sprite || archetype?.icon || Icons.Start;
    const playerActor: Actor = {
      id: 'player', type: 'PLAYER', name: character.name, icon: playerSprite,
      hp: playerStats.health, maxHp: playerStats.maxHealth, atb: 0, 
      animationState: 'idle', statusEffects: [], isDefeated: false, ref: playerRef,
      ultimateCooldowns: {},
      enemyAbilityCooldowns: {},
      phaseIndex: 0,
    };
    const enemyActors: Actor[] = event.enemies.map((e, i) => {
      enemyRefs.current[i] = React.createRef<HTMLDivElement>();
      // Build initial cooldown map: all abilities start ready (cooldown = 0)
      const initCooldowns: Partial<Record<string, number>> = {};
      (e.abilities || []).forEach(ab => { initCooldowns[ab.id] = 0; });
      return {
        id: e.id, type: 'ENEMY', name: e.name, icon: e.icon,
        hp: e.stats.health, maxHp: e.stats.maxHealth, atb: Math.random() * 50, 
        animationState: 'idle', statusEffects: [], isDefeated: false, ref: enemyRefs.current[i],
        ultimateCooldowns: {},
        enemyAbilityCooldowns: initCooldowns,
        currentBehavior: e.behavior,
        phaseIndex: 0,
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
    
    const scatterX = (Math.random() - 0.5) * 60;
    const scatterY = (Math.random() - 0.5) * 30;
    const x = actorRect.left - containerRect.left + (actorRect.width / 2) - 20 + scatterX;
    const y = actorRect.top - containerRect.top + scatterY;
    
    const popupId = Date.now() + Math.random();
    setDamagePopups(p => [...p, { id: popupId, text, x, y, type }]);
    setTimeout(() => setDamagePopups(p => p.filter(popup => popup.id !== popupId)), 1200);
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
      let newAtb = actor.atb; // For ATB modifiers

      // --- Process Environment Effects ---
      if (event.environment) {
          const env = event.environment;
          for (const effect of env.effects) {
              let targetIsAffected = false;
              const actorElement = actor.type === 'PLAYER' ? characterElement : event.enemies.find(e => e.id === actor.id)?.element;

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
                          if (effect.status === 'petrified' || effect.status === 'frail') {
                              (newStatus as any).damageTakenIncrease = effect.value;
                              (newStatus as any).isPercentage = effect.isPercentage;
                          }
                          newStatusEffects.push(newStatus);
                          addLogMessage(`${actor.name} blir påverkad av ${env.name} och får status: ${effect.status}!`);
                          await sleep(200);
                      }
                  } else if (effect.type === 'stat_modifier' && effect.value && effect.element) {
                      // For simplicity, let's assume 'damage' stat_modifier means increased elemental damage taken
                      // This would typically be handled by a temporary status effect or direct stat modification
                      // For now, we'll just log it.
                      addLogMessage(`${actor.name} påverkas av ${env.name}: ${effect.description}`);
                      await sleep(200);
                  } else if (effect.type === 'atb_modifier' && effect.value && effect.statusChance && Math.random() * 100 < effect.statusChance) {
                      newAtb = Math.max(0, newAtb + effect.value); // value is negative for reduction
                      addLogMessage(`${actor.name}s ATB påverkas av ${env.name}!`);
                      await sleep(200);
                  }
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
          if (effect.type === 'petrified') { // New: Petrified status
              skipTurn = true;
              addLogMessage(`${actor.name} är förstenad och kan inte agera!`);
              addVisualEffect('petrified_vfx', actor.id, actor.id);
          }
          if (effect.type === 'frail') { // New: Frail status
              addVisualEffect('frail_vfx', actor.id, actor.id);
          }
          if (effect.type === 'frightened' && 'chanceToMissTurn' in effect && Math.random() * 100 < effect.chanceToMissTurn) { // New: Frightened status
              skipTurn = true;
              addLogMessage(`${actor.name} är förskräckt och kan inte agera!`);
              addVisualEffect('frightened_vfx', actor.id, actor.id);
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
                  case 'petrified': effectsAfterTurn.push({ type: 'petrified', duration: newDuration, damageTakenIncrease: effect.damageTakenIncrease }); break; // New
                  case 'frail': effectsAfterTurn.push({ type: 'frail', duration: newDuration, damageTakenIncrease: effect.damageTakenIncrease, isPercentage: effect.isPercentage }); break; // New
              }
          } else {
             if (effect.type === 'rooted') addLogMessage(`${actor.name} är inte längre rotad.`);
             if (effect.type === 'blinded') addLogMessage(`${actor.name} är inte längre bländad.`);
             if (effect.type === 'steamed') addLogMessage(`${actor.name} är inte längre ångad.`);
             if (effect.type === 'frozen') addLogMessage(`${actor.name} är inte längre frusen.`);
             if (effect.type === 'paralyzed') addLogMessage(`${actor.name} är inte längre förlamad.`);
             if (effect.type === 'stunned') addLogMessage(`${actor.name} är inte längre bedövad.`);
             if (effect.type === 'petrified') addLogMessage(`${actor.name} är inte längre förstenad.`); // New
             if (effect.type === 'frail') addLogMessage(`${actor.name} är inte längre förgänglig.`); // New
             if (effect.type === 'frightened') addLogMessage(`${actor.name} är inte längre förskräckt.`); // New
          }
      }
      
      // Decrement cooldowns for player ultimates; decrement enemy ability cooldowns
      if (actor.type === 'PLAYER') {
          const newCooldowns: Partial<Record<string, number>> = {};
          for (const ultId in actor.ultimateCooldowns) {
              const currentCd = actor.ultimateCooldowns[ultId] || 0;
              if (currentCd > 0) {
                  newCooldowns[ultId] = currentCd - 1;
              }
          }
          updateActorState(actorId, { hp, atb: newAtb, statusEffects: effectsAfterTurn, ultimateCooldowns: newCooldowns });
      } else {
          // Decrement each enemy ability cooldown
          const newAbilityCooldowns: Partial<Record<string, number>> = {};
          for (const abId in actor.enemyAbilityCooldowns) {
              const currentCd = actor.enemyAbilityCooldowns[abId] || 0;
              newAbilityCooldowns[abId] = Math.max(0, currentCd - 1);
          }
          updateActorState(actorId, { hp, atb: newAtb, statusEffects: effectsAfterTurn, enemyAbilityCooldowns: newAbilityCooldowns });
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
      const isPetrified = actor.statusEffects.some(e => e.type === 'petrified'); // New
      const isFrightened = actor.statusEffects.some(e => e.type === 'frightened' && 'chanceToMissTurn' in e && Math.random() * 100 < e.chanceToMissTurn); // New

      if (skipTurn || isRooted || isFrozen || isStunned || isParalyzed || isPetrified || isFrightened) {
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
         try {
             await handleEnemyAction(actor.id);
         } catch (err) {
             console.error("Combat action error:", err);
         } finally {
             setGameState(prev => (prev === 'VICTORY' || prev === 'DEFEAT') ? prev : 'ACTIVE');
         }
       }

  }, [actors, updateActorState, gameState, event.environment, character.archetype, playerStats.maxAether, characterElement, event.enemies]);

  // ATB Game Loop - now decoupled via hook (uses internal useRef + direct DOM updates)
  const { resetAtb } = useATBEngine({
    isActive: gameState === 'ACTIVE',
    actors,
    onTurnReady: (actorId: string) => {
      resetAtb(actorId);
      setGameState('EXECUTING');
      processTurn(actorId);
    },
    playerAtbBarRef,
  });

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
            case 'petrified': // New
                newStatus = { type: 'petrified', duration: effect.duration || 1, damageTakenIncrease: effect.value || 0 };
                break;
            case 'frail': // New
                newStatus = { type: 'frail', duration: effect.duration || 1, damageTakenIncrease: effect.value || 0, isPercentage: effect.isPercentage };
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
      let hettaConsumed = 0; // New variable for Hetta consumption
      if (attacker.type === 'PLAYER' && character.archetype === 'Pyromanten') {
        hettaBonus = Math.floor(playerResource / 10); // Calculate bonus based on current Hetta
        if (hettaBonus > 0) {
            hettaConsumed = hettaBonus * 10; // Consume Hetta that contributed to the bonus
            setPlayerResource(r => Math.max(0, r - hettaConsumed)); // Update player resource
        }
      }
      const totalBaseDamage = baseDamage + hettaBonus;

      if (!isSkill) soundEffects.slash(); // Aktiverad ljudeffekt
      updateActorState(attackerId, { animationState: 'attacking', atb: 0, statusEffects: attacker.statusEffects.filter(e => e.type !== 'defending') });
      resetAtb(attackerId);
      await sleep(300);

      const isBlinded = attacker.statusEffects.some(e => e.type === 'blinded');
      const dodgeRoll = Math.random() * 100;
      const isDodge = isBlinded ? dodgeRoll < 50 : dodgeRoll < (defender.type === 'PLAYER' ? playerStats.dodge : 0);

      if(isDodge) {
          soundEffects.miss(); // Aktiverad ljudeffekt
          addDamagePopup("MISS", defenderId, 'miss');
          addLogMessage(`${attacker.name} attackerade ${defender.name}, men missade!`);
          if (defender.type === 'PLAYER' && character.archetype === 'Skuggvävaren') {
              const skuggaFromMiss = 15;
              const newSkugga = Math.min(playerStats.maxAether, playerResource + skuggaFromMiss);
              setPlayerResource(newSkugga);
              addLogMessage(`Du bygger ${skuggaFromMiss} Skugga från fiendens miss.`);
              if (newSkugga >= playerStats.maxAether) {
                  addLogMessage("SKUGGMANTEL! Skuggorna sveper in dig!");
                  updateActorState(defenderId, {
                      statusEffects: [...defender.statusEffects.filter(e => e.type !== 'hasted'),
                          { type: 'hasted', duration: 3 }
                      ]
                  });
                  setPlayerResource(0);
              }
          }
      } else {
          soundEffects.hit(); // Aktiverad ljudeffekt
          if (isSkill) {
              if (damageElement === Element.FIRE) {
                  addVisualEffect('burning_spell_vfx', attackerId, defenderId);
              } else if (damageElement === Element.ICE || damageElement === Element.WATER) {
                  addVisualEffect('blizzard_storm_vfx', attackerId, defenderId);
              } else if (damageElement === Element.EARTH || damageElement === Element.MUD || damageElement === Element.SAND) {
                  addVisualEffect('flying_stones_vfx', attackerId, defenderId);
              } else {
                  addVisualEffect('fireball', attackerId, defenderId);
              }
          } else {
              addVisualEffect('slash', attackerId, defenderId);
          }
          
          const isCrit = !isSkill && Math.random() * 100 < (attacker.type === 'PLAYER' ? playerStats.crit : 10);
          let damage = isCrit ? totalBaseDamage * 1.5 : totalBaseDamage;
          
          const isBurning = defender.statusEffects.some(e => e.type === 'burning');
          if (attacker.type === 'PLAYER' && isBurning) {
              const combustionRank = unlockedSkills.get('combustion') || 0;
              if (combustionRank > 0) {
                  damage = Math.floor(damage * (1 + combustionRank * 0.05));
              }
          }
          
          // --- JUICE: HIT STOP & SHAKE ---
          if (isCrit) {
              triggerShake(attacker.type === 'PLAYER' ? 'md' : 'sm');
              await sleep(150);
          } else {
              if (damage >= 40) triggerShake('sm');
              await sleep(50);
          }

          let armor = defender.type === 'PLAYER' ? playerStats.armor : (event.enemies.find(e => e.id === defenderId)?.stats.armor || 0);
          
          // Apply Frail status effect
          const isFrail = defender.statusEffects.find(e => e.type === 'frail');
          if (isFrail && isFrail.type === 'frail' && isFrail.damageTakenIncrease) {
              if (isFrail.isPercentage) {
                  damage *= (1 + isFrail.damageTakenIncrease / 100);
              } else {
                  damage += isFrail.damageTakenIncrease;
              }
              addLogMessage(`${defender.name} är förgänglig och tar mer skada!`);
              addVisualEffect('frail_vfx', defender.id, defender.id);
          }

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
          let finalDamage = Math.floor(Math.max(1, (damage - armor) * resistanceMultiplier) * (isDefending ? 0.5 : 1));
          
          if (defender.type === 'PLAYER') {
              const graniteRank = unlockedSkills.get('granite_stance') || 0;
              if (graniteRank > 0) {
                  finalDamage = Math.max(1, finalDamage - (graniteRank * 3));
              }
          }
          
          if (finalDamage >= defender.maxHp * 0.3) {
              popupType = 'fatal';
              addVisualEffect('blood_spatter', defender.id, defender.id);
          }

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
                case 'APPLY_STATUS': {
                    const applyEffect = effect as EnemyApplyStatusEffect;
                    const newStatus: StatusEffect = { type: applyEffect.status, duration: applyEffect.duration || 1 } as StatusEffect;
                    if (applyEffect.status === 'burning' || applyEffect.status === 'poisoned' || applyEffect.status === 'retaliating' || applyEffect.status === 'steamed' || applyEffect.status === 'bleeding') {
                        (newStatus as any).damage = applyEffect.damage;
                    }
                    if (applyEffect.status === 'regenerating') {
                        (newStatus as any).heal = applyEffect.value;
                    }
                    if (applyEffect.status === 'paralyzed' || applyEffect.status === 'frightened') {
                        (newStatus as any).chanceToMissTurn = applyEffect.value;
                    }
                    if (applyEffect.status === 'petrified' || applyEffect.status === 'frail') {
                        (newStatus as any).damageTakenIncrease = applyEffect.value;
                        (newStatus as any).isPercentage = applyEffect.isPercentage;
                    }
                    statusToAdd = newStatus;
                    existingEffects = existingEffects.filter(e => e.type !== applyEffect.status);
                    logMsg = `${defender.name} får status: ${applyEffect.status}!`;
                    break;
                }
              }
          
              if (statusToAdd) {
                  defenderUpdates.statusEffects = [...existingEffects, statusToAdd];
                  addLogMessage(logMsg);
              }
          }
          
          if (skillEffect) skillEffect();
          
          addDamagePopup(finalDamage.toString(), defenderId, popupType); // Use dynamic popupType
          const hettaLog = hettaBonus > 0 ? ` (+${hettaBonus} från Hetta, -${hettaConsumed} Hetta)` : ""; // Update log message
          addLogMessage(`${attacker.name} skadade ${defender.name} för ${finalDamage} HP${hettaLog}.`);
          
           // Must apply damage before checking affixes, so they have the latest HP
           defender = { ...defender, hp: newHp };
           updateActorState(defenderId, { ...defenderUpdates, hp: newHp });

           // --- BOSS PHASE TRANSITION ---
           if (defender.type === 'ENEMY' && enemyData) {
               const phaseResult = evaluateBossPhase(enemyData, newHp, defender.phaseIndex);
               if (phaseResult) {
                   const { phase, nextPhaseIndex } = phaseResult;
                   addLogMessage(`${defender.name} går in i en ny fas: ${phase.name}!`);

                   const currentStatuses = defenderUpdates.statusEffects || defender.statusEffects;
                   const newStatuses = [...currentStatuses, ...(phase.statusEffectsToApplyToSelf || [])];
                   const newBehavior = phase.newBehavior || defender.currentBehavior;

                   updateActorState(defenderId, {
                       phaseIndex: nextPhaseIndex,
                       currentBehavior: newBehavior,
                       statusEffects: newStatuses,
                   });

                   // HÅLL lokal variabel synkad så affix-loopen nedan ser nya statusar
                   // (annars kan ON_HIT-affix skriva över fasens statusar, t.ex. hasted(99))
                   defender = {
                       ...defender,
                       phaseIndex: nextPhaseIndex,
                       currentBehavior: newBehavior,
                       statusEffects: newStatuses,
                   };
               }
           }

           // --- AFFIX PROCESSING ---
          if (attacker.type === 'PLAYER') {
            // FIX: Explicitly type the array from Object.values to prevent 'unknown' type errors.
            for (const item of Object.values(equipment) as (Item | null)[]) {
                if (item?.affix?.trigger === 'ON_HIT') {
                    await applyAffix(item.affix, attacker, defender);
                    defender = actors.find(a => a.id === defenderId)!; // Refresh defender state after affix
                    if (defender.isDefeated) break;
                }
            }
          } else { // Enemy is attacker
            // FIX: Explicitly type the array from Object.values to prevent 'unknown' type errors.
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
  }, [actors, addDamagePopup, addLogMessage, addVisualEffect, character.archetype, event.enemies, equipment, playerResource, playerStats.armor, playerStats.crit, playerStats.dodge, playerStats.maxAether, setPlayerResource, updateActorState, triggerShake, unlockedSkills]);

  const handlePlayerAction = async (action: 'ATTACK' | 'SKILL' | 'DEFEND' | 'ULTIMATE', abilityId?: string) => {
      setShowCommandMenu(false);
      setShowAbilityMenu(false);
      setShowUltimateMenu(false); // Close ultimate menu
      setGameState('EXECUTING');
      let player = actors.find(a => a.type === 'PLAYER');
      if (!player) return;

      try {
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
            // Pyromancer skills generate Hetta, so they don't have a cost to check for affordability.
            // The 'effectiveCost' for Pyromancer is 0 for the canAfford check.
            // Hetta generation and overheating is handled below.
            if (player.statusEffects.some(e => e.type === 'overheated')) {
                addLogMessage("Du är överhettad och kan inte generera Hetta!");
                // No Hetta gain if overheated
            } else {
                const hettaGained = rankData ? rankData.resourceCost : 0; // This is the Hetta generated by the skill
                const newHetta = playerResource + hettaGained;
                if (newHetta >= playerStats.maxAether) {
                    addLogMessage("ÖVERHETTAD! Hetta exploderar och skadar dig!");
                    const selfDamage = Math.floor(playerStats.maxHealth * 0.2);
                    updateActorState(player.id, { 
                        hp: Math.max(0, player.hp - selfDamage),
                        statusEffects: [...player.statusEffects, { type: 'overheated', duration: 2 }]
                    });
                    addDamagePopup(selfDamage.toString(), player.id, 'status_damage');
                    setPlayerResource(0); // Reset Hetta after explosion
                } else {
                    setPlayerResource(newHetta);
                    addLogMessage(`Du bygger ${hettaGained} Hetta.`);
                }
            }
            break;
        case 'Ljusbringaren':
            if (rankData && rankData.resourceCost === 0) {
                // Healing/buff skills generate Nåd
                const nadGained = 10 + (rankData.healMultiplier ? Math.floor(rankData.healMultiplier * 30) : (rankData.duration ? rankData.duration * 5 : 0));
                const newNad = playerResource + nadGained;
                if (newNad >= playerStats.maxAether) {
                    addLogMessage("VÄLSIGNELSE! Nådens kraft omsluter dig!");
                    updateActorState(player.id, {
                        statusEffects: [...player.statusEffects.filter(e => e.type !== 'hasted' && e.type !== 'regenerating'),
                            { type: 'hasted', duration: 3 },
                            { type: 'regenerating', duration: 3, heal: Math.floor(playerStats.maxHealth * 0.05) }
                        ]
                    });
                    setPlayerResource(0);
                } else {
                    setPlayerResource(newNad);
                    addLogMessage(`Du bygger ${nadGained} Nåd.`);
                }
            } else if (playerResource < effectiveCost) {
                canAfford = false;
            } else {
                setPlayerResource(r => r - effectiveCost);
            }
            break;
        case 'Skuggvävaren':
            if (rankData && rankData.resourceCost === 0) {
                // Damage skills generate Skugga
                const skuggaGained = 10 + (rankData.damageMultiplier ? Math.floor(rankData.damageMultiplier * 10) : 0);
                const newSkugga = playerResource + skuggaGained;
                if (newSkugga >= playerStats.maxAether) {
                    addLogMessage("SKUGGMANTEL! Skuggorna sveper in dig!");
                    updateActorState(player.id, {
                        statusEffects: [...player.statusEffects.filter(e => e.type !== 'hasted'),
                            { type: 'hasted', duration: 3 }
                        ]
                    });
                    setPlayerResource(0);
                } else {
                    setPlayerResource(newSkugga);
                    addLogMessage(`Du bygger ${skuggaGained} Skugga.`);
                }
            } else if (playerResource < effectiveCost) {
                canAfford = false;
            } else {
                setPlayerResource(r => r - effectiveCost);
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
          resetAtb(player.id);
          addLogMessage("Du intar en defensiv position.");
          await sleep(500);
      } else if (action === 'ATTACK') {
          if(target) await performAttack(player.id, target.id, playerStats.damage, Element.NEUTRAL);
      } else if (action === 'SKILL' && abilityInfo && rankData) {
          addLogMessage(`Du använder ${abilityInfo.name}!`);
          
          const baseSkillDamage = playerStats.damage * 0.5 + playerStats.intelligence * 1.5;

          // --- SKILL LOGIC ---
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
                 resetAtb(player.id);
                 await sleep(500);
              }
              break;
            case 'water_1': // Läka
              if (rankData.healMultiplier) {
                let healAmount = Math.floor(player.maxHp * rankData.healMultiplier + playerStats.intelligence);
                const pureFlowRank = unlockedSkills.get('pure_flow') || 0;
                if (pureFlowRank > 0) healAmount = Math.floor(healAmount * (1 + pureFlowRank * 0.05));
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
            case 'growth': { // Tillväxt
              const healPerTurn = Math.floor(playerStats.intelligence * 0.5 + 5);
              updateActorState(player.id, { atb: 0, statusEffects: [...player.statusEffects.filter(e => e.type !== 'regenerating'), {type: 'regenerating', duration: 4, heal: healPerTurn}] });
              addLogMessage(`Du känner en läkande kraft från jorden.`);
              await sleep(500);
              break;
            }
            case 'mud': // Lerfälla
              if(target) await performAttack(player.id, target.id, playerStats.damage * 0.25, abilityInfo.element, true, () => {
                 const newEffects: StatusEffect[] = [...target.statusEffects.filter(e => e.type !== 'slowed' && e.type !== 'rooted'), { type: 'slowed', duration: 3 }];
                 let log = `${target.name} fastnar i leran och saktas ner!`;
                 if (Math.random() < 0.25) { // 25% chance to root
                    newEffects.push({ type: 'rooted', duration: 2 });
                    log = `${target.name} sitter fast i leran!`
                 }
                 updateActorState(target.id, { statusEffects: newEffects });
                 addLogMessage(log);
              });
              break;
             case 'magma': { // Magma Armor
              const retaliateDamage = Math.floor(playerStats.intelligence * 0.8);
              updateActorState(player.id, { atb: 0, statusEffects: [
                  ...player.statusEffects.filter(e => e.type !== 'retaliating'),
                  { type: 'retaliating', duration: 4, damage: retaliateDamage },
                  { type: 'defending', duration: 4 }
              ]});
              addLogMessage(`Du omger dig med Magma Armor!`);
              await sleep(500);
              break;
             }
             case 'sand': { // Sandstorm
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
                  
                  updateActorState(enemy.id, { hp: newHp, statusEffects: enemy.statusEffects, animationState: 'hit' });
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
             }
             // --- LIGHT ABILITIES ---
             case 'light_1': // Helande Ljus
               if (rankData && rankData.healMultiplier) {
                 let healAmount = Math.floor(player.maxHp * rankData.healMultiplier + playerStats.intelligence);
                 addVisualEffect('heal', player.id, player.id);
                 await sleep(300);
                 const newHp = Math.min(player.maxHp, player.hp + healAmount);
                 updateActorState(player.id, { hp: newHp, atb: 0 });
                 addDamagePopup(`+${healAmount}`, player.id, 'heal');
                 addLogMessage(`Du läker dig själv för ${healAmount} HP.`);
                 await sleep(500);
               }
               break;
             case 'light_2': // Ljusstråle
               if (target && rankData && rankData.damageMultiplier) {
                 await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, Element.LIGHT, true);
               }
               break;
             case 'light_3': // Välsignelse
               if (rankData && rankData.duration) {
                 updateActorState(player.id, {
                   atb: 0,
                   statusEffects: [
                     ...player.statusEffects.filter(e => e.type !== 'hasted' && e.type !== 'regenerating'),
                     { type: 'hasted', duration: rankData.duration },
                   ]
                 });
                 addLogMessage(`Du välsignas av ljuset i ${rankData.duration} rundor!`);
                 await sleep(500);
               }
               break;
             case 'light_4': // Rening
               if (rankData && rankData.healMultiplier) {
                 let healAmount = Math.floor(player.maxHp * rankData.healMultiplier + playerStats.intelligence * 0.5);
                 addVisualEffect('heal', player.id, player.id);
                 await sleep(300);
                 const newHp = Math.min(player.maxHp, player.hp + healAmount);
                 updateActorState(player.id, {
                   hp: newHp,
                   atb: 0,
                   statusEffects: player.statusEffects.filter(e =>
                     e.type !== 'burning' && e.type !== 'poisoned' && e.type !== 'bleeding' &&
                     e.type !== 'slowed' && e.type !== 'blinded' && e.type !== 'rooted' &&
                     e.type !== 'paralyzed' && e.type !== 'frightened' && e.type !== 'frail' &&
                     e.type !== 'steamed'
                   )
                 });
                 addDamagePopup(`+${healAmount}`, player.id, 'heal');
                 addLogMessage(`Du renas och läker för ${healAmount} HP.`);
                 await sleep(500);
               }
               break;
             case 'light_5': // Helig Glöd
               if (target && rankData && rankData.damageMultiplier && rankData.dotDamage && rankData.duration) {
                 await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, Element.LIGHT, true, () => {
                   const holyBurnDamage = Math.floor(rankData.dotDamage! + playerStats.intelligence * 0.2);
                   updateActorState(target.id, {
                     statusEffects: [...target.statusEffects.filter(e => e.type !== 'burning'),
                       { type: 'burning', duration: rankData.duration!, damage: holyBurnDamage }
                     ]
                   });
                   addLogMessage(`${target.name} brinner av heligt ljus!`);
                 });
               }
               break;
             case 'light_6': // Skyddsmantel
               if (rankData && rankData.duration) {
                 const existingDamageReduction = player.statusEffects.find(e => e.type === 'damage_reduction');
                 const reductionValue = (existingDamageReduction?.value || 0) + 10;
                 updateActorState(player.id, {
                   atb: 0,
                   statusEffects: [
                     ...player.statusEffects.filter(e => e.type !== 'damage_reduction' && e.type !== 'defending'),
                     { type: 'damage_reduction', duration: rankData.duration, value: reductionValue, isPercentage: true },
                   ]
                 });
                 addLogMessage(`En ljusmantel omsluter dig i ${rankData.duration} rundor!`);
                 await sleep(500);
               }
               break;
             case 'light_7': // Uppenbarelse
               {
                 const livingEnemies = actors.filter(a => a.type === 'ENEMY' && !a.isDefeated);
                 if (rankData && rankData.damageMultiplier) {
                   updateActorState(player.id, { animationState: 'casting', atb: 0 });
                   for (const enemy of livingEnemies) {
                     const enemyData = event.enemies.find(e => e.id === enemy.id);
                     const resistance = enemyData?.resistances ? (enemyData.resistances[Element.LIGHT] || 0) : 0;
                     const resistanceMultiplier = 1 - (resistance / 100);
                     const enemyArmor = enemyData?.stats.armor || 0;
                     const damage = Math.floor(Math.max(1, (baseSkillDamage * rankData.damageMultiplier - enemyArmor) * resistanceMultiplier));
                     const newHp = Math.max(0, enemy.hp - damage);
                     updateActorState(enemy.id, { hp: newHp, animationState: 'hit' });
                     addDamagePopup(damage.toString(), enemy.id, 'damage');
                     addLogMessage(`${enemy.name} tar ${damage} skada från Uppenbarelse!`);
                     if (newHp <= 0) {
                       updateActorState(enemy.id, { isDefeated: true });
                     }
                   }
                   if (rankData.healMultiplier) {
                     const healAmount = Math.floor(player.maxHp * rankData.healMultiplier + playerStats.intelligence);
                     const newHp = Math.min(player.maxHp, player.hp + healAmount);
                     updateActorState(player.id, { hp: newHp });
                     addDamagePopup(`+${healAmount}`, player.id, 'heal');
                     addLogMessage(`Du läker för ${healAmount} HP av ljusets kraft!`);
                   }
                   await sleep(500);
                   livingEnemies.forEach(e => updateActorState(e.id, { animationState: 'idle' }));
                   updateActorState(player.id, { animationState: 'idle' });
                 }
               }
               break;
             // --- DARK ABILITIES ---
             case 'dark_1': // Skuggkast
               if (target && rankData && rankData.damageMultiplier) {
                 await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, Element.DARK, true);
               }
               break;
             case 'dark_2': // Skuggsteg
               if (rankData && rankData.duration) {
                 addVisualEffect('haste', player.id, player.id);
                 updateActorState(player.id, {
                   atb: 0,
                   statusEffects: [
                     ...player.statusEffects.filter(e => e.type !== 'hasted'),
                     { type: 'hasted', duration: rankData.duration }
                   ]
                 });
                 addLogMessage(`Du glider in i skuggorna i ${rankData.duration} rundor!`);
                 await sleep(500);
               }
               break;
             case 'dark_3': // Förtvivlan
               if (target && rankData && rankData.duration) {
                 const newStatus: StatusEffect = {
                   type: 'frail',
                   duration: rankData.duration,
                   damageTakenIncrease: 20 + (rankData.duration * 5),
                   isPercentage: true
                 };
                 updateActorState(target.id, {
                   statusEffects: [...target.statusEffects.filter(e => e.type !== 'frail'), newStatus]
                 });
                 addLogMessage(`${target.name} fylls av förtvivlan i ${rankData.duration} rundor!`);
                 addVisualEffect('frightened_vfx', player.id, target.id);
                 updateActorState(player.id, { atb: 0 });
                 await sleep(500);
               }
               break;
             case 'dark_4': // Mörker
               if (target && rankData) {
                 const morkerDamage = playerStats.damage * 0.3 + playerStats.intelligence * 0.5;
                 await performAttack(player.id, target.id, morkerDamage, Element.DARK, true, () => {
                   const blindDuration = rankData.duration || 2;
                   updateActorState(target.id, {
                     statusEffects: [
                       ...target.statusEffects.filter(e => e.type !== 'blinded' && e.type !== 'slowed'),
                       { type: 'blinded', duration: blindDuration },
                       { type: 'slowed', duration: blindDuration }
                     ]
                   });
                   addLogMessage(`${target.name} omsluts av mörker!`);
                 });
               }
               break;
             case 'dark_5': // Själssug
               if (target && rankData && rankData.damageMultiplier) {
                 await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, Element.DARK, true, () => {
                   if (rankData.healMultiplier) {
                     const lifestealAmount = Math.floor(player.maxHp * rankData.healMultiplier);
                     const newHp = Math.min(player.maxHp, player.hp + lifestealAmount);
                     updateActorState(player.id, { hp: newHp });
                     addDamagePopup(`+${lifestealAmount}`, player.id, 'heal');
                     addLogMessage(`Du suger liv från ${target.name} och läker ${lifestealAmount} HP!`);
                   }
                 });
               }
               break;
             case 'dark_6': // Nattslända
               {
                 const livingEnemies = actors.filter(a => a.type === 'ENEMY' && !a.isDefeated);
                 if (rankData && rankData.damageMultiplier) {
                   updateActorState(player.id, { animationState: 'casting', atb: 0 });
                   for (const enemy of livingEnemies) {
                     const enemyData = event.enemies.find(e => e.id === enemy.id);
                     const resistance = enemyData?.resistances ? (enemyData.resistances[Element.DARK] || 0) : 0;
                     const resistanceMultiplier = 1 - (resistance / 100);
                     const enemyArmor = enemyData?.stats.armor || 0;
                     const damage = Math.floor(Math.max(1, (baseSkillDamage * rankData.damageMultiplier - enemyArmor) * resistanceMultiplier));
                     const newHp = Math.max(0, enemy.hp - damage);
                     updateActorState(enemy.id, { hp: newHp, animationState: 'hit' });
                     addDamagePopup(damage.toString(), enemy.id, 'damage');
                     addLogMessage(`${enemy.name} skadas av nattsländan!`);
                     if (newHp <= 0) {
                       updateActorState(enemy.id, { isDefeated: true });
                     }
                   }
                   await sleep(500);
                   livingEnemies.forEach(e => updateActorState(e.id, { animationState: 'idle' }));
                   updateActorState(player.id, { animationState: 'idle' });
                 }
               }
               break;
             case 'dark_7': // Skuggornas Famn
               if (target && rankData && rankData.damageMultiplier) {
                 await performAttack(player.id, target.id, baseSkillDamage * rankData.damageMultiplier, Element.DARK, true, () => {
                   const frightenedStatus: StatusEffect = {
                     type: 'frightened',
                     duration: 2,
                     chanceToMissTurn: 50,
                     chanceToAttackRandom: 50,
                   };
                   updateActorState(target.id, {
                     statusEffects: [...target.statusEffects.filter(e => e.type !== 'frightened'), frightenedStatus]
                   });
                   addLogMessage(`${target.name} grips av skräck!`);
                 });
               }
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
               setPlayerResource(r => {
                   const updatedFlode = r + FLODE_PER_HEAL_CC;
                   if (updatedFlode >= playerStats.maxAether) {
                       updateActorState(player.id, { statusEffects: [...player.statusEffects.filter(e => e.type !== 'full_flow'), {type: 'full_flow', duration: 99}] });
                       addLogMessage("Fullt Flöde uppnått! Nästa förmåga är förstärkt!");
                   }
                   return Math.min(playerStats.maxAether, updatedFlode);
               });
             }
           } else if (character.archetype === 'Stenväktaren' && abilityInfo.id === 'earth_1') {
             const styrkaGained = 12 + rank * 3;
             setPlayerResource(r => Math.min(playerStats.maxAether, r + styrkaGained));
             addLogMessage(`Du bygger ${styrkaGained} Styrka.`);
           } else if (character.archetype === 'Stormdansaren' && abilityInfo.id === 'wind_1') {
             const energiGained = 15 + rank * 3;
             setPlayerResource(r => Math.min(playerStats.maxAether, r + energiGained));
             addLogMessage(`Du bygger ${energiGained} Energi.`);
           }
      } else if (action === 'ULTIMATE' && ultimateInfo) {
          if (player.ultimateCooldowns[ultimateInfo.id] && player.ultimateCooldowns[ultimateInfo.id] > 0) {
              addLogMessage(`${ultimateInfo.name} är på nedkylning (${player.ultimateCooldowns[ultimateInfo.id]} rundor kvar)!`);
              setGameState('PLAYER_TURN'); // Return to player turn if ultimate is on cooldown
              setShowUltimateMenu(true);
              return;
          }

          addLogMessage(`Du använder din ultimata förmåga: ${ultimateInfo.name}!`);
          triggerShake('lg');
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
                              case 'petrified': // New
                                  newStatus = { type: 'petrified', duration: ultimateInfo.effect.duration, damageTakenIncrease: ultimateInfo.effect.value || 0 };
                                  break;
                              case 'frail': // New
                                  newStatus = { type: 'frail', duration: ultimateInfo.effect.duration, damageTakenIncrease: ultimateInfo.effect.value || 0, isPercentage: ultimateInfo.effect.isPercentage };
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
                          const pureFlowRank = unlockedSkills.get('pure_flow') || 0;
                          if (pureFlowRank > 0) healAmount = Math.floor(healAmount * (1 + pureFlowRank * 0.05));
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
      } catch (err) {
          console.error("Player attack error:", err);
          setGameState('ACTIVE'); // lås upp om det kraschar
      } finally {
          setGameState(prev => (prev === 'VICTORY' || prev === 'DEFEAT') ? prev : 'ACTIVE');
      }
  };

  // --- Potion / Item Usage ---
  const handleUsePotion = async (item: Item) => {
      if (!item.consumableEffect) return;
      setShowItemMenu(false);
      setShowCommandMenu(false);
      setGameState('EXECUTING');

      const player = actors.find(a => a.type === 'PLAYER');
      if (!player) return;

      const effect = item.consumableEffect;
      addLogMessage(`Du använder ${item.name}!`);
      addVisualEffect('heal', player.id, player.id);
      await sleep(300);

      if (effect.type === 'HEAL') {
          const newHp = Math.min(player.maxHp, player.hp + effect.value);
          updateActorState(player.id, { hp: newHp, atb: 0 });
          addDamagePopup(`+${effect.value}`, player.id, 'heal');
          addLogMessage(`Du återställer ${effect.value} HP.`);
      } else if (effect.type === 'AETHER') {
          setPlayerResource(r => Math.min(playerStats.maxAether, r + effect.value));
          addLogMessage(`Du återställer ${effect.value} ${playerStats.resourceName}.`);
          updateActorState(player.id, { atb: 0 });
      } else if (effect.type === 'BUFF') {
          let newStatus: StatusEffect | undefined;
          switch (effect.status) {
              case 'hasted':      newStatus = { type: 'hasted', duration: effect.duration }; break;
              case 'defending':   newStatus = { type: 'defending', duration: effect.duration }; break;
              case 'regenerating': newStatus = { type: 'regenerating', duration: effect.duration, heal: effect.value || 5 }; break;
              case 'damage_reduction': newStatus = { type: 'damage_reduction', duration: effect.duration, value: effect.value || 0, isPercentage: true }; break;
              default: break;
          }
          if (newStatus) {
              const filtered = player.statusEffects.filter(s => s.type !== effect.status);
              updateActorState(player.id, { statusEffects: [...filtered, newStatus], atb: 0 });
              addLogMessage(`Du får ${effect.description}`);
          }
      }

      // Consume the potion from inventory
      onConsumePotion(item.id);
      await sleep(500);

      if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
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

      // Check if enemy is frightened
      const isFrightened = enemyActor.statusEffects.find(e => e.type === 'frightened');
      if (isFrightened && isFrightened.type === 'frightened' && Math.random() * 100 < isFrightened.chanceToMissTurn) {
          addLogMessage(`${enemyData.name} är förskräckt och kan inte agera!`);
          updateActorState(enemyId, { atb: 0 });
          await sleep(500);
          if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
             setGameState('ACTIVE');
          }
          return;
      }
      if (isFrightened && isFrightened.type === 'frightened' && Math.random() * 100 < isFrightened.chanceToAttackRandom) {
          const randomTarget = actors.filter(a => a.id !== enemyId && !a.isDefeated)[Math.floor(Math.random() * (actors.filter(a => a.id !== enemyId && !a.isDefeated).length))];
          if (randomTarget) {
              addLogMessage(`${enemyData.name} är förskräckt och attackerar slumpmässigt ${randomTarget.name}!`);
              await performAttack(enemyId, randomTarget.id, enemyData?.stats.damage || 5, enemyData.element);
          } else {
              addLogMessage(`${enemyData.name} är förskräckt men hittar inget att attackera!`);
          }
          updateActorState(enemyId, { atb: 0 });
          await sleep(500);
          if (gameState as GameState !== 'VICTORY' && gameState as GameState !== 'DEFEAT') {
             setGameState('ACTIVE');
          }
          return;
      }


      // --- BEHAVIOR-DRIVEN DISPATCH (Steg 4) ---
      const behavior = enemyActor.currentBehavior ?? enemyData.behavior;
      const resolution = resolveBehaviorTarget(
          behavior ?? 'ATTACK_PLAYER',
          player,
          enemyActor
      );
      void resolution;

      if (behavior === 'BUFF_SELF' || behavior === 'BUFF_ALLIES') {
          // Self-buff: defensive stance, skip attack
          const hasDefending = enemyActor.statusEffects.some(e => e.type === 'defending');
          if (!hasDefending) {
              updateActorState(enemyId, {
                  atb: 0,
                  statusEffects: [
                      ...enemyActor.statusEffects.filter(e => e.type !== 'defending'),
                      { type: 'defending', duration: 2 }
                  ]
              });
          } else {
              updateActorState(enemyId, { atb: 0 });
          }
          addLogMessage(`${enemyData.name} stärker sitt försvar!`);
          addVisualEffect('haste', enemyId, enemyId);
          await sleep(500);
      } else if (!behavior && enemyData.specialAbility === 'HASTE_SELF' && Math.random() < 0.4) {
          // Legacy fallback: endast för fiender utan behavior
          const existingEffects = enemyActor.statusEffects.filter(e => e.type !== 'hasted');
          const newEffects: StatusEffect[] = [...existingEffects, { type: 'hasted', duration: 4 }];
          updateActorState(enemyId, { atb: 0, statusEffects: newEffects });
          addVisualEffect('haste', enemyId, enemyId);
          addLogMessage(`${enemyData.name} använder vindhastighet!`);
          await sleep(500);
      } else {
          // --- Existing ability loop (lämnas orörd) ---
          const readyAbilities: EnemyAbility[] = (enemyData.abilities || []).filter(ab => {
              const cd = enemyActor.enemyAbilityCooldowns[ab.id] || 0;
              return cd <= 0;
          });

          let usedAbility = false;
          if (readyAbilities.length > 0 && Math.random() < 0.55) { // 55% chance to use an ability when one is available
              const chosenAbility = readyAbilities[Math.floor(Math.random() * readyAbilities.length)];
              addLogMessage(`${enemyData.name} använder ${chosenAbility.name}!`);
              updateActorState(enemyId, { animationState: 'casting' });
              await sleep(400);

              if (chosenAbility.category === 'damage' && chosenAbility.damageMultiplier) {
                  const abilityDamage = (enemyData.stats.damage || 5) * chosenAbility.damageMultiplier;
                  await performAttack(enemyId, player.id, abilityDamage, chosenAbility.element, true, () => {
                      if (chosenAbility.statusEffectsToApply && chosenAbility.duration) {
                          const newEffects: StatusEffect[] = [];
                          for (const statusType of chosenAbility.statusEffectsToApply) {
                              let newStatus: StatusEffect | undefined;
                              switch (statusType) {
                                  case 'burning':   newStatus = { type: 'burning', duration: chosenAbility.duration, damage: chosenAbility.value || 5 }; break;
                                  case 'stunned':   newStatus = { type: 'stunned', duration: chosenAbility.duration }; break;
                                  case 'slowed':    newStatus = { type: 'slowed', duration: chosenAbility.duration }; break;
                                  case 'rooted':    newStatus = { type: 'rooted', duration: chosenAbility.duration }; break;
                                  case 'poisoned':  newStatus = { type: 'poisoned', duration: chosenAbility.duration, damage: chosenAbility.value || 5 }; break;
                                  case 'blinded':   newStatus = { type: 'blinded', duration: chosenAbility.duration }; break;
                                  case 'paralyzed': newStatus = { type: 'paralyzed', duration: chosenAbility.duration, chanceToMissTurn: chosenAbility.value || 30 }; break;
                                  case 'frightened': newStatus = { type: 'frightened', duration: chosenAbility.duration, chanceToMissTurn: chosenAbility.value || 25, chanceToAttackRandom: chosenAbility.value || 25 }; break;
                              }
                              if (newStatus) {
                                  newEffects.push(newStatus);
                                  addLogMessage(`${player!.name} får status: ${statusType}!`);
                              }
                          }
                          if (newEffects.length > 0) {
                              const filteredEffects = player!.statusEffects.filter(
                                  s => !chosenAbility.statusEffectsToApply!.includes(s.type as any)
                              );
                              updateActorState(player!.id, { statusEffects: [...filteredEffects, ...newEffects] });
                          }
                      }
                  });
              } else if (chosenAbility.category === 'heal' && chosenAbility.healMultiplier) {
                  // Heal self
                  const healAmount = Math.floor(enemyActor.maxHp * chosenAbility.healMultiplier);
                  const newHp = Math.min(enemyActor.maxHp, enemyActor.hp + healAmount);
                  updateActorState(enemyId, { hp: newHp });
                  addDamagePopup(`+${healAmount}`, enemyId, 'heal');
                  addLogMessage(`${enemyData.name} läker sig själv för ${healAmount} HP!`);
                  await sleep(500);
              } else if (chosenAbility.category === 'buff' && chosenAbility.statusEffectsToApply) {
                  // Buff self
                  const newBuffs: StatusEffect[] = [];
                  for (const statusType of chosenAbility.statusEffectsToApply) {
                      let newStatus: StatusEffect | undefined;
                      switch (statusType) {
                          case 'defending': newStatus = { type: 'defending', duration: chosenAbility.duration || 2, value: chosenAbility.value }; break;
                          case 'hasted':    newStatus = { type: 'hasted', duration: chosenAbility.duration || 2 }; break;
                          case 'regenerating': newStatus = { type: 'regenerating', duration: chosenAbility.duration || 2, heal: chosenAbility.value || 5 }; break;
                      }
                      if (newStatus) newBuffs.push(newStatus);
                  }
                  if (newBuffs.length > 0) {
                      const filtered = enemyActor.statusEffects.filter(
                          s => !chosenAbility.statusEffectsToApply!.includes(s.type as any)
                      );
                      updateActorState(enemyId, { statusEffects: [...filtered, ...newBuffs] });
                      addLogMessage(`${enemyData.name} stärker sig!`);
                      addVisualEffect('haste', enemyId, enemyId);
                      await sleep(500);
                  }
              } else if (chosenAbility.category === 'cc' && chosenAbility.damageMultiplier) {
                  // CC attack
                  const ccDamage = (enemyData.stats.damage || 5) * chosenAbility.damageMultiplier;
                  await performAttack(enemyId, player.id, ccDamage, chosenAbility.element, true, () => {
                      if (chosenAbility.statusEffectsToApply && chosenAbility.duration) {
                          const ccEffects: StatusEffect[] = [];
                          for (const statusType of chosenAbility.statusEffectsToApply) {
                              let newStatus: StatusEffect | undefined;
                              switch (statusType) {
                                  case 'slowed':  newStatus = { type: 'slowed', duration: chosenAbility.duration }; break;
                                  case 'rooted':  newStatus = { type: 'rooted', duration: chosenAbility.duration }; break;
                                  case 'stunned': newStatus = { type: 'stunned', duration: chosenAbility.duration }; break;
                              }
                              if (newStatus) ccEffects.push(newStatus);
                          }
                          if (ccEffects.length > 0) {
                              const filtered = player!.statusEffects.filter(
                                  s => !chosenAbility.statusEffectsToApply!.includes(s.type as any)
                              );
                              updateActorState(player!.id, { statusEffects: [...filtered, ...ccEffects] });
                          }
                      }
                  });
              }

              // Put chosen ability on cooldown
              const updatedCooldowns = {
                  ...enemyActor.enemyAbilityCooldowns,
                  [chosenAbility.id]: chosenAbility.cooldown,
              };
              updateActorState(enemyId, { atb: 0, animationState: 'idle', enemyAbilityCooldowns: updatedCooldowns });
              usedAbility = true;
          }

          if (!usedAbility) {
              await performAttack(enemyId, player.id, enemyData?.stats.damage || 5, enemyData.element);
          }
      }
      
      // Check for retaliation damage
      player = actors.find(a => a.type === 'PLAYER'); // Re-fetch player state
      if (player && !player.isDefeated) {
          const retaliateEffect = player.statusEffects.find(e => e.type === 'retaliating');
          const currentAttacker = actors.find(a => a.id === enemyId);
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
      Element.LIGHT, Element.DARK,
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
        'petrified': { icon: Icons.Petrified, title: "Petrified" }, // New
        'frail': { icon: Icons.Frail, title: "Frail" }, // New
        'frightened': { icon: Icons.Frightened, title: "Frightened" }, // New
    };


    return (
       <div 
          ref={actor.ref} 
          className={`relative flex flex-col items-center ${animationClass}`}
          onAnimationEnd={() => { if(actor.isDefeated) onDefeatAnimationEnd(actor.id) }}
        >
          {isSelected && <div className="absolute -top-4 text-yellow-400 text-2xl">▼</div>}
          
          <div className="relative transform scale-[1.75] sm:scale-[2.5] md:scale-[3] landscape:scale-[1.8] w-12 h-12 flex items-center justify-center">
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
                {actor.statusEffects.some(e => e.type === 'petrified') && <div className="vfx-petrified-overlay" />} {/* New VFX for petrified */}
                {actor.statusEffects.some(e => e.type === 'frail') && <div className="vfx-frail-overlay" />} {/* New VFX for frail */}
                {actor.statusEffects.some(e => e.type === 'frightened') && <div className="vfx-frightened-overlay" />} {/* New VFX for frightened */}
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
                            style={{ transform: `translate(${x}px, ${y}px) scale(0.55)` }}
                            title={`${iconData.title} (${effect.duration} turns left)`}
                        >
                            <Icon />
                            <span className="status-duration">{effect.duration}</span>
                        </div>
                    );
                })}
            </div>
          </div>

          <div className="w-24 mt-2 landscape:mt-1">
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
            if (vfx.type === 'petrified_vfx') { // New VFX for petrified
                return <div key={vfx.id} className="absolute w-20 h-20 bg-gray-500/50 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #78716c' }} />
            }
            if (vfx.type === 'frail_vfx') { // New VFX for frail
                return <div key={vfx.id} className="absolute w-20 h-20 border-4 border-red-500 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #ef4444' }} />
            }
            if (vfx.type === 'frightened_vfx') { // New VFX for frightened
                return <div key={vfx.id} className="absolute w-20 h-20 border-4 border-purple-500 rounded-full animate-pulse" style={{ left: targetRect.left - 16, top: targetRect.top - 16, boxShadow: '0 0 20px 5px #a855f7' }} />
            }
            if (vfx.type === 'burning_spell_vfx') {
                return (
                    <div key={vfx.id} className="absolute" style={{ left: targetRect.left + (targetRect.width/2) - 32, top: targetRect.top + (targetRect.height/2) - 32 }}>
                        <div className="vfx-flame-burst" />
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="vfx-flame-particle" style={{ animationDelay: `${i * 0.08}s`, left: `${Math.random() * 40 - 20}px` }} />
                        ))}
                    </div>
                );
            }
            if (vfx.type === 'blizzard_storm_vfx') {
                return (
                    <div key={vfx.id} className="vfx-blizzard-overlay absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 100 }}>
                        {[...Array(30)].map((_, i) => {
                            const randomX = Math.random() * 100;
                            const randomDelay = Math.random() * 1.5;
                            const randomScale = 0.5 + Math.random() * 1.5;
                            return (
                                <div 
                                    key={i} 
                                    className="vfx-snowflake" 
                                    style={{ 
                                        left: `${randomX}%`, 
                                        top: `-${10 + Math.random() * 20}px`,
                                        animationDelay: `${randomDelay}s`,
                                        transform: `scale(${randomScale})`
                                    }} 
                                />
                            );
                        })}
                    </div>
                );
            }
            if (vfx.type === 'flying_stones_vfx') {
                const dx = targetRect.left - originRect.left;
                const dy = targetRect.top - originRect.top;
                return (
                    <div key={vfx.id} className="absolute" style={{ left: originRect.left + originRect.width / 2, top: originRect.top + originRect.height / 2 }}>
                        {[...Array(6)].map((_, i) => {
                            const delay = i * 0.12;
                            const scatterX = (Math.random() - 0.5) * 30;
                            const scatterY = (Math.random() - 0.5) * 30;
                            return (
                                <div 
                                    key={i} 
                                    className="vfx-flying-stone" 
                                    style={{ 
                                        '--dx': `${dx + scatterX}px`, 
                                        '--dy': `${dy + scatterY}px`,
                                        animationDelay: `${delay}s` 
                                    } as React.CSSProperties} 
                                />
                            );
                        })}
                    </div>
                );
            }
            if (vfx.type === 'blood_spatter') {
                return <div key={vfx.id} className="vfx-blood-spatter" style={{ left: targetRect.left + (targetRect.width/2) - 20, top: targetRect.top + (targetRect.height/2) - 20 }} />
            }
            return null;
        })}
      </>
    )
  }

  const playerState = actors.find(a => a.type === 'PLAYER');
  const isLowHealth = playerState && playerState.hp < playerState.maxHp * 0.3 && !playerState.isDefeated;

  return (
    <div className={`flex-grow w-full h-0 min-h-0 p-2 text-white flex flex-col items-center justify-between bg-black/80 relative overflow-hidden ${shakeClass}`}>
        {isLowHealth && <div className="low-health-vignette" />}
        {/* Combat Background */}
        <CombatBackground element={event.element} />

        {/* Environment Display */}
        {event.environment && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 pixelated-border p-3 text-center z-10 max-w-md landscape:top-2 landscape:p-1.5 landscape:max-w-xs">
                <h3 className="text-lg text-yellow-400 mb-1 landscape:text-xs">{event.environment.name}</h3>
                <p className="text-xs text-gray-300 landscape:text-[10px]">{event.environment.description}</p>
            </div>
        )}

        {/* Battle Scene */}
        <div className="w-full flex-grow flex justify-between items-end px-4 sm:px-8 md:px-16 pb-12 pt-20 landscape:pb-2 landscape:pt-14 relative z-10">
             <div className="flex space-x-4 sm:space-x-8">
                 {actors.filter(a => a.type === 'ENEMY').map(enemy => <ActorSprite key={enemy.id} actor={enemy} onDefeatAnimationEnd={handleDefeatAnimationEnd} />)}
             </div>
             <div className="flex">
                 {actors.find(a => a.type === 'PLAYER') && <ActorSprite actor={actors.find(a => a.type === 'PLAYER')!} onDefeatAnimationEnd={handleDefeatAnimationEnd} equipment={equipment} />}
             </div>
        </div>

        {/* UI Panels */}
        <div className="w-full h-auto landscape:h-28 md:h-48 flex flex-col landscape:flex-row md:flex-row z-20 bg-black/90 flex-shrink-0 border-t-2 border-gray-700/80" style={{backdropFilter:'blur(8px)'}}>
            {/* Command & Ability Menus */}
            {showCommandMenu && (
                <div className="flex-shrink-0 h-16 landscape:h-full w-full landscape:w-auto flex flex-row landscape:flex-col gap-0.5 p-1 landscape:p-1 border-b landscape:border-b-0 landscape:border-r border-gray-700/50">
                    {/* Row 1 in landscape: Attack + Abilities */}
                    <div className="flex landscape:flex-row flex-col gap-0.5 flex-1 landscape:flex-none">
                        {/* Attack button */}
                        <button
                            onClick={() => handlePlayerAction('ATTACK')}
                            className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-red-900/60 bg-gradient-to-r from-red-950/80 to-red-900/40 hover:from-red-800/80 hover:to-red-700/40 text-red-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Normala attack">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 2a1.5 1.5 0 012.12 0l.38.38a1.5 1.5 0 010 2.12L12 6.5 9.5 4l2-2zM8.5 5L1 12.5V15h2.5L11 7.5 8.5 5zM3 13h1v1H3v-1z" /></svg>
                            <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Attack</span>
                        </button>
                        {/* Abilities button */}
                        <button
                            onClick={() => { setShowCommandMenu(false); setShowAbilityMenu(true); }}
                            className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-purple-900/60 bg-gradient-to-r from-purple-950/80 to-purple-900/40 hover:from-purple-800/80 hover:to-purple-700/40 text-purple-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Förmågor">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1z"/></svg>
                            <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Förmågor</span>
                        </button>
                    </div>
                    {/* Row 2 in landscape: Ultimate + Items + Defend */}
                    <div className="flex landscape:flex-row flex-col gap-0.5 flex-1 landscape:flex-none">
                        {/* Ultimate button */}
                        <button
                            onClick={() => { setShowCommandMenu(false); setShowUltimateMenu(true); }}
                            className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-yellow-900/60 bg-gradient-to-r from-yellow-950/80 to-amber-900/40 hover:from-yellow-800/80 hover:to-amber-700/40 text-yellow-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Ultimata förmågor">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-2a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
                            <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Ultimata</span>
                        </button>
                        {/* Items button */}
                        <button
                            onClick={() => { setShowCommandMenu(false); setShowItemMenu(true); }}
                            className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-cyan-900/60 bg-gradient-to-r from-cyan-950/80 to-teal-900/40 hover:from-cyan-800/80 hover:to-teal-700/40 text-cyan-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Föremål">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2h6v2H5V2zm1 4h4v8H6V6zm1 2v4h2V8H7z"/></svg>
                            <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Föremål</span>
                        </button>
                        {/* Defend button */}
                        <button
                            onClick={() => handlePlayerAction('DEFEND')}
                            className="flex-1 landscape:flex-none flex items-center justify-center landscape:justify-start gap-1.5 landscape:px-3 landscape:py-2 px-2 py-1 rounded border border-blue-900/60 bg-gradient-to-r from-blue-950/80 to-blue-900/40 hover:from-blue-800/80 hover:to-blue-700/40 text-blue-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Försvara">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5s5 1.5 5 5c0 3-3 5.5-5 7-2-1.5-5-4-5-7 0-3.5 5-5 5-5z"/></svg>
                            <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap">Försvara</span>
                        </button>
                    </div>
                </div>
            )}
            {showAbilityMenu && (
                <div className="flex-shrink-0 w-full landscape:w-48 md:w-56 flex flex-col h-32 landscape:h-full md:h-full border-b landscape:border-b-0 landscape:border-r border-gray-700/50">
                    <div className="px-2 py-1 text-[8px] font-bold text-purple-400 uppercase tracking-wider border-b border-gray-700/50 flex items-center gap-1 flex-shrink-0">
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1z"/></svg>
                        Förmågor
                    </div>
                    <ul className="flex-grow overflow-y-auto custom-scrollbar">
                      {sortedAbilities.map(([elementName, { abilities }]: [string, { element: Element, abilities: PlayerAbility[] }]) => (
                          <React.Fragment key={elementName}>
                              <li className="px-2 py-0.5 text-[8px] font-bold text-yellow-500/80 uppercase tracking-wider bg-black/20">{elementName.toLowerCase().replace('_', ' ')}</li>
                              {abilities.map(ability => {
                                  const rank = unlockedSkills.get(ability.id) || 1;
                                  const rankData = ability.ranks[rank - 1];
                                  if (!rankData) return null;
                                  const hasFullFlow = actors.find(a => a.type === 'PLAYER')?.statusEffects.some(e => e.type === 'full_flow');
                                  const effectiveCost = hasFullFlow ? 0 : rankData.resourceCost;
                                  
                                  let gainedAmount = 0;
                                  if (character.archetype === 'Pyromanten') {
                                      gainedAmount = rankData.resourceCost;
                                  } else if (character.archetype === 'Ljusbringaren' && rankData.resourceCost === 0) {
                                      gainedAmount = 10 + (rankData.healMultiplier ? Math.floor(rankData.healMultiplier * 30) : (rankData.duration ? rankData.duration * 5 : 0));
                                  } else if (character.archetype === 'Skuggvävaren' && rankData.resourceCost === 0) {
                                      gainedAmount = 10 + (rankData.damageMultiplier ? Math.floor(rankData.damageMultiplier * 10) : 0);
                                  } else if (character.archetype === 'Tidvattenvävaren' && ability.id === 'water_1') {
                                      gainedAmount = 30; // FLODE_PER_HEAL_CC
                                  } else if (character.archetype === 'Stenväktaren' && ability.id === 'earth_1') {
                                      gainedAmount = 12 + rank * 3;
                                  } else if (character.archetype === 'Stormdansaren' && ability.id === 'wind_1') {
                                      gainedAmount = 15 + rank * 3;
                                  }

                                  const generatesResource = gainedAmount > 0;
                                  const canAfford = generatesResource ? true : playerResource >= effectiveCost;
                                  const costText = generatesResource ? `+${gainedAmount}` : `${effectiveCost}`;
                                  
                                  return (
                                    <li key={ability.id}
                                        onClick={() => canAfford ? handlePlayerAction('SKILL', ability.id) : undefined}
                                        className={`px-3 py-1.5 flex justify-between items-center text-[9px] border-b border-gray-800/60 ${canAfford ? 'hover:bg-purple-900/30 cursor-pointer text-gray-200' : 'text-gray-600 cursor-not-allowed'}`}>
                                        <span>{ability.name} {hasFullFlow && '⚡'}</span>
                                        <span className={`text-[8px] font-bold ${generatesResource ? 'text-green-400' : canAfford ? 'text-purple-300' : 'text-gray-600'}`}>{costText}</span>
                                    </li>
                                  )
                              })}
                          </React.Fragment>
                      ))}
                    </ul>
                    <button onClick={() => { setShowAbilityMenu(false); setShowCommandMenu(true); }} className="text-center w-full py-1 text-[8px] text-gray-500 hover:text-gray-300 flex-shrink-0 border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors">◀ Tillbaka</button>
                </div>
            )}
            {showUltimateMenu && (
                <div className="flex-shrink-0 w-full landscape:w-48 md:w-56 flex flex-col h-32 landscape:h-full md:h-full border-b landscape:border-b-0 landscape:border-r border-gray-700/50">
                    <div className="px-2 py-1 text-[8px] font-bold text-yellow-400 uppercase tracking-wider border-b border-gray-700/50 flex items-center gap-1 flex-shrink-0">
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-2a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
                        Ultimata
                    </div>
                    <ul className="flex-grow overflow-y-auto custom-scrollbar">
                        {unlockedUltimateAbilities.length > 0 ? (
                            unlockedUltimateAbilities.map(ultimate => {
                                const playerActor = actors.find(a => a.type === 'PLAYER');
                                const currentCooldown = playerActor?.ultimateCooldowns[ultimate.id] || 0;
                                const isReady = currentCooldown === 0;
                                const Icon = ultimate.icon;
                                return (
                                    <li key={ultimate.id}
                                        onClick={() => isReady ? handlePlayerAction('ULTIMATE', ultimate.id) : undefined}
                                        className={`px-3 py-1.5 flex justify-between items-center text-[9px] border-b border-gray-800/60 ${isReady ? 'hover:bg-yellow-900/30 cursor-pointer text-gray-200' : 'text-gray-600 cursor-not-allowed'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 flex items-center justify-center"><Icon /></div>
                                            <span>{ultimate.name}</span>
                                        </div>
                                        <span className={`text-[8px] font-bold ${isReady ? 'text-yellow-400' : 'text-gray-600'}`}>{isReady ? 'Redo' : `CD: ${currentCooldown}`}</span>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-3 py-2 text-gray-600 text-[9px] text-center">Inga ultimata upplåsta.</li>
                        )}
                    </ul>
                    <button onClick={() => { setShowUltimateMenu(false); setShowCommandMenu(true); }} className="text-center w-full py-1 text-[8px] text-gray-500 hover:text-gray-300 flex-shrink-0 border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors">◀ Tillbaka</button>
                </div>
            )}
            {showItemMenu && (
                <div className="flex-shrink-0 w-full landscape:w-52 md:w-60 flex flex-col h-auto landscape:h-full md:h-full border-b landscape:border-b-0 landscape:border-r border-gray-700/50">
                    <div className="px-2 py-1 text-[8px] font-bold text-cyan-400 uppercase tracking-wider border-b border-gray-700/50 flex items-center gap-1 flex-shrink-0">
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2h6v2H5V2zm1 4h4v8H6V6zm1 2v4h2V8H7z"/></svg>
                        {previewItem ? previewItem.name : 'Föremål'}
                        {previewItem && (
                            <button onClick={() => setPreviewItem(null)} className="ml-auto text-gray-500 hover:text-gray-200 text-[9px] px-1">× Stäng</button>
                        )}
                    </div>

                    {/* Item Preview Panel */}
                    {previewItem ? (
                        <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar p-2 gap-1.5">
                            {/* Rarity badge + name */}
                            <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                    previewItem.rarity === 'Legendarisk' ? 'bg-orange-900/60 text-orange-300 border border-orange-700' :
                                    previewItem.rarity === 'Sällsynt' ? 'bg-purple-900/60 text-purple-300 border border-purple-700' :
                                    previewItem.rarity === 'Magisk' ? 'bg-blue-900/60 text-blue-300 border border-blue-700' :
                                    'bg-gray-800/60 text-gray-400 border border-gray-600'
                                }`}>{previewItem.rarity}</span>
                                <span className="text-[8px] text-gray-500">{previewItem.slot}</span>
                            </div>

                            {/* Consumable effect */}
                            {previewItem.consumableEffect && (
                                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded p-1.5">
                                    <p className="text-[9px] text-emerald-300 font-bold">
                                        {previewItem.consumableEffect.type === 'HEAL' && `❤️ Läker ${previewItem.consumableEffect.value} HP`}
                                        {previewItem.consumableEffect.type === 'AETHER' && `💧 Återställer ${previewItem.consumableEffect.value} ${playerStats.resourceName}`}
                                        {previewItem.consumableEffect.type === 'BUFF' && `✨ Buff: ${previewItem.consumableEffect.description}`}
                                        {previewItem.consumableEffect.type === 'REVIVE' && `☀️ Återupplivning: ${previewItem.consumableEffect.value} HP`}
                                    </p>
                                    <p className="text-[8px] text-gray-400 mt-0.5">{previewItem.consumableEffect.description}</p>
                                </div>
                            )}

                            {/* Equipment stats comparison */}
                            {!previewItem.consumableEffect && Object.keys(previewItem.stats || {}).length > 0 && (() => {
                                const equippedInSlot = equipment[previewItem.slot as keyof typeof equipment] as Item | null | undefined;
                                const statKeys = Array.from(new Set([
                                    ...Object.keys(previewItem.stats || {}),
                                    ...Object.keys(equippedInSlot?.stats || {})
                                ])) as (keyof ItemStats)[];
                                return (
                                    <div className="bg-gray-900/50 border border-gray-700/50 rounded p-1.5">
                                        <p className="text-[7px] text-gray-500 uppercase tracking-wider mb-1">
                                            {equippedInSlot ? `Jämförelse med: ${equippedInSlot.name}` : 'Stats (inget utrustat)'}
                                        </p>
                                        {statKeys.map(stat => {
                                            const newVal = (previewItem.stats as any)[stat] || 0;
                                            const oldVal = equippedInSlot ? ((equippedInSlot.stats as any)[stat] || 0) : 0;
                                            const diff = newVal - oldVal;
                                            return (
                                                <div key={stat} className="flex justify-between items-center text-[8px] py-0.5 border-b border-gray-800/40 last:border-0">
                                                    <span className="text-gray-400 capitalize">{stat}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold">{newVal}</span>
                                                        {equippedInSlot && (
                                                            <span className={`text-[7px] font-bold ${
                                                                diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-gray-500'
                                                            }`}>
                                                                {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '='}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* Affix / special */}
                            {previewItem.affix && (
                                <div className="bg-amber-950/30 border border-amber-800/40 rounded p-1.5">
                                    <p className="text-[8px] text-amber-300">{previewItem.affix.description}</p>
                                </div>
                            )}

                            {/* Use button (only for consumables) */}
                            {previewItem.consumableEffect && (
                                <button
                                    onClick={() => { handleUsePotion(previewItem); setPreviewItem(null); }}
                                    className="w-full py-2 mt-1 rounded border border-emerald-700 bg-gradient-to-r from-emerald-900/80 to-emerald-800/60 hover:from-emerald-700/80 hover:to-emerald-600/60 text-emerald-300 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                                >
                                    ✓ Använd {previewItem.name}
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Item List */
                        <ul className="flex-grow overflow-y-auto custom-scrollbar">
                            {inventory.filter(item => item.consumableEffect || Object.keys(item.stats || {}).length > 0).length > 0 ? (
                                inventory.filter(item => item.consumableEffect || Object.keys(item.stats || {}).length > 0).map(item => (
                                    <li key={item.id}
                                        onClick={() => setPreviewItem(item)}
                                        className={`px-3 py-1.5 cursor-pointer flex justify-between items-center text-[9px] border-b border-gray-800/60 transition-colors ${
                                            item.consumableEffect ? 'hover:bg-cyan-900/30' : 'hover:bg-gray-700/30'
                                        }`}>
                                        <div>
                                            <span className={`font-bold ${
                                                item.rarity === 'Legendarisk' ? 'text-orange-300' :
                                                item.rarity === 'Sällsynt' ? 'text-purple-300' :
                                                item.rarity === 'Magisk' ? 'text-blue-300' : 'text-yellow-300'
                                            }`}>{item.name}</span>
                                            <p className="text-gray-600 text-[8px] mt-0.5">
                                                {item.consumableEffect ? item.consumableEffect.description : item.slot}
                                            </p>
                                        </div>
                                        <span className="text-gray-500 text-[9px] ml-2">›</span>
                                    </li>
                                ))
                            ) : (
                                <li className="px-3 py-2 text-gray-600 text-[9px] text-center">Inga föremål att använda.</li>
                            )}
                        </ul>
                    )}
                    <button onClick={() => { setPreviewItem(null); setShowItemMenu(false); setShowCommandMenu(true); }} className="text-center w-full py-1 text-[8px] text-gray-500 hover:text-gray-300 flex-shrink-0 border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors">◀ Tillbaka</button>
                </div>
            )}
            
            {/* Combat Log */}
            <div 
                ref={logContainerRef}
                className="flex-grow min-w-0 h-16 landscape:h-full overflow-y-auto custom-scrollbar text-[9px] bg-black/30 p-2 font-mono leading-relaxed border-b landscape:border-b-0 landscape:border-r border-gray-700/30"
            >
                 {log.map((msg, i) => (
                     <p key={i} className={`pb-0.5 mb-0.5 ${i === log.length - 1 ? 'text-yellow-300 font-bold' : 'text-gray-400'}`}>
                         {i === log.length - 1 && <span className="text-yellow-500 mr-1">▶</span>}{msg}
                     </p>
                 ))}
            </div>
 
            {/* Player Status */}
            <div className="flex-shrink-0 w-full landscape:w-44 md:w-52 h-16 landscape:h-full p-1.5 landscape:p-2 flex landscape:flex-col flex-row gap-1 landscape:gap-1.5 items-center landscape:items-stretch justify-between">
                {/* Name & Level (landscape only) */}
                <div className="hidden landscape:flex justify-between items-center border-b border-gray-700/40 pb-1 shrink-0">
                    <span className="font-bold text-yellow-400 text-[8px] truncate max-w-[100px]">{character.name}</span>
                    <span className="text-gray-500 text-[7px] uppercase">Lv{character.level}</span>
                </div>
                {/* HP Bar */}
                <div className="flex items-center gap-1 flex-1 landscape:flex-none">
                    <svg className="w-3 h-3 text-red-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 14.25l-1.05-1.02C3.24 9.8 1 7.78 1 5.38 1 3.42 2.52 1.9 4.45 1.9c1.09 0 2.14.53 2.8 1.38.66-.85 1.71-1.38 2.8-1.38 1.93 0 3.45 1.52 3.45 3.48 0 2.4-2.24 4.42-5.95 7.85L8 14.25z"/>
                    </svg>
                    <div className="flex-grow relative h-4 landscape:h-4 bg-black/50 border border-red-950/80 rounded overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-red-700 to-red-500 h-full transition-all duration-500"
                            style={{width: `${Math.max(0, Math.min(100, ((actors.find(a=>a.type==='PLAYER')?.hp || 0) / playerStats.maxHealth) * 100))}%`}}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white" style={{ textShadow: '1px 1px 0 #000' }}>
                            {actors.find(a=>a.type==='PLAYER')?.hp || 0} / {playerStats.maxHealth}
                        </span>
                    </div>
                </div>
                {/* Resource Bar */}
                <div className="flex items-center gap-1 flex-1 landscape:flex-none">
                    <svg className={`w-3 h-3 ${resourceTheme.text} shrink-0`} viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1c0 0-3 3-3 6s2 4 3 6c0 0 3-3 3-6s-3-6-3-6z"/>
                    </svg>
                    <div className="flex-grow relative h-4 landscape:h-4 bg-black/50 border border-blue-950/80 rounded overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${resourceTheme.bg} opacity-90`}
                            style={{width: `${Math.max(0, Math.min(100, (playerResource / playerStats.maxAether) * 100))}%`}}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white" style={{ textShadow: '1px 1px 0 #000' }}>
                            {Math.floor(playerResource)} / {playerStats.maxAether}
                        </span>
                    </div>
                </div>
                {/* ATB Bar */}
                <div className="flex items-center gap-1 flex-1 landscape:flex-none">
                    <svg className="w-3 h-3 text-yellow-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 3v5l3 3.5-1 1-3.5-4V3H8z"/>
                    </svg>
                    <div className="flex-grow h-2.5 landscape:h-2 bg-black/50 border border-yellow-950/60 rounded overflow-hidden">
                         <div 
                             ref={playerAtbBarRef}
                             className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full transition-all duration-300"
                             style={{width: `${actors.find(a=>a.type==='PLAYER')?.atb || 0}%`}}
                         />
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
                    <button onClick={() => onComplete(gameState === 'VICTORY' ? event.rewards : {xp: 0, items: []}, gameState === 'DEFEAT')} className="mt-6 px-4 py-2 border-2 text-lg bg-gray-800/50 border-gray-600 hover:border-yellow-400 text-white transition-colors">
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