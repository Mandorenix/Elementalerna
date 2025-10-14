import React from 'react';
import { Element, type Archetype, type Skill, type PassiveTalent, type UltimateAbility, type PlayerAbility, type Item, type EnemyAbility, type StatusEffect, ArchetypeName } from './types';

// --- Icons ---
// Using placeholder functions for SVG components
const createIcon = (name: string): React.FC => () => <span className="font-bold text-white">{name}</span>;

export const Icons = {
  Fire: createIcon('🔥'),
  Earth: createIcon('🪨'),
  Wind: createIcon('🌬️'),
  Water: createIcon('💧'),
  Magma: createIcon('🌋'),
  Obsidian: createIcon('🪨🔥'),
  Firestorm: createIcon('🌪️🔥'),
  HotAir: createIcon('♨️'),
  Steam: createIcon('🌫️'),
  HotSprings: createIcon('♨️💧'),
  Sand: createIcon('🏜️'),
  Erosion: createIcon('⏳'),
  Mud: createIcon('   泥'),
  Growth: createIcon('🌳'),
  Ice: createIcon('🧊'),
  Storm: createIcon('⛈️'),
  VolcanicStorm: createIcon('🌋⛈️'),
  ElectrifiedMud: createIcon('⚡️泥'),
  VitrifiedStorm: createIcon('⚡️🌪️'),
  Neutral: createIcon('⚪'),
  Strength: createIcon('💪'),
  Dexterity: createIcon('🏃'),
  Intelligence: createIcon('🧠'),
  Constitution: createIcon('❤️'),
  Health: createIcon('❤️'),
  Aether: createIcon('✨'),
  Experience: createIcon('🌟'),
  SkillPoint: createIcon('💡'),
  Attack: createIcon('⚔️'),
  Defense: createIcon('🛡️'),
  Crit: createIcon('💥'),
  Dodge: createIcon('💨'),
  Heal: createIcon('🩹'),
  Buff: createIcon('✨⬆️'),
  Debuff: createIcon('✨⬇️'),
  StatusBurning: createIcon('🔥'),
  StatusPoisoned: createIcon('🤢'),
  StatusSlowed: createIcon('🐌'),
  StatusDefending: createIcon('🛡️'),
  StatusHasted: createIcon('⚡'),
  StatusRetaliating: createIcon('💢'),
  StatusBlinded: createIcon('🕶️'),
  StatusFullFlow: createIcon('🌊'),
  StatusOverheated: createIcon('🥵'),
  StatusRooted: createIcon('🌳⬇️'),
  StatusSteamed: createIcon('♨️'),
  StatusRegenerating: createIcon('💚'),
  StatusArmorReduction: createIcon('💔'),
  StatusStunned: createIcon('💫'),
  StatusFrozen: createIcon('🥶'),
  StatusDamageReduction: createIcon('🛡️⬇️'),
  StatusParalyzed: createIcon(' paralysed'), // New
  StatusBleeding: createIcon('🩸'), // New
  StatusFrightened: createIcon('😱'), // New
  StatusReflecting: createIcon('🪞'), // New
  StatusAbsorbing: createIcon(' absorbing'), // New
  EnemyGoblin: createIcon('👹'),
  EnemyGolem: createIcon('🗿'),
  Choice: createIcon('❓'),
  Chest: createIcon('📦'),
  Altar: createIcon('✨'),
  Fountain: createIcon('⛲'),
  RustySword: createIcon('🗡️'),
  LeatherHelm: createIcon('🪖'),
  LeatherArmor: createIcon('🦺'),
  Shield: createIcon('🛡️'),
  // New icons for footer
  Boon: createIcon('✨'),
  Push: createIcon('💪'),
  CardDraw: createIcon('🃏'),
  Start: createIcon('▶️'),
  Burn: createIcon('🔥'),
  Poison: createIcon('🤢'),
  Slow: createIcon('🐌'),
  Blinded: createIcon('🕶️'),
  FullFlow: createIcon('🌊'),
  Overheat: createIcon('🥵'),
  Rooted: createIcon('🌳'),
  Steamed: createIcon('♨️'),
  Regenerating: createIcon('💚'),
};

export const ELEMENT_ICONS: Record<Element, React.FC> = {
  [Element.NEUTRAL]: Icons.Neutral,
  [Element.FIRE]: Icons.Fire,
  [Element.EARTH]: Icons.Earth,
  [Element.WIND]: Icons.Wind,
  [Element.WATER]: Icons.Water,
  [Element.MAGMA]: Icons.Magma,
  [Element.OBSIDIAN]: Icons.Obsidian,
  [Element.FIRESTORM]: Icons.Firestorm,
  [Element.HOT_AIR]: Icons.HotAir,
  [Element.STEAM]: Icons.Steam,
  [Element.HOT_SPRINGS]: Icons.HotSprings,
  [Element.SAND]: Icons.Sand,
  [Element.EROSION]: Icons.Erosion,
  [Element.MUD]: Icons.Mud,
  [Element.GROWTH]: Icons.Growth,
  [Element.ICE]: Icons.Ice,
  [Element.STORM]: Icons.Storm,
  [Element.VOLCANIC_STORM]: Icons.VolcanicStorm,
  [Element.ELECTRIFIED_MUD]: Icons.ElectrifiedMud,
  [Element.VITRIFIED_STORM]: Icons.VitrifiedStorm,
};

export const ItemVisuals = {
  RustySword: createIcon('🗡️'),
  LeatherHelm: createIcon('🪖'),
  LeatherArmor: createIcon('🦺'),
};

export const STATUS_EFFECT_ICONS: Record<StatusEffect['type'], React.FC> = {
  defending: Icons.StatusDefending,
  hasted: Icons.StatusHasted,
  burning: Icons.StatusBurning,
  poisoned: Icons.StatusPoisoned,
  slowed: Icons.StatusSlowed,
  retaliating: Icons.StatusRetaliating,
  blinded: Icons.StatusBlinded,
  full_flow: Icons.StatusFullFlow,
  overheated: Icons.StatusOverheated,
  rooted: Icons.StatusRooted,
  steamed: Icons.StatusSteamed,
  regenerating: Icons.StatusRegenerating,
  armor_reduction: Icons.StatusArmorReduction,
  stunned: Icons.StatusStunned,
  frozen: Icons.StatusFrozen,
  damage_reduction: Icons.StatusDamageReduction,
  paralyzed: Icons.StatusParalyzed, // New
  bleeding: Icons.StatusBleeding, // New
  frightened: Icons.StatusFrightened, // New
  reflecting: Icons.StatusReflecting, // New
  absorbing: Icons.StatusAbsorbing, // New
};

// --- Archetypes ---
export const ARCHETYPES: Archetype[] = [ // Changed to array
  {
    name: 'Pyromanten',
    description: 'En mästare på eldmagi, specialiserad på att bränna fiender över tid.',
    element: Element.FIRE,
    icon: Icons.Fire,
    statBonuses: { intelligence: 2, strength: 1 },
    startingSkill: 'fireball',
    resourceName: 'Hetta',
  },
  {
    name: 'Stenväktaren',
    description: 'En robust försvarare som manipulerar jorden för att skydda sig och sina allierade.',
    element: Element.EARTH,
    icon: Icons.Earth,
    statBonuses: { constitution: 2, strength: 1 },
    startingSkill: 'rock_throw',
    resourceName: 'Styrka',
  },
  {
    name: 'Stormdansaren',
    description: 'En snabb och svårfångad krigare som använder vindens kraft för att undvika attacker och slå snabbt.',
    element: Element.WIND,
    icon: Icons.Wind,
    statBonuses: { dexterity: 2, intelligence: 1 },
    startingSkill: 'gust',
    resourceName: 'Energi',
  },
  {
    name: 'Tidvattenvävaren',
    description: 'En helare och kontrollör som använder vatten för att läka sår och sakta ner fiender.',
    element: Element.WATER,
    icon: Icons.Water,
    statBonuses: { intelligence: 2, constitution: 1 },
    startingSkill: 'water_bolt',
    resourceName: 'Flöde',
  },
];

// --- Skills ---
export const SKILL_TREE_DATA: Skill[] = [ // Renamed to SKILL_TREE_DATA
  // Fire Skills
  {
    id: 'fireball',
    name: 'Eldklot',
    description: 'Kastar ett eldklot som gör skada och har en chans att bränna fienden.',
    element: Element.FIRE,
    icon: Icons.Fire,
    x: 0, y: 0,
    maxRank: 3,
  },
  {
    id: 'incinerate',
    name: 'Förbränna',
    description: 'Gör stor eldskada på ett enskilt mål.',
    dependencies: ['fireball'],
    element: Element.FIRE,
    icon: Icons.Fire,
    x: 1, y: 0,
    maxRank: 3,
  },
  {
    id: 'fire_shield',
    name: 'Eldsköld',
    description: 'Omger dig med en sköld av eld som skadar anfallare.',
    dependencies: ['fireball'],
    element: Element.FIRE,
    icon: Icons.Fire,
    x: 0, y: 1,
    maxRank: 3,
  },
  // Earth Skills
  {
    id: 'rock_throw',
    name: 'Stenkast',
    description: 'Kastar en sten som gör fysisk skada.',
    element: Element.EARTH,
    icon: Icons.Earth,
    x: 0, y: 0,
    maxRank: 3,
  },
  {
    id: 'earthquake',
    name: 'Jordbävning',
    description: 'Skakar marken och skadar alla fiender i ett område.',
    dependencies: ['rock_throw'],
    element: Element.EARTH,
    icon: Icons.Earth,
    x: 1, y: 0,
    maxRank: 3,
  },
  {
    id: 'harden_skin',
    name: 'Härda Hud',
    description: 'Ökar din rustning under en kort period.',
    dependencies: ['rock_throw'],
    element: Element.EARTH,
    icon: Icons.Earth,
    x: 0, y: 1,
    maxRank: 3,
  },
  // Wind Skills
  {
    id: 'gust',
    name: 'Vindstöt',
    description: 'En snabb vindstöt som gör vindskada och har en chans att sakta ner fienden.',
    element: Element.WIND,
    icon: Icons.Wind,
    x: 0, y: 0,
    maxRank: 3,
  },
  {
    id: 'cyclone',
    name: 'Cyklon',
    description: 'Skapar en virvelvind som skadar och förvirrar fiender i ett område.',
    dependencies: ['gust'],
    element: Element.WIND,
    icon: Icons.Wind,
    x: 1, y: 0,
    maxRank: 3,
  },
  {
    id: 'evasive_maneuver',
    name: 'Undvikande Manöver',
    description: 'Ökar din undvikandechans under en kort period.',
    dependencies: ['gust'],
    element: Element.WIND,
    icon: Icons.Wind,
    x: 0, y: 1,
    maxRank: 3,
  },
  // Water Skills
  {
    id: 'water_bolt',
    name: 'Vattenprojektil',
    description: 'Kastar en vattenprojektil som gör vattenskada.',
    element: Element.WATER,
    icon: Icons.Water,
    x: 0, y: 0,
    maxRank: 3,
  },
  {
    id: 'healing_wave',
    name: 'Helande Våg',
    description: 'Skickar ut en våg av helande energi som återställer hälsa till dig själv eller en allierad.',
    dependencies: ['water_bolt'],
    element: Element.WATER,
    icon: Icons.Water,
    x: 1, y: 0,
    maxRank: 3,
  },
  {
    id: 'freeze',
    name: 'Frysning',
    description: 'Fryser en fiende, vilket hindrar dem från att agera under en kort tid.',
    dependencies: ['water_bolt'],
    element: Element.WATER,
    icon: Icons.Water,
    x: 0, y: 1,
    maxRank: 3,
  },
];

// --- Player Abilities (Active Skills) ---
export const PLAYER_ABILITIES: Record<string, PlayerAbility> = {
  fireball: {
    id: 'fireball',
    name: 'Eldklot',
    element: Element.FIRE,
    category: 'damage',
    targetType: 'SINGLE_ENEMY', // Default for single target
    ranks: [
      { description: 'Gör 10 eldskada. 20% chans att bränna i 2 rundor (3 skada/runda).', resourceCost: 10, damageMultiplier: 1.0, dotDamage: 3, duration: 2, chance: 20, statusEffectsToApply: ['burning'] },
      { description: 'Gör 15 eldskada. 30% chans att bränna i 2 rundor (5 skada/runda).', resourceCost: 12, damageMultiplier: 1.5, dotDamage: 5, duration: 2, chance: 30, statusEffectsToApply: ['burning'] },
      { description: 'Gör 20 eldskada. 40% chans att bränna i 3 rundor (7 skada/runda).', resourceCost: 15, damageMultiplier: 2.0, dotDamage: 7, duration: 3, chance: 40, statusEffectsToApply: ['burning'] },
    ],
    cooldown: 0,
  },
  incinerate: {
    id: 'incinerate',
    name: 'Förbränna',
    element: Element.FIRE,
    category: 'damage',
    targetType: 'SINGLE_ENEMY',
    ranks: [
      { description: 'Gör 30 eldskada.', resourceCost: 20, damageMultiplier: 3.0 },
      { description: 'Gör 45 eldskada.', resourceCost: 25, damageMultiplier: 4.5 },
      { description: 'Gör 60 eldskada.', resourceCost: 30, damageMultiplier: 6.0 },
    ],
    cooldown: 3,
  },
  fire_shield: {
    id: 'fire_shield',
    name: 'Eldsköld',
    element: Element.FIRE,
    category: 'buff',
    targetType: 'SELF',
    ranks: [
      { description: 'Omger dig med en eldsköld. När du tar skada, 30% chans att bränna anfallaren i 1 runda (2 skada/runda). Varar 3 rundor.', resourceCost: 15, duration: 3, chance: 30, dotDamage: 2, statusEffectsToApply: ['retaliating'] },
      { description: 'Omger dig med en eldsköld. När du tar skada, 40% chans att bränna anfallaren i 2 rundor (3 skada/runda). Varar 4 rundor.', resourceCost: 18, duration: 4, chance: 40, dotDamage: 3, statusEffectsToApply: ['retaliating'] },
      { description: 'Omger dig med en eldsköld. När du tar skada, 50% chans att bränna anfallaren i 2 rundor (4 skada/runda). Varar 5 rundor.', resourceCost: 22, duration: 5, chance: 50, dotDamage: 4, statusEffectsToApply: ['retaliating'] },
    ],
    cooldown: 5,
  },
  rock_throw: {
    id: 'rock_throw',
    name: 'Stenkast',
    element: Element.EARTH,
    category: 'damage',
    targetType: 'SINGLE_ENEMY',
    ranks: [
      { description: 'Gör 12 fysisk skada.', resourceCost: 8, damageMultiplier: 1.2 },
      { description: 'Gör 18 fysisk skada.', resourceCost: 10, damageMultiplier: 1.8 },
      { description: 'Gör 24 fysisk skada.', resourceCost: 12, damageMultiplier: 2.4 },
    ],
    cooldown: 0,
  },
  earthquake: {
    id: 'earthquake',
    name: 'Jordbävning',
    element: Element.EARTH,
    category: 'damage',
    targetType: 'ALL_ENEMIES', // AOE
    ranks: [
      { description: 'Gör 15 jordskada till alla fiender.', resourceCost: 25, damageMultiplier: 1.5 },
      { description: 'Gör 20 jordskada till alla fiender.', resourceCost: 30, damageMultiplier: 2.0 },
      { description: 'Gör 25 jordskada till alla fiender.', resourceCost: 35, damageMultiplier: 2.5 },
    ],
    cooldown: 4,
  },
  harden_skin: {
    id: 'harden_skin',
    name: 'Härda Hud',
    element: Element.EARTH,
    category: 'buff',
    targetType: 'SELF',
    ranks: [
      { description: 'Ökar din rustning med 10 under 3 rundor.', resourceCost: 15, duration: 3, value: 10, statusEffectsToApply: ['defending'] },
      { description: 'Ökar din rustning med 15 under 4 rundor.', resourceCost: 18, duration: 4, value: 15, statusEffectsToApply: ['defending'] },
      { description: 'Ökar din rustning med 20 under 5 rundor.', resourceCost: 22, duration: 5, value: 20, statusEffectsToApply: ['defending'] },
    ],
    cooldown: 5,
  },
  gust: {
    id: 'gust',
    name: 'Vindstöt',
    element: Element.WIND,
    category: 'damage',
    targetType: 'SINGLE_ENEMY',
    ranks: [
      { description: 'Gör 8 vindskada. 25% chans att sakta ner i 1 runda.', resourceCost: 9, damageMultiplier: 0.8, chance: 25, duration: 1, statusEffectsToApply: ['slowed'] },
      { description: 'Gör 12 vindskada. 35% chans att sakta ner i 2 rundor.', resourceCost: 11, damageMultiplier: 1.2, chance: 35, duration: 2, statusEffectsToApply: ['slowed'] },
      { description: 'Gör 16 vindskada. 45% chans att sakta ner i 2 rundor.', resourceCost: 14, damageMultiplier: 1.6, chance: 45, duration: 2, statusEffectsToApply: ['slowed'] },
    ],
    cooldown: 0,
  },
  cyclone: {
    id: 'cyclone',
    name: 'Cyklon',
    element: Element.WIND,
    category: 'cc',
    targetType: 'CIRCLE_AOE', // New AOE type
    ranks: [
      { description: 'Gör 10 vindskada till alla fiender i ett område. 20% chans att förlama i 1 runda.', resourceCost: 28, damageMultiplier: 1.0, chance: 20, duration: 1, statusEffectsToApply: ['paralyzed'] },
      { description: 'Gör 15 vindskada till alla fiender i ett område. 30% chans att förlama i 1 runda.', resourceCost: 32, damageMultiplier: 1.5, chance: 30, duration: 1, statusEffectsToApply: ['paralyzed'] },
      { description: 'Gör 20 vindskada till alla fiender i ett område. 40% chans att förlama i 2 rundor.', resourceCost: 38, damageMultiplier: 2.0, chance: 40, duration: 2, statusEffectsToApply: ['paralyzed'] },
    ],
    cooldown: 5,
  },
  evasive_maneuver: {
    id: 'evasive_maneuver',
    name: 'Undvikande Manöver',
    element: Element.WIND,
    category: 'buff',
    targetType: 'SELF',
    ranks: [
      { description: 'Ökar din undvikandechans med 15% under 2 rundor.', resourceCost: 12, duration: 2, value: 15, isPercentage: true, statusEffectsToApply: ['hasted'] },
      { description: 'Ökar din undvikandechans med 20% under 3 rundor.', resourceCost: 15, duration: 3, value: 20, isPercentage: true, statusEffectsToApply: ['hasted'] },
      { description: 'Ökar din undvikandechans med 25% under 4 rundor.', resourceCost: 18, duration: 4, value: 25, isPercentage: true, statusEffectsToApply: ['hasted'] },
    ],
    cooldown: 4,
  },
  water_bolt: {
    id: 'water_bolt',
    name: 'Vattenprojektil',
    element: Element.WATER,
    category: 'damage',
    targetType: 'SINGLE_ENEMY',
    ranks: [
      { description: 'Gör 10 vattenskada.', resourceCost: 10, damageMultiplier: 1.0 },
      { description: 'Gör 15 vattenskada.', resourceCost: 12, damageMultiplier: 1.5 },
      { description: 'Gör 20 vattenskada.', resourceCost: 15, damageMultiplier: 2.0 },
    ],
    cooldown: 0,
  },
  healing_wave: {
    id: 'healing_wave',
    name: 'Helande Våg',
    element: Element.WATER,
    category: 'heal',
    targetType: 'SINGLE_ENEMY', // Can target self or ally in future, for now single enemy is placeholder
    ranks: [
      { description: 'Läker 20 hälsa.', resourceCost: 15, healMultiplier: 2.0 },
      { description: 'Läker 30 hälsa.', resourceCost: 18, healMultiplier: 3.0 },
      { description: 'Läker 40 hälsa.', resourceCost: 22, healMultiplier: 4.0 },
    ],
    cooldown: 3,
  },
  freeze: {
    id: 'freeze',
    name: 'Frysning',
    element: Element.WATER,
    category: 'cc',
    targetType: 'SINGLE_ENEMY',
    ranks: [
      { description: 'Fryser en fiende i 1 runda.', resourceCost: 20, duration: 1, statusEffectsToApply: ['frozen'] },
      { description: 'Fryser en fiende i 2 rundor.', resourceCost: 25, duration: 2, statusEffectsToApply: ['frozen'] },
      { description: 'Fryser en fiende i 2 rundor och gör 5 vattenskada.', resourceCost: 30, duration: 2, damageMultiplier: 0.5, statusEffectsToApply: ['frozen'] },
    ],
    cooldown: 4,
  },
};

// --- Passive Talents ---
export const PASSIVE_TALENTS: Record<string, PassiveTalent> = {
  // Fire Passives
  fire_affinity: {
    id: 'fire_affinity',
    name: 'Eldaffinitet',
    description: 'Ökar din eldskada med 10%.',
    element: Element.FIRE,
    icon: Icons.Fire,
    effect: { type: 'STAT_BONUS', stat: 'skada', value: 10, isPercentage: true, element: Element.FIRE },
  },
  pyromaniac: {
    id: 'pyromaniac',
    name: 'Pyroman',
    description: 'Brännskador du applicerar gör 20% mer skada.',
    element: Element.FIRE,
    icon: Icons.StatusBurning,
    effect: { type: 'STAT_BONUS', stat: 'skada', value: 20, isPercentage: true, element: Element.FIRE }, // Assuming 'damage' here refers to DoT damage
  },
  // Earth Passives
  earth_affinity: {
    id: 'earth_affinity',
    name: 'Jordaffinitet',
    description: 'Ökar din rustning med 15%.',
    element: Element.EARTH,
    icon: Icons.Earth,
    effect: { type: 'STAT_BONUS', stat: 'rustning', value: 15, isPercentage: true },
  },
  stone_skin: {
    id: 'stone_skin',
    name: 'Stenhud',
    description: 'Har en 10% chans att reflektera 50% av inkommande fysisk skada.',
    element: Element.EARTH,
    icon: Icons.StatusReflecting,
    effect: { type: 'APPLY_STATUS', status: 'reflecting', chance: 10, duration: 1, element: Element.NEUTRAL, value: 50, isPercentage: true },
  },
  // Wind Passives
  wind_affinity: {
    id: 'wind_affinity',
    name: 'Vindaffinitet',
    description: 'Ökar din undvikandechans med 10%.',
    element: Element.WIND,
    icon: Icons.Wind,
    effect: { type: 'STAT_BONUS', stat: 'undvikandechans', value: 10, isPercentage: true },
  },
  swift_strikes: {
    id: 'swift_strikes',
    name: 'Snabba Slag',
    description: 'Dina attacker har en 15% chans att applicera Blödning (3 skada/runda i 2 rundor).',
    element: Element.WIND,
    icon: Icons.StatusBleeding,
    effect: { type: 'APPLY_STATUS', status: 'bleeding', chance: 15, duration: 2, damage: 3 },
  },
  // Water Passives
  water_affinity: {
    id: 'water_affinity',
    name: 'Vattenaffinitet',
    description: 'Ökar din helande effekt med 15%.',
    element: Element.WATER,
    icon: Icons.Water,
    effect: { type: 'HEAL_BONUS', value: 15, isPercentage: true },
  },
  tidal_flow: {
    id: 'tidal_flow',
    name: 'Tidvattenflöde',
    description: 'När du helar en allierad, har du en 20% chans att applicera Regenerering (läker 5 hälsa/runda i 2 rundor).',
    element: Element.WATER,
    icon: Icons.StatusRegenerating,
    effect: { type: 'APPLY_STATUS', status: 'regenerating', chance: 20, duration: 2, value: 5 },
  },
};

// --- Ultimate Abilities ---
export const ULTIMATE_ABILITIES: Record<string, UltimateAbility> = {
  // Fire Ultimate
  meteor_shower: {
    id: 'meteor_shower',
    name: 'Meteorskur',
    description: 'Kallar ner en skur av meteorer som träffar alla fiender, gör massiv eldskada och bränner dem.',
    element: Element.FIRE,
    icon: Icons.Firestorm,
    cooldown: 10,
    targetType: 'ALL_ENEMIES',
    effect: { type: 'AOE_DAMAGE', damage: 100, buff: 'burning', duration: 3, value: 10 },
  },
  // Earth Ultimate
  earth_shatter: {
    id: 'earth_shatter',
    name: 'Jordsprängning',
    description: 'Slår i marken och skadar alla fiender, med en chans att förlama dem och öka din rustning drastiskt.',
    element: Element.EARTH,
    icon: Icons.Earth,
    cooldown: 12,
    targetType: 'ALL_ENEMIES',
    effect: { type: 'AOE_DAMAGE', damage: 80, buff: 'paralyzed', duration: 1, value: 10, isPercentage: false }, // Value for armor buff
  },
  // Wind Ultimate
  tempest_strike: {
    id: 'tempest_strike',
    name: 'Stormslag',
    description: 'En blixtsnabb attack som träffar en fiende flera gånger, med hög chans att applicera blödning och skräckslagen.',
    element: Element.WIND,
    icon: Icons.Storm,
    cooldown: 9,
    targetType: 'SINGLE_ENEMY',
    effect: { type: 'SINGLE_TARGET_DAMAGE', damage: 120, buff: 'bleeding', duration: 3, value: 15, isPercentage: false }, // Bleeding damage
  },
  // Water Ultimate
  tidal_surge: {
    id: 'tidal_surge',
    name: 'Tidvattenvåg',
    description: 'En massiv våg som helar alla allierade och ger dem en sköld som absorberar inkommande skada.',
    element: Element.WATER,
    icon: Icons.Water,
    cooldown: 11,
    targetType: 'ALL_ALLIES',
    effect: { type: 'MASS_HEAL', heal: 150, buff: 'absorbing', duration: 2, value: 50, isPercentage: false }, // Absorb value
  },
};

// --- Elemental Bonuses ---
export const ELEMENTAL_AFFINITY_BONUSES = { // Renamed to ELEMENTAL_AFFINITY_BONUSES
  [Element.FIRE]: [
    { threshold: 5, description: 'Ökad eldskada.', effect: { type: 'STAT_BONUS', stat: 'skada', value: 5, isPercentage: true, element: Element.FIRE } },
    { threshold: 10, description: 'Låser upp passiv talang: Pyroman.', effect: { type: 'PASSIVE_TALENT', talentId: 'pyromaniac' } },
    { threshold: 15, description: 'Ökad chans att applicera Brännskada.', effect: { type: 'APPLY_STATUS', status: 'burning', chance: 10, duration: 1, damage: 2 } },
    { threshold: 20, description: 'Låser upp Ultimat Förmåga: Meteorskur.', effect: { type: 'ULTIMATE_ABILITY', abilityId: 'meteor_shower' } },
  ],
  [Element.EARTH]: [
    { threshold: 5, description: 'Ökad rustning.', effect: { type: 'STAT_BONUS', stat: 'rustning', value: 5, isPercentage: true } },
    { threshold: 10, description: 'Låser upp passiv talang: Stenhud.', effect: { type: 'PASSIVE_TALENT', talentId: 'stone_skin' } },
    { threshold: 15, description: 'Ökad hälsa.', effect: { type: 'STAT_BONUS', stat: 'constitution', value: 10 } },
    { threshold: 20, description: 'Låser upp Ultimat Förmåga: Jordsprängning.', effect: { type: 'ULTIMATE_ABILITY', abilityId: 'earth_shatter' } },
  ],
  [Element.WIND]: [
    { threshold: 5, description: 'Ökad undvikandechans.', effect: { type: 'STAT_BONUS', stat: 'undvikandechans', value: 5, isPercentage: true } },
    { threshold: 10, description: 'Låser upp passiv talang: Snabba Slag.', effect: { type: 'PASSIVE_TALENT', talentId: 'swift_strikes' } },
    { threshold: 15, description: 'Ökad kritisk träffchans.', effect: { type: 'STAT_BONUS', stat: 'kritiskTräff', value: 5, isPercentage: true } },
    { threshold: 20, description: 'Låser upp Ultimat Förmåga: Stormslag.', effect: { type: 'ULTIMATE_ABILITY', abilityId: 'tempest_strike' } },
  ],
  [Element.WATER]: [
    { threshold: 5, description: 'Ökad helande effekt.', effect: { type: 'HEAL_BONUS', value: 5, isPercentage: true } },
    { threshold: 10, description: 'Låser upp passiv talang: Tidvattenflöde.', effect: { type: 'PASSIVE_TALENT', talentId: 'tidal_flow' } },
    { threshold: 15, description: 'Ökad Aether-regenerering.', effect: { type: 'RESOURCE_REGEN', stat: 'aether', value: 1 } },
    { threshold: 20, description: 'Låser upp Ultimat Förmåga: Tidvattenvåg.', effect: { type: 'ULTIMATE_ABILITY', abilityId: 'tidal_surge' } },
  ],
};

// --- Initial Player State ---
export const INITIAL_CHARACTER_BASE = { // Renamed to INITIAL_CHARACTER_BASE
  stats: {
    strength: 10,
    dexterity: 10,
    intelligence: 10,
    constitution: 10,
  },
  resources: {
    health: { current: 100, max: 100 },
    aether: { name: 'Aether', current: 50, max: 50 },
  },
  experience: {
    current: 0,
    max: 100,
  },
  level: 1,
  name: 'Äventyrare',
  archetype: 'Pyromanten' as ArchetypeName, // Default archetype
  elementalAffinities: {
    [Element.FIRE]: 0,
    [Element.EARTH]: 0,
    [Element.WIND]: 0,
    [Element.WATER]: 0,
  },
  unlockedPassiveTalents: [],
  unlockedUltimateAbilities: [],
  activeAbilities: [],
  equippedItems: [],
  statusEffects: [],
};

// --- Items (for testing/initial setup) ---
export const STARTER_ITEMS: Item[] = [
  {
    id: 'starter_sword',
    name: 'Enkelt Svärd',
    rarity: 'Vanlig',
    slot: 'Vapen 1',
    stats: { skada: 5 },
    icon: Icons.RustySword,
    visual: ItemVisuals.RustySword,
  },
  {
    id: 'starter_helm',
    name: 'Enkel Läderhuva',
    rarity: 'Vanlig',
    slot: 'Hjälm',
    stats: { rustning: 2 },
    icon: Icons.LeatherHelm,
    visual: ItemVisuals.LeatherHelm,
  },
];

// --- Enemy Abilities (for testing/initial setup) ---
export const ENEMY_ABILITIES: Record<string, EnemyAbility> = {
  basic_attack: {
    id: 'basic_attack',
    name: 'Grundattack',
    element: Element.NEUTRAL,
    category: 'damage',
    targetType: 'SINGLE_PLAYER',
    damageMultiplier: 1.0,
    cooldown: 0,
  },
  poison_spit: {
    id: 'poison_spit',
    name: 'Giftspott',
    element: Element.WATER,
    category: 'cc',
    targetType: 'SINGLE_PLAYER',
    damageMultiplier: 0.5,
    statusEffectsToApply: ['poisoned'],
    duration: 3,
    value: 5, // Poison damage per turn
    cooldown: 2,
  },
  fire_breath: {
    id: 'fire_breath',
    name: 'Eldandedräkt',
    element: Element.FIRE,
    category: 'damage',
    targetType: 'ALL_PLAYERS',
    damageMultiplier: 0.8,
    statusEffectsToApply: ['burning'],
    duration: 2,
    value: 7, // Burning damage per turn
    cooldown: 3,
  },
  harden: {
    id: 'harden',
    name: 'Härda',
    element: Element.EARTH,
    category: 'buff',
    targetType: 'SELF',
    statusEffectsToApply: ['defending'],
    duration: 3,
    value: 10, // Armor increase
    cooldown: 4,
  },
  wind_slash: {
    id: 'wind_slash',
    name: 'Vindhugg',
    element: Element.WIND,
    category: 'damage',
    targetType: 'SINGLE_PLAYER',
    damageMultiplier: 1.2,
    statusEffectsToApply: ['slowed'],
    duration: 2,
    cooldown: 1,
  },
  // New enemy abilities for advanced mechanics
  paralyzing_gaze: {
    id: 'paralyzing_gaze',
    name: 'Förlamande Blick',
    element: Element.NEUTRAL,
    category: 'cc',
    targetType: 'SINGLE_PLAYER',
    statusEffectsToApply: ['paralyzed'],
    duration: 1,
    cooldown: 3,
  },
  blood_frenzy: {
    id: 'blood_frenzy',
    name: 'Blodsraseri',
    element: Element.NEUTRAL,
    category: 'buff',
    targetType: 'SELF',
    statusEffectsToApply: ['bleeding'], // Self-inflict bleeding for a buff
    duration: 2,
    value: 5, // Bleeding damage
    damageMultiplier: 1.5, // Damage buff
    cooldown: 4,
  },
  terrifying_roar: {
    id: 'terrifying_roar',
    name: 'Skräckinjagande Rop',
    element: Element.NEUTRAL,
    category: 'cc',
    targetType: 'ALL_PLAYERS',
    statusEffectsToApply: ['frightened'],
    duration: 2,
    value: 0.3, // Chance to miss turn
    cooldown: 5,
  },
  elemental_reflection: {
    id: 'elemental_reflection',
    name: 'Elementär Reflektion',
    element: Element.NEUTRAL,
    category: 'buff',
    targetType: 'SELF',
    statusEffectsToApply: ['reflecting'],
    duration: 2,
    value: 50, // 50% reflection
    cooldown: 6,
  },
  aether_absorption: {
    id: 'aether_absorption',
    name: 'Aetherabsorption',
    element: Element.NEUTRAL,
    category: 'buff',
    targetType: 'SELF',
    statusEffectsToApply: ['absorbing'],
    duration: 2,
    value: 30, // 30% absorption
    cooldown: 6,
  },
};

export const elementThemes: Record<Element, string> = {
  [Element.NEUTRAL]: 'bg-gray-700 border-gray-500 text-gray-300 shadow-gray-500/50',
  [Element.FIRE]: 'bg-red-800 border-red-600 text-red-300 shadow-red-600/50',
  [Element.EARTH]: 'bg-lime-800 border-lime-600 text-lime-300 shadow-lime-600/50',
  [Element.WIND]: 'bg-teal-800 border-teal-600 text-teal-300 shadow-teal-600/50',
  [Element.WATER]: 'bg-blue-800 border-blue-600 text-blue-300 shadow-blue-600/50',
  [Element.MAGMA]: 'bg-orange-800 border-orange-600 text-orange-300 shadow-orange-600/50',
  [Element.OBSIDIAN]: 'bg-purple-800 border-purple-600 text-purple-300 shadow-purple-600/50',
  [Element.FIRESTORM]: 'bg-yellow-800 border-yellow-600 text-yellow-300 shadow-yellow-600/50',
  [Element.HOT_AIR]: 'bg-amber-800 border-amber-600 text-amber-300 shadow-amber-600/50',
  [Element.STEAM]: 'bg-cyan-800 border-cyan-600 text-cyan-300 shadow-cyan-600/50',
  [Element.HOT_SPRINGS]: 'bg-pink-800 border-pink-600 text-pink-300 shadow-pink-600/50',
  [Element.SAND]: 'bg-yellow-900 border-yellow-700 text-yellow-400 shadow-yellow-700/50',
  [Element.EROSION]: 'bg-stone-800 border-stone-600 text-stone-300 shadow-stone-600/50',
  [Element.MUD]: 'bg-amber-950 border-amber-800 text-amber-400 shadow-amber-800/50',
  [Element.GROWTH]: 'bg-green-800 border-green-600 text-green-300 shadow-green-600/50',
  [Element.ICE]: 'bg-sky-800 border-sky-600 text-sky-300 shadow-sky-600/50',
  [Element.STORM]: 'bg-indigo-800 border-indigo-600 text-indigo-300 shadow-indigo-600/50',
  [Element.VOLCANIC_STORM]: 'bg-red-950 border-red-800 text-red-400 shadow-red-800/50',
  [Element.ELECTRIFIED_MUD]: 'bg-lime-950 border-lime-800 text-lime-400 shadow-lime-800/50',
  [Element.VITRIFIED_STORM]: 'bg-teal-950 border-teal-800 text-teal-400 shadow-teal-800/50',
};

export const BACKGROUND_BIOMES: Record<Element, { name: string; classes: string }[]> = {
  [Element.NEUTRAL]: [
    { name: 'Ancient Ruins', classes: 'bg-neutral-ruins' },
    { name: 'Desert', classes: 'bg-neutral-desert' },
    { name: 'Forgotten Tomb', classes: 'bg-neutral-tomb' },
  ],
  [Element.FIRE]: [
    { name: 'Volcanic Wasteland', classes: 'bg-fire-volcanic' },
    { name: 'Burning Forest', classes: 'bg-fire-forest' },
    { name: 'Magma Cave', classes: 'bg-fire-magma-cave' },
  ],
  [Element.EARTH]: [
    { name: 'Deep Mines', classes: 'bg-earth-mines' },
    { name: 'Rocky Mountains', classes: 'bg-earth-mountains' },
    { name: 'Lush Underground Cave', classes: 'bg-earth-lush-cave' },
  ],
  [Element.WIND]: [
    { name: 'Floating Islands', classes: 'bg-wind-floating-islands' },
    { name: 'Stormy Peaks', classes: 'bg-wind-stormy-peaks' },
    { name: 'Open Plains', classes: 'bg-wind-plains' },
  ],
  [Element.WATER]: [
    { name: 'Underwater Ruins', classes: 'bg-water-ruins' },
    { name: 'Swamplands', classes: 'bg-water-swamp' },
    { name: 'Coastline', classes: 'bg-water-coast' },
  ],
  // Hybrid elements can reuse or have specific biomes
  [Element.MAGMA]: [{ name: 'Magma Chamber', classes: 'bg-fire-magma-cave' }],
  [Element.OBSIDIAN]: [{ name: 'Obsidian Fields', classes: 'bg-earth-mines' }],
  [Element.FIRESTORM]: [{ name: 'Stormy Volcano', classes: 'bg-fire-volcanic' }],
  [Element.HOT_AIR]: [{ name: 'Scorched Desert', classes: 'bg-neutral-desert' }],
  [Element.STEAM]: [{ name: 'Geothermal Springs', classes: 'bg-water-coast' }],
  [Element.HOT_SPRINGS]: [{ name: 'Hot Springs Oasis', classes: 'bg-water-coast' }],
  [Element.SAND]: [{ name: 'Endless Dunes', classes: 'bg-neutral-desert' }],
  [Element.EROSION]: [{ name: 'Wind-sculpted Canyons', classes: 'bg-earth-mountains' }],
  [Element.MUD]: [{ name: 'Murky Bog', classes: 'bg-water-swamp' }],
  [Element.GROWTH]: [{ name: 'Overgrown Grotto', classes: 'bg-earth-lush-cave' }],
  [Element.ICE]: [{ name: 'Frozen Tundra', classes: 'bg-sky-800' }],
  [Element.STORM]: [{ name: 'Thunderous Skies', classes: 'bg-wind-stormy-peaks' }],
  [Element.VOLCANIC_STORM]: [{ name: 'Ash-filled Tempest', classes: 'bg-fire-volcanic' }],
  [Element.ELECTRIFIED_MUD]: [{ name: 'Shocking Mire', classes: 'bg-water-swamp' }],
  [Element.VITRIFIED_STORM]: [{ name: 'Glassy Tempest', classes: 'bg-wind-stormy-peaks' }],
};