import React from 'react';
import type { Character, Skill, Archetype, Item, Rarity, Enemy, GameEvent, EquipmentSlot, EventModifier, EventCard, ChoiceOption, Outcome, PlayerAbility, ItemAffix } from './types';
import { Element } from './types';

// Helper for creating simple, pixelated-style SVG icons
const createIcon = (paths: string[], color: string): React.FC => () => (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {paths.map((d, i) => <path key={i} d={d} fill={color} />)}
  </svg>
);

export const Icons = {
    Start: createIcon(["M7 1h2v1h1v1h1v1h1v2h-1v1h-1v1h-1v1H8v-1H7v-1H6v-1H5V5h1V4h1V2h1V1z"], "#a855f7"),
    Fire: createIcon(["M8 11v-1h1V9h-1V8h1V7h-1V5h1V4h-1V3h1V2h-1V1H7v1H6v1h1v1h-1v2h1v1h-1v1h1v1H6v1h1v1H6v1h4v-1h-1v-1H8z"], "#f97316"),
    Burn: createIcon(["M8 9H7V8h1V9z M9 8h-1v1h1V8z M8 7h1V6H8v1z M7 6h1V5H7v1z M6 8h1V7H6v1z M10 8V7h-1v1h1z M11 6h-1v1h1V6z M5 6v1h1V6H5z M8 11v-1h1v-1H8v-1H7v1H6v1h1v1h1z"], "#ef4444"),
    Earth: createIcon(["M13 10h-1V9h-1V8H5v1H4v1H3v1h1v1h1v1h6v-1h1v-1h1v-1z M8 8h1V7h1V6H6v1h1v1h1z"], "#22c55e"),
    Shield: createIcon(["M8 1C4 1 3 4 3 8s1 7 5 7 5-3 5-7-1-7-5-7zm0 1v1h1v1h1v2H9v1H7V6H5V4h1V3h1V2h1z"], "#16a34a"),
    Wind: createIcon(["M3 5h1V4h8v1h1v2h-1v1h-1v1H5V8H4V7H3V5z M10 8h1V7h-1v1z M5 7h1V6H5v1z"], "#0ea5e9"),
    Push: createIcon(["M4 7h1v2H4V7z M6 7h1v2H6V7z M8 7h1v2H8V7z M10 7h1v2h-1V7z M12 6h-1v4h1V6z"], "#38bdf8"),
    Water: createIcon(["M8 7C6 7 5 8 5 9s1 2 3 2 3-1 3-1-1-3-3-3z M8 13c-2 0-3-1-3-2s1-2 3-2v1c-1 0-1 0-1 1s0 1 1 1 1 0 1-1v-1c2 0 3 1 3 2s-1 2-3 2z"], "#3b82f6"),
    Slow: createIcon(["M8 15l-3-3h2V9h2v3h2l-3 3z M8 1l3 3h-2v3H7V4H5l3-3z"], "#60a5fa"),
    Poison: createIcon(["M8 1C5 1 3 3 3 6c0 1 0 1 1 2s1 2 3 3c2-1 2-2 3-3s1-1 1-2c0-3-2-5-5-5z M6 6h1v1H6V6z m3 0h1v1H9V6z M8 9c-1 0-1-1-1-1h2c0 0 0 1-1 1z"], "#84cc16"),
    // New status icons
    FullFlow: createIcon(["M8 7C6 7 5 8 5 9s1 2 3 2 3-1 3-1-1-3-3-3z M8 4l-2-2h1v2h2V2h1L8 4z"], "#22d3ee"),
    Overheat: createIcon(["M8 9v-1h1V7h-1V6h1V5h-1V4h1V3h-1V2h-1V1H6v1H5v1h1v1h-1v1h1v1h-1v1h1v1H5v1h1v1H5v1h6v-1h-1v-1H8z m0-2h1V6H8v1z", "M7 12h2v2H7v-2z"], "#fef08a"),
    Rooted: createIcon(["M8 13v-2H7v-1h2v1h-1v2H8z M6 10H5V8h1v2z m4 0h1V8h-1v2z M8 8H7V6h2v2h-1z M10 5h-1V4H7v1H6V4H5v2h1v1h4V6h1V4h-1v1z"], "#78350f"),
    Regenerating: createIcon(["M8 4l-1 2h2L8 4z M7 6v1h2V6H7z M6 8v1h4V8H6z M5 10v1h6v-1H5z"], "#4ade80"),
    // New Tier 1.5 Icons
    Fireball: createIcon(["M8 1c-2 2-3 4-3 6s1 4 3 4 3-2 3-4-1-4-3-6zm0 2c-1 1-1 2-1 3s0 2 1 3 1-2 1-3-0-2-1-3z"], "#f87171"),
    Earthquake: createIcon(["M2 8h2V7h1v2h2V7h2v2h2V7h1v1h2v1H2z M3 10h10v-1H3v1z"], "#a16207"),
    Cyclone: createIcon(["M8 4c-2 0-4 2-4 4h2c0-1 1-2 2-2s2 1 2 2h2c0-2-2-4-4-4z m0 8c2 0 4-2 4-4h-2c0 1-1 2-2 2s-2-1-2-2H4c0 2 2 4 4 4z"], "#38bdf8"),
    TidalWave: createIcon(["M2 8c1-1 2-2 4-2s3 1 4 2v2c-1 1-2 2-4 2s-3-1-4-2V8z M2 12h8v-1H2v1z"], "#60a5fa"),
    // Hybrid Icons
    Magma: createIcon(["M3 6h1v1h1v1h1v1h1v1h2v-1h1V9h1V8h1V7h1V6H3z M8 11V9h2v2H8z M6 11V9h2v2H6z"], "#d97706"),
    Obsidian: createIcon(["M8 1l-3 3h2v2h2V4h2L8 1z M1 8l3 3v-2h2v-2H4V5L1 8z m14 0l-3 3v-2h-2v-2h2V5l3 3z M8 15l3-3h-2v-2H7v2H5l3 3z"], "#1e293b"),
    Firestorm: createIcon(["M4 4h2v2H4V4z m6 0h2v2h-2V4z M4 10h2v2H4v-2z m6 1h2v1h-2v-1z M10 8h1v1h-1V8z m-5 1h1v1H5V9z M7 6h2v1H7V6z"], "#f59e0b"),
    HotAir: createIcon(["M4 4h2v1H4V4z M10 4h2v1h-2V4z M7 7h2v1H7V7z m-2 2h6v1H5V9z m-1 2h8v1H4v-1z"], "#fbbf24"),
    Steam: createIcon(["M4 4h2v1H4V4z M10 4h2v1h-2V4z M7 7h2v1H7V7z m-2 2h1v1H5V9z m5 0h1v1h-1V9z M4 12h8v1H4v-1z"], "#eab308"),
    HotSprings: createIcon(["M4 10v-1h1V8h1V7h4v1h1v1h1v1h-1v1H5v-1H4z m4-1c-1 1-1 1-1 1h2s0-1-1-1z"], "#fcd34d"),
    Sand: createIcon(["M4 6h1v1H4V6z m2 0h1v1H6V6z m3 0h1v1H9V6z M4 8h1v1H4V8z m2 0h1v1H6V8z m3 0h1v1H9V8z M4 10h1v1H4v-1z m2 0h1v1H6v-1z m3 0h1v1H9v-1z"], "#a16207"),
    Erosion: createIcon(["M12 4H4v1h8V4z m0 2H4v1h8V6z m0 3H4v1h8V9z m-2 2H6v1h4v-1z"], "#ca8a04"),
    Mud: createIcon(["M4 8v1h1v1h6V9h1V8H4z M6 11h4v1H6v-1z"], "#78350f"),
    Growth: createIcon(["M8 8H7v1H6v1h1v1h2v-1h1V9h-1V8z M8 5V2H7v3H5v1h2v1h1V6h2V5H8z"], "#4d7c0f"),
    Ice: createIcon(["M8 1l-2 2h1v3h2V3h1L8 1z M4 7l-2 2h1v3h2V9h1L4 7z m8 0l-2 2h1v3h2V9h1l-2-2z"], "#7dd3fc"),
    Storm: createIcon(["M12 8H4V7h8v1z M11 6H5V5h6v1z M13 10H3V9h10v1z M11 12H5v-1h6v1z"], "#0284c7"),
    VolcanicStorm: createIcon(["M8 1C4 1 3 4 3 8s1 7 5 7 5-3 5-7-1-7-5-7zm-2 4h1v1H6V5z m3 0h1v1H9V5z m-2 3h2v1H7V8z m-1 3h4v1H6v-1z"], "#dc2626"),
    ElectrifiedMud: createIcon(["M7 1v1h1v1h1v2H8v1H6V5h1V4h1V3H7V2H6V1h1z M10 10h-1v-1h-1v-1h-1v2h1v1h1v1h1v1h-1v-1h-1v-1h-1v-2h1V9h1v1h1v1h-1z"], "#a3e635"),
    VitrifiedStorm: createIcon(["M8 1l-3 4h2v3h2V5h2L8 1z m0 14l-3-4h2v-3h2v3h2l-3 4z"], "#2dd4bf"),
    EnemyGoblin: createIcon(["M7 5h2v1h1v3H9v1H7v-1H6V6h1V5z M7 10h2v1H7v-1z"], "#ef4444"),
    EnemyGolem: createIcon(["M4 12h8v-1h1V8h-1V5h-1V4H5v1H4v3H3v3h1v1z"], "#78716c"),
    EnemySprite: createIcon(["M8 4l-1 2h2L8 4z M6 7h4v1H6V7z M7 9h2v2H7V9z"], "#38bdf8"),
    EnemySlime: createIcon(["M4 12v-1h1v-1h1v-1h4v1h1v1h1v1H4z"], "#3b82f6"),
    // New Enemy Icons
    EnemyFireElemental: createIcon(["M8 1c-2 2-3 4-3 6s1 4 3 4 3-2 3-4-1-4-3-6zm0 1a2 2 0 011 2v1h-1v1H8V6H7V5a2 2 0 011-1z M6 13h4v1H6v-1z M5 15h6v1H5v-1z"], "#f87171"),
    EnemyRockTitan: createIcon(["M4 14h8v-1H4v1z M5 12h6v-1H5v1z M3 10h10V7h1V5h-1V4H4v1H3v2h1v3z M6 6h4v1H6V6z"], "#a8a29e"),
    EnemyStormSylph: createIcon(["M8 2L6 5h4L8 2z M4 7h8v1H4V7z M5 9h6v1H5V9z M7 11h2v3H7v-3z"], "#7dd3fc"),
    EnemyObsidianGolem: createIcon(["M4 14h8v-2H4v2zm1-3h6v-1H5v1zM3 10h10V7h1V4h-1V3H4v1H3v3h1v3zM6 5h4v1H6V5z"], "#475569"),
    EnemyElectrifiedSlime: createIcon(["M4 12v-1h1v-1h1v-1h4v1h1v1h1v1H4zm3-4h2v1h1v1H9V8H7V7h1V6H7v1z"], "#a3e635"),
    EnemyIceElemental: createIcon(["M8 1L6 4h4L8 1z M5 5h6v2H5V5zm-2 3h10v2H3V8zm2 3h6v3H5v-3z"], "#bae6fd"),
    EnemySandWurm: createIcon(["M2 8h2v1H2V8zm2 2h2v-1H4v1zm2 1h2V9H6v2zm2-1h2V8H8v2zm2-2h2V7h-2v1zm2 1h2V6h-2v2z"], "#d4a04e"),
    EnemyToxicTreant: createIcon(["M8 1L7 4H6v3h1v3h2V7h1V4H9L8 1zm-3 8h1v3H5v-3zm5 0h1v3h-1v-3z"], "#a3a327"),
    // New Icons for events
    CardDraw: createIcon(["M4 2h8v1H4V2z M3 4h10v8H3V4z M5 6h6v1H5V6z M5 8h6v1H5V8z"], "#facc15"),
    Choice: createIcon(["M7 1v1h1v1h1V2h1V1H9V0H7v1z M4 5h2v2H4V5z m6 0h2v2h-2V5z M4 9h8v2H4V9z"], "#9333ea"),
    Boon: createIcon(["M8 1l1 2h2l-2 1 1 2-2-1-2 1 1-2-2-1h2l1-2z M4 8h8v1H4V8z m0 2h8v1H4v-1z m0 2h8v1H4v-1z"], "#10b981"),
    Curse: createIcon(["M8 1C5 1 3 3 3 6c0 1 0 1 1 2s1 2 3 3c2-1 2-2 3-3s1-1 1-2c0-3-2-5-5-5z m0 2c1 0 1 1 1 2s-1 2-1 2-1-1-1-2 0-2 1-2z"], "#be123c"),
};

export const ItemVisuals = {
    // Helmets
    LeatherHelm: createIcon(["M4 7h8v1h1v1H3V8h1V7z M5 5h6v2H5V5z"], "#a16207"),
    IronHelm: createIcon(["M4 6h8v1H4V6z M5 4h6v2H5V4z M7 3h2v1H7V3z"], "#6b7280"),
    MagicHat: createIcon(["M3 8h10v1H3V8z M5 5h6v3H5V5z M7 3l2-2 2 2H7z"], "#9333ea"),
    // Weapons
    RustySword: createIcon(["M7 1h2v8H7V1z M6 9h4v1H6V9z M5 10h6v1H5v-1z M7 11h2v3H7v-3z"], "#a16207"),
    SteelSword: createIcon(["M7 0h2v10H7V0z M6 10h4v1H6v-1z M5 11h6v1H5v-1z M7 12h2v3H7v-3z"], "#e5e7eb"),
    MagicStaff: createIcon(["M7 2h2v12H7V2z M8 0l-1 1h-1v1h1l1-1 1 1h1V1h-1L8 0z"], "#3b82f6"),
    // Shields
    WoodShield: createIcon(["M4 3h8v10H4V3z M8 4v3H7v1h2V6h1V4H8z"], "#78350f"),
    IronShield: createIcon(["M3 2h10v12H3V2z M8 5h2v6H8V5z"], "#9ca3af"),
    // Armor
    LeatherArmor: createIcon(["M4 6h8v4H4V6z M5 5h6v1H5V5z M7 10h2v2H7v-2z"], "#854d0e"),
    IronArmor: createIcon(["M3 5h10v5H3V5z M4 4h8v1H4V4z M7 10h2v3H7v-3z"], "#d1d5d9"),
};

export const ELEMENT_ICONS: Record<Element, React.FC> = {
    [Element.NEUTRAL]: Icons.Start,
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

export const elementThemes = {
  [Element.NEUTRAL]: 'border-purple-500 bg-purple-500/10 text-purple-300',
  [Element.FIRE]: 'border-red-500 bg-red-500/10 text-red-300',
  [Element.EARTH]: 'border-green-500 bg-green-500/10 text-green-300',
  [Element.WIND]: 'border-sky-500 bg-sky-500/10 text-sky-300',
  [Element.WATER]: 'border-blue-500 bg-blue-500/10 text-blue-300',
  [Element.MAGMA]: 'border-orange-500 bg-orange-500/10 text-orange-300',
  [Element.OBSIDIAN]: 'border-slate-500 bg-slate-500/10 text-slate-300',
  [Element.FIRESTORM]: 'border-amber-500 bg-amber-500/10 text-amber-300',
  [Element.HOT_AIR]: 'border-yellow-500 bg-yellow-500/10 text-yellow-300',
  [Element.STEAM]: 'border-yellow-400 bg-yellow-400/10 text-yellow-200',
  [Element.HOT_SPRINGS]: 'border-rose-400 bg-rose-400/10 text-rose-200',
  [Element.SAND]: 'border-yellow-700 bg-yellow-700/10 text-yellow-500',
  [Element.EROSION]: 'border-amber-700 bg-amber-700/10 text-amber-500',
  [Element.MUD]: 'border-stone-600 bg-stone-600/10 text-stone-400',
  [Element.GROWTH]: 'border-lime-600 bg-lime-600/10 text-lime-400',
  [Element.ICE]: 'border-cyan-400 bg-cyan-400/10 text-cyan-200',
  [Element.STORM]: 'border-indigo-500 bg-indigo-500/10 text-indigo-300',
  [Element.VOLCANIC_STORM]: 'border-red-600 bg-red-600/10 text-red-200 shadow-red-500/50',
  [Element.ELECTRIFIED_MUD]: 'border-lime-500 bg-lime-500/10 text-lime-200 shadow-lime-400/50',
  [Element.VITRIFIED_STORM]: 'border-teal-500 bg-teal-500/10 text-teal-200 shadow-teal-400/50',
};

export const ARCHETYPES: Archetype[] = [
  {
    name: 'Pyromanten',
    description: 'En aggressiv magiker som fokuserar på rå skada och att bränna fiender över tid.',
    element: Element.FIRE,
    icon: Icons.Fire,
    statBonuses: { intelligence: 3, dexterity: 2 },
    startingSkill: 'fire_1',
    resourceName: 'Hetta',
  },
  {
    name: 'Stenväktaren',
    description: 'En tålig och orubblig försvarare som skyddar sig själv och allierade med stenhård magi.',
    element: Element.EARTH,
    icon: Icons.Earth,
    statBonuses: { constitution: 3, strength: 2 },
    startingSkill: 'earth_1',
    resourceName: 'Styrka',
  },
  {
    name: 'Stormdansaren',
    description: 'En snabb och undflyende kämpe som använder vinden för att kontrollera slagfältet.',
    element: Element.WIND,
    icon: Icons.Wind,
    statBonuses: { dexterity: 3, intelligence: 2 },
    startingSkill: 'wind_1',
    resourceName: 'Energi',
  },
  {
    name: 'Tidvattenvävaren',
    description: 'En anpassningsbar strateg som manipulerar livskraft och saktar ner fiender med vatten.',
    element: Element.WATER,
    icon: Icons.Water,
    statBonuses: { intelligence: 3, constitution: 2 },
    startingSkill: 'water_1',
    resourceName: 'Flöde',
  },
];

export const INITIAL_CHARACTER_BASE: Omit<Character, 'name' | 'archetype'> = {
  level: 1,
  stats: {
    strength: 5,
    dexterity: 5,
    intelligence: 5,
    constitution: 5,
  },
  resources: {
    health: { current: 100, max: 100 },
    aether: { name: 'Aether', current: 50, max: 50 },
  },
  experience: {
    current: 0,
    max: 100,
  },
};

export const SKILL_TREE_DATA: Skill[] = [
  // Start
  {
    id: 'start', name: 'Start', description: 'Utgångspunkten för din resa.',
    icon: Icons.Start, x: 14, y: 8, element: Element.NEUTRAL, maxRank: 1,
  },

  // Tier 1: Base Elements
  {
    id: 'fire_1', name: 'Gnista', description: 'En grundläggande eldattack. Starten på vägen mot aggression.',
    dependencies: ['start'], icon: Icons.Fire, x: 10, y: 3, element: Element.FIRE, maxRank: 5,
  },
  {
    id: 'earth_1', name: 'Stenhud', description: 'Ökar ditt försvar. Starten på vägen mot tålighet.',
    dependencies: ['start'], icon: Icons.Earth, x: 10, y: 13, element: Element.EARTH, maxRank: 5,
  },
  {
    id: 'wind_1', name: 'Lätt Brisa', description: 'Ökar din rörelsehastighet. Starten på vägen mot rörlighet.',
    dependencies: ['start'], icon: Icons.Wind, x: 18, y: 3, element: Element.WIND, maxRank: 5,
  },
  {
    id: 'water_1', name: 'Läkande Droppe', description: 'En mindre läkande förmåga. Starten på vägen mot kontroll.',
    dependencies: ['start'], icon: Icons.Water, x: 18, y: 13, element: Element.WATER, maxRank: 5,
  },
  
  // Tier 1.5: Deeper Base Elements (NEW)
  {
    id: 'fire_3', name: 'Eldklot', description: 'Fokuserar din eld till ett destruktivt klot.',
    dependencies: ['fire_1'], icon: Icons.Fireball, x: 6, y: 3, element: Element.FIRE, maxRank: 3,
  },
  {
    id: 'earth_3', name: 'Jordskalv', description: 'Skaka marken för att skada och hindra fiender.',
    dependencies: ['earth_1'], icon: Icons.Earthquake, x: 6, y: 13, element: Element.EARTH, maxRank: 3,
  },
  {
    id: 'wind_3', name: 'Cyklon', description: 'En virvlande vind som skär dina motståndare.',
    dependencies: ['wind_1'], icon: Icons.Cyclone, x: 22, y: 3, element: Element.WIND, maxRank: 3,
  },
  {
    id: 'water_3', name: 'Tidvattenvåg', description: 'En våg av vatten som slår omkull dina fiender.',
    dependencies: ['water_1'], icon: Icons.TidalWave, x: 22, y: 13, element: Element.WATER, maxRank: 3,
  },

  // Tier 1.75: Specialized Base Elements
  {
    id: 'fire_2', name: 'Brännande Smärta', description: 'Attacker har en chans att applicera en skada-över-tid (DoT) effekt.',
    dependencies: ['fire_3'], icon: Icons.Burn, x: 2, y: 3, element: Element.FIRE, maxRank: 3,
  },
  {
    id: 'earth_2', name: 'Sköldblock', description: 'Förbättrar din förmåga att stå emot attacker.',
    dependencies: ['earth_3'], icon: Icons.Shield, x: 2, y: 13, element: Element.EARTH, maxRank: 3,
  },
  {
    id: 'wind_2', name: 'Vindstöt', description: 'En attack som knuffar tillbaka fiender för att skapa avstånd.',
    dependencies: ['wind_3'], icon: Icons.Push, x: 26, y: 3, element: Element.WIND, maxRank: 3,
  },
  {
    id: 'water_2', name: 'Nedkylning', description: 'Attacker har en chans att sakta ner fiender.',
    dependencies: ['water_3'], icon: Icons.Slow, x: 26, y: 13, element: Element.WATER, maxRank: 3,
  },

  // Tier 2: Hybrid Elements (Re-aligned)
  {
    id: 'magma', name: 'Magma', description: 'Långsam, tung områdesskada. Kräver Eld och Jord.',
    dependencies: ['fire_2', 'earth_2'], icon: Icons.Magma, x: 2, y: 8, element: Element.MAGMA, maxRank: 5,
  },
  {
    id: 'obsidian', name: 'Obsidian', description: 'Ett bestraffande försvar som skadar anfallare. Kräver Jord och Eld.',
    dependencies: ['earth_2', 'fire_2'], icon: Icons.Obsidian, x: 4, y: 5, element: Element.OBSIDIAN, maxRank: 3,
  },
  {
    id: 'firestorm', name: 'Eldstorm', description: 'Snabba, breda attacker av eld och vind. Kräver Eld och Vind.',
    dependencies: ['fire_2', 'wind_2'], icon: Icons.Firestorm, x: 10, y: 1, element: Element.FIRESTORM, maxRank: 5,
  },
  {
    id: 'hot_air', name: 'Hetluft', description: 'Försvagar fienders attacker med en skållhet vind. Kräver Vind och Eld.',
    dependencies: ['wind_2', 'fire_2'], icon: Icons.HotAir, x: 18, y: 1, element: Element.HOT_AIR, maxRank: 3,
  },
  {
    id: 'steam', name: 'Ånga', description: 'Explosiv områdesskada från skållhet ånga. Kräver Eld och Vatten.',
    dependencies: ['fire_2', 'water_2'], icon: Icons.Steam, x: 10, y: 5, element: Element.STEAM, maxRank: 5,
  },
  {
    id: 'hot_springs', name: 'Varma Källor', description: 'Skapar ett område som läker allierade över tid. Kräver Vatten och Eld.',
    dependencies: ['water_2', 'fire_2'], icon: Icons.HotSprings, x: 18, y: 11, element: Element.HOT_SPRINGS, maxRank: 3,
  },
  {
    id: 'sand', name: 'Sand', description: 'Mobil områdeskontroll som skadar över tid. Kräver Jord och Vind.',
    dependencies: ['earth_2', 'wind_2'], icon: Icons.Sand, x: 18, y: 5, element: Element.SAND, maxRank: 5,
  },
  {
    id: 'erosion', name: 'Erosion', description: 'Försvagar fienders försvar permanent. Kräver Vind och Jord.',
    dependencies: ['wind_2', 'earth_2'], icon: Icons.Erosion, x: 10, y: 11, element: Element.EROSION, maxRank: 3,
  },
  {
    id: 'mud', name: 'Lera', description: 'Fångande hinder som saktar och stoppar fiender. Kräver Jord och Vatten.',
    dependencies: ['earth_2', 'water_2'], icon: Icons.Mud, x: 10, y: 15, element: Element.MUD, maxRank: 5,
  },
  {
    id: 'growth', name: 'Tillväxt', description: 'Skyddande och helande växtlighet. Kräver Vatten och Jord.',
    dependencies: ['water_2', 'earth_2'], icon: Icons.Growth, x: 18, y: 15, element: Element.GROWTH, maxRank: 3,
  },
  {
    id: 'ice', name: 'Issplitter', description: 'Vassa projektiler av is som fryser fiender. Kräver Vind och Vatten.',
    dependencies: ['wind_2', 'water_2'], icon: Icons.Ice, x: 24, y: 5, element: Element.ICE, maxRank: 5,
  },
  {
    id: 'storm', name: 'Storm', description: 'Massiv områdeskontroll och förflyttning av fiender. Kräver Vatten och Vind.',
    dependencies: ['water_2', 'wind_2'], icon: Icons.Storm, x: 26, y: 8, element: Element.STORM, maxRank: 3,
  },

  // Tier 3: Ultimate Hybrids
  {
    id: 'volcanic_storm', name: 'Vulkanisk Storm', description: 'En rasande tornado som slungar ut brinnande stenbumlingar. Kräver Magma och Storm.',
    dependencies: ['magma', 'storm'], icon: Icons.VolcanicStorm, x: 14, y: 5, element: Element.VOLCANIC_STORM, maxRank: 1,
  },
  {
    id: 'electrified_mud', name: 'Elektrifierad Lera', description: 'Ett fält av lera som saktar och skadar med blixtar. Kräver Eldstorm och Lera.',
    dependencies: ['firestorm', 'mud'], icon: Icons.ElectrifiedMud, x: 12, y: 8, element: Element.ELECTRIFIED_MUD, maxRank: 1,
  },
  {
    id: 'vitrified_storm', name: 'Förglasad Storm', description: 'En het storm som smälter sand till ett fält av vasst glas. Kräver Sand och Ånga.',
    dependencies: ['sand', 'steam'], icon: Icons.VitrifiedStorm, x: 16, y: 8, element: Element.VITRIFIED_STORM, maxRank: 1,
  },
];

export const PLAYER_ABILITIES: Record<string, PlayerAbility> = {
  'fire_1': { 
    id: 'fire_1', name: 'Gnista', element: Element.FIRE, category: 'damage',
    ranks: [
      { description: 'En liten gnista. Genererar 10 Hetta.', resourceCost: 10, damageMultiplier: 1.0 },
      { description: 'En större gnista. Genererar 12 Hetta.', resourceCost: 12, damageMultiplier: 1.1 },
      { description: 'En stark låga. Genererar 14 Hetta.', resourceCost: 14, damageMultiplier: 1.2 },
      { description: 'En intensiv låga. Genererar 16 Hetta.', resourceCost: 16, damageMultiplier: 1.3 },
      { description: 'En rasande eld. Genererar 20 Hetta.', resourceCost: 20, damageMultiplier: 1.5 },
    ]
  },
  'fire_3': {
    id: 'fire_3', name: 'Eldklot', element: Element.FIRE, category: 'damage',
    ranks: [
      { description: 'Ett klot av eld. Genererar 25 Hetta.', resourceCost: 25, damageMultiplier: 1.8 },
      { description: 'Ett större eldklot. Genererar 28 Hetta.', resourceCost: 28, damageMultiplier: 2.1 },
      { description: 'Ett massivt eldklot. Genererar 30 Hetta.', resourceCost: 30, damageMultiplier: 2.5 },
    ]
  },
  'fire_2': {
    id: 'fire_2', name: 'Antända', element: Element.FIRE, category: 'damage',
    ranks: [
      { description: 'Sätter fienden i brand. Genererar 15 Hetta.', resourceCost: 15, damageMultiplier: 0.5, dotDamage: 3 },
      { description: 'Bränner intensivt. Genererar 18 Hetta.', resourceCost: 18, damageMultiplier: 0.6, dotDamage: 5 },
      { description: 'En inferno av smärta. Genererar 20 Hetta.', resourceCost: 20, damageMultiplier: 0.7, dotDamage: 8 },
    ]
  },
  'earth_1': {
    id: 'earth_1', name: 'Stenhud', element: Element.EARTH, category: 'buff',
    ranks: [
        { description: 'Ökar rustning i 2 rundor. Kostar 10 Styrka.', resourceCost: 10, duration: 2 },
        { description: 'Ökar rustning i 3 rundor. Kostar 12 Styrka.', resourceCost: 12, duration: 3 },
        { description: 'Ökar rustning i 3 rundor. Kostar 15 Styrka.', resourceCost: 15, duration: 3 },
        { description: 'Ökar rustning i 4 rundor. Kostar 18 Styrka.', resourceCost: 18, duration: 4 },
        { description: 'Blir som levande sten i 4 rundor. Kostar 20 Styrka.', resourceCost: 20, duration: 4 },
    ]
   },
  'earth_3': {
    id: 'earth_3', name: 'Jordskalv', element: Element.EARTH, category: 'cc',
    ranks: [
        { description: 'Skakar marken, skadar och saktar ner. Kostar 20 Styrka.', resourceCost: 20, damageMultiplier: 0.8, duration: 2 },
        { description: 'Ett kraftigare skalv. Kostar 22 Styrka.', resourceCost: 22, damageMultiplier: 1.0, duration: 3 },
        { description: 'Får marken att rämna. Kostar 25 Styrka.', resourceCost: 25, damageMultiplier: 1.2, duration: 3 },
    ]
  },
  'wind_1': { 
    id: 'wind_1', name: 'Hastighet', element: Element.WIND, category: 'buff',
    ranks: [
      { description: 'Ökar ATB-hastighet i 2 rundor. Kostar 20 Energi.', resourceCost: 20, duration: 2},
      { description: 'Ökar ATB-hastighet i 3 rundor. Kostar 25 Energi.', resourceCost: 25, duration: 3},
      { description: 'Ökar ATB-hastighet i 4 rundor. Kostar 30 Energi.', resourceCost: 30, duration: 4},
      { description: 'Rör dig som vinden i 4 rundor. Kostar 28 Energi.', resourceCost: 28, duration: 4},
      { description: 'Bli ett med stormen i 5 rundor. Kostar 25 Energi.', resourceCost: 25, duration: 5},
    ]
  },
  'wind_3': {
    id: 'wind_3', name: 'Cyklon', element: Element.WIND, category: 'damage',
    ranks: [
      { description: 'En snabb vindattack. Kostar 18 Energi.', resourceCost: 18, damageMultiplier: 1.2 },
      { description: 'En skärande cyklon. Kostar 22 Energi.', resourceCost: 22, damageMultiplier: 1.5 },
      { description: 'En rasande tornado. Kostar 25 Energi.', resourceCost: 25, damageMultiplier: 1.8 },
    ]
  },
  'water_1': { 
    id: 'water_1', name: 'Läka', element: Element.WATER, category: 'heal',
    ranks: [
      { description: 'Återställer 20% hälsa. Bygger 20 Flöde.', resourceCost: 0, healMultiplier: 0.20 },
      { description: 'Återställer 25% hälsa. Bygger 25 Flöde.', resourceCost: 0, healMultiplier: 0.25 },
      { description: 'Återställer 30% hälsa. Bygger 30 Flöde.', resourceCost: 0, healMultiplier: 0.30 },
      { description: 'Återställer 35% hälsa. Bygger 35 Flöde.', resourceCost: 0, healMultiplier: 0.35 },
      { description: 'Återställer 40% hälsa. Bygger 40 Flöde.', resourceCost: 0, healMultiplier: 0.40 },
    ]
   },
   'water_3': {
    id: 'water_3', name: 'Tidvattenvåg', element: Element.WATER, category: 'cc',
    ranks: [
      { description: 'En våg skadar och saktar ner. Bygger 15 Flöde.', resourceCost: 0, damageMultiplier: 0.6, duration: 2 },
      { description: 'En större våg. Bygger 20 Flöde.', resourceCost: 0, damageMultiplier: 0.8, duration: 2 },
      { description: 'En tsunami. Bygger 25 Flöde.', resourceCost: 0, damageMultiplier: 1.0, duration: 3 },
    ]
  },
  'magma': { 
    id: 'magma', name: 'Magma Armor', element: Element.MAGMA, category: 'buff',
    ranks: [{ description: 'Ger försvar och skadar anfallare. Genererar Hetta / Kostar Styrka.', resourceCost: 25 }]
  },
  'sand': { 
    id: 'sand', name: 'Sandstorm', element: Element.SAND, isAoe: true, category: 'cc',
    ranks: [{ description: 'Skadar alla fiender och sänker deras träffsäkerhet. Kostar Styrka / Energi.', resourceCost: 30 }]
  },
  'ice': { 
    id: 'ice', name: 'Issplitter', element: Element.ICE, category: 'cc',
    ranks: [{ description: 'Skadar och saktar ner en fiende. Kostar Energi / Bygger Flöde.', resourceCost: 25 }]
  },
  'mud': {
    id: 'mud', name: 'Lerfälla', element: Element.MUD, category: 'cc',
    ranks: [{ description: 'Skadar lätt, saktar ner och kan rota en fiende. Kostar Styrka / Bygger Flöde.', resourceCost: 20 }]
  },
  'growth': { 
    id: 'growth', name: 'Tillväxt', element: Element.GROWTH, category: 'heal',
    ranks: [{ description: 'Ger dig regenerering i flera rundor. Kostar Styrka / Bygger Flöde.', resourceCost: 30 }]
  },
};

// --- Item Generation ---
const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const ITEM_AFFIXES: ItemAffix[] = [
    {
        trigger: 'ON_HIT',
        effect: { type: 'DEAL_ELEMENTAL_DAMAGE', element: Element.FIRE, damage: 5, chance: 15 },
        description: '15% chans vid träff: Bränner målet för 5 extra eldskada.'
    },
    {
        trigger: 'ON_HIT',
        effect: { type: 'DEAL_ELEMENTAL_DAMAGE', element: Element.STORM, damage: 8, chance: 10 },
        description: '10% chans vid träff: En blixt slår ner och ger 8 stormskada.'
    },
    {
        trigger: 'ON_TAKE_DAMAGE',
        effect: { type: 'DEAL_ELEMENTAL_DAMAGE', element: Element.EARTH, damage: 10, chance: 20 },
        description: '20% chans när du träffas: Jordens kraft slår tillbaka för 10 skada.'
    },
    {
        trigger: 'ON_HIT',
        effect: { type: 'APPLY_STATUS', status: { type: 'poisoned', duration: 3, damage: 3 }, chance: 10 },
        description: '10% chans vid träff: Förgiftar målet.'
    },
];

export const generateRandomItem = (level: number = 1): Item => {
    const itemNames = {
        'Hjälm': ['Kask', 'Hjälm', 'Krona', 'Huva'], 'Bröst': ['Harnesk', 'Brynja', 'Väst', 'Rustning'],
        'Vapen 1': ['Svärd', 'Yxa', 'Spira', 'Dolk'], 'Vapen 2': ['Sköld', 'Trollstav', 'Fokus'],
        'Stövlar': ['Stövlar', 'Skor', 'Benskydd'], 'Handskar': ['Handskar', 'Vantar'], 'Bälte': ['Bälte', 'Gördel'], 'Byxor': ['Byxor', 'Benplåtar']
    };
    const itemIcons = {
        'Hjälm': Icons.Shield, 'Bröst': Icons.Earth, 'Vapen 1': Icons.Fire, 'Vapen 2': Icons.Obsidian,
        'Stövlar': Icons.Wind, 'Handskar': Icons.Push, 'Bälte': Icons.Erosion, 'Byxor': Icons.Mud
    };
    const allSlots = Object.keys(itemNames) as (keyof typeof itemNames)[];

    const slot = getRandom(allSlots);
    const name = getRandom(itemNames[slot]);
    const randRarity = Math.random();
    const rarity: Rarity = randRarity > 0.98 ? 'Legendarisk' : randRarity > 0.85 ? 'Sällsynt' : randRarity > 0.6 ? 'Magisk' : 'Vanlig';
    
    const stats: Item['stats'] = {};
    const basePoints = rarity === 'Legendarisk' ? 15 : rarity === 'Sällsynt' ? 10 : rarity === 'Magisk' ? 5 : 2;
    const statPoints = basePoints + Math.floor(level / 2);

    for(let i = 0; i < statPoints / 2; i++) {
        const statType = ['strength', 'dexterity', 'intelligence', 'constitution', 'skada', 'rustning'][Math.floor(Math.random() * 6)] as keyof Item['stats'];
        stats[statType] = (stats[statType] || 0) + Math.ceil(Math.random() * (1 + statPoints/5));
    }
    
    const visualPools: Partial<Record<EquipmentSlot, React.FC[]>> = {
        'Hjälm': [ItemVisuals.LeatherHelm, ItemVisuals.IronHelm, ItemVisuals.MagicHat],
        'Bröst': [ItemVisuals.LeatherArmor, ItemVisuals.IronArmor],
        'Vapen 1': [ItemVisuals.RustySword, ItemVisuals.SteelSword, ItemVisuals.MagicStaff],
        'Vapen 2': [ItemVisuals.WoodShield, ItemVisuals.IronShield],
    };

    const visual = visualPools[slot] ? getRandom(visualPools[slot] as React.FC[]) : undefined;

    let affix: ItemAffix | undefined = undefined;
    if ((rarity === 'Sällsynt' && Math.random() < 0.25) || rarity === 'Legendarisk') {
        affix = getRandom(ITEM_AFFIXES);
    }

    return { id: `item-${Date.now()}-${Math.random()}`, name: `${name} (Lvl ${level})`, slot, rarity, stats, icon: itemIcons[slot], visual, affix };
};

// --- New Event Card System ---

export const ENEMY_TEMPLATES: Record<string, {
    name: string;
    icon: React.FC;
    element: Element;
    stats: { baseHealth: number; baseDamage: number; baseArmor: number; };
    resistances?: Partial<Record<Element, number>>;
    ability?: 'HASTE_SELF';
    onHitEffect?: Enemy['onHitEffect'];
}> = {
    // Tier 1
    'fire_goblin': { name: "Eld-ande", icon: Icons.EnemyGoblin, element: Element.FIRE, stats: { baseHealth: 20, baseDamage: 5, baseArmor: 1 }, resistances: { [Element.FIRE]: 25, [Element.WATER]: -25, [Element.NEUTRAL]: 0 } },
    'earth_golem_weak': { name: "Stengolem", icon: Icons.EnemyGolem, element: Element.EARTH, stats: { baseHealth: 30, baseDamage: 3, baseArmor: 3 }, resistances: { [Element.EARTH]: 50, [Element.WIND]: -25, [Element.NEUTRAL]: 10 } },
    'wind_sylph': { name: "Luft-sylf", icon: Icons.EnemySprite, element: Element.WIND, stats: { baseHealth: 15, baseDamage: 4, baseArmor: 0 }, resistances: { [Element.WIND]: 25, [Element.EARTH]: -25, [Element.NEUTRAL]: 0 } },
    'water_slime': { name: "Vattenslem", icon: Icons.EnemySlime, element: Element.WATER, stats: { baseHealth: 25, baseDamage: 3, baseArmor: 2 }, resistances: { [Element.WATER]: 50, [Element.FIRE]: -25, [Element.NEUTRAL]: 0 } },
    
    // Tier 2
    'fire_elemental': { 
        name: "Eldelemental", 
        icon: Icons.EnemyFireElemental, 
        element: Element.FIRE, 
        stats: { baseHealth: 35, baseDamage: 4, baseArmor: 2 },
        resistances: { [Element.FIRE]: 75, [Element.WATER]: -50 },
        onHitEffect: { type: 'burning', duration: 3, damage: 3 }
    },
    'earth_golem': { 
        name: "Jordgolem", 
        icon: Icons.EnemyRockTitan, 
        element: Element.EARTH, 
        stats: { baseHealth: 50, baseDamage: 5, baseArmor: 8 },
        resistances: { [Element.EARTH]: 75, [Element.WIND]: -25, [Element.NEUTRAL]: 20 },
    },
    'wind_sprite': {
        name: "Vindspritt",
        icon: Icons.EnemyStormSylph,
        element: Element.WIND,
        stats: { baseHealth: 22, baseDamage: 7, baseArmor: 1 },
        resistances: { [Element.WIND]: 50, [Element.EARTH]: -50 },
        ability: 'HASTE_SELF'
    },
    'magma_elemental': {
        name: "Magmaelemental",
        icon: Icons.EnemyFireElemental,
        element: Element.MAGMA,
        stats: { baseHealth: 40, baseDamage: 6, baseArmor: 5},
        resistances: { [Element.FIRE]: 50, [Element.EARTH]: 25, [Element.WATER]: -75 },
        onHitEffect: { type: 'burning', duration: 2, damage: 2}
    },
    // New Tier 2/3 Hybrid Enemies
    'obsidian_golem': {
        name: "Obsidiangolem",
        icon: Icons.EnemyObsidianGolem,
        element: Element.OBSIDIAN,
        stats: { baseHealth: 60, baseDamage: 8, baseArmor: 12 },
        resistances: { [Element.FIRE]: 25, [Element.EARTH]: 25, [Element.WIND]: -50, [Element.NEUTRAL]: 30 },
        onHitEffect: { type: 'slow', duration: 2 }
    },
    'electrified_slime': {
        name: "Elektrifierat slem",
        icon: Icons.EnemyElectrifiedSlime,
        element: Element.ELECTRIFIED_MUD,
        stats: { baseHealth: 30, baseDamage: 6, baseArmor: 3 },
        resistances: { [Element.WATER]: 25, [Element.WIND]: 25, [Element.FIRE]: -50 },
        onHitEffect: { type: 'poison', duration: 3, damage: 3 }
    },
    'ice_elemental': {
        name: "Iselemental",
        icon: Icons.EnemyIceElemental,
        element: Element.ICE,
        stats: { baseHealth: 25, baseDamage: 5, baseArmor: 2 },
        resistances: { [Element.WATER]: 50, [Element.WIND]: 25, [Element.FIRE]: -75 },
        onHitEffect: { type: 'slow', duration: 4 }
    },
    'sand_wurm': {
        name: "Sandorm",
        icon: Icons.EnemySandWurm,
        element: Element.SAND,
        stats: { baseHealth: 45, baseDamage: 10, baseArmor: 1 },
        resistances: { [Element.EARTH]: 50, [Element.WIND]: 25, [Element.WATER]: -50 },
        onHitEffect: { type: 'poison', duration: 2, damage: 5 } // Themed as 'bleed'
    },
    'toxic_treant': {
        name: "Giftig treant",
        icon: Icons.EnemyToxicTreant,
        element: Element.GROWTH,
        stats: { baseHealth: 50, baseDamage: 7, baseArmor: 6 },
        resistances: { [Element.EARTH]: 25, [Element.WATER]: 25, [Element.FIRE]: -50, [Element.NEUTRAL]: 15 },
        onHitEffect: { type: 'poison', duration: 5, damage: 2 }
    },
    // BOSSES
    'magma_overlord': {
        name: "Magma Härskare",
        icon: Icons.VolcanicStorm,
        element: Element.MAGMA,
        stats: { baseHealth: 150, baseDamage: 15, baseArmor: 10 },
        resistances: { [Element.FIRE]: 90, [Element.EARTH]: 50, [Element.WATER]: -100, [Element.NEUTRAL]: 25 },
        onHitEffect: { type: 'burning', duration: 4, damage: 5 }
    }
};

// Fix: Add export
export const createCombatPayload = (playerLevel: number, element: Element, difficulty: 'easy' | 'medium' | 'hard', round: number = 1): GameEvent => {
    const possibleEnemies = Object.values(ENEMY_TEMPLATES).filter(e => e.element === element);
    const template = possibleEnemies.length > 0 
        ? possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)] 
        : ENEMY_TEMPLATES['fire_goblin']; // Fallback

    const levelMultiplier = 1 + (playerLevel - 1) * 0.2 + (round - 1) * 0.1;
    const difficultyMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.3 : 1.0;
    const enemyCount = difficulty === 'easy' ? 1 : difficulty === 'hard' ? 3 : 2;

    const enemies: Enemy[] = Array.from({ length: enemyCount }).map((_, i) => ({
        id: `enemy-${Date.now()}-${i}`,
        name: template.name,
        level: playerLevel,
        element: template.element,
        icon: template.icon,
        ability: template.ability,
        onHitEffect: template.onHitEffect,
        resistances: template.resistances,
        stats: {
            health: Math.floor(template.stats.baseHealth * levelMultiplier * difficultyMultiplier),
            maxHealth: Math.floor(template.stats.baseHealth * levelMultiplier * difficultyMultiplier),
            damage: Math.floor(template.stats.baseDamage * levelMultiplier * difficultyMultiplier),
            armor: Math.floor(template.stats.baseArmor * levelMultiplier * difficultyMultiplier),
        }
    }));
    
    const modifiers: EventModifier[] = [];
    if (element === Element.MAGMA && Math.random() < 0.25) {
        modifiers.push({
            description: "Luften är tjock av aska och glöd. Alla tar 2 eldskada varje runda.",
            effect: 'environment_dot',
            value: 2,
        });
    }

    return {
        title: "Strid!",
        description: `Du attackeras av ${enemyCount} ${template.name}!`,
        element: template.element,
        enemies,
        modifiers,
        rewards: {
            xp: Math.floor(50 * enemyCount * difficultyMultiplier * levelMultiplier),
            items: Math.random() < (0.2 * difficultyMultiplier) ? [generateRandomItem(playerLevel)] : [],
        }
    };
};

// Fix: Add export
export const createBossCombatPayload = (playerLevel: number, round: number = 1): GameEvent => {
    const template = ENEMY_TEMPLATES['magma_overlord']; // In the future, this could be a random boss
    
    const levelMultiplier = 1 + (playerLevel - 1) * 0.25 + (round - 1) * 0.15;

    const boss: Enemy = {
        id: `boss-${Date.now()}`,
        name: template.name,
        level: playerLevel,
        element: template.element,
        icon: template.icon,
        onHitEffect: template.onHitEffect,
        resistances: template.resistances,
        stats: {
            health: Math.floor(template.stats.baseHealth * levelMultiplier),
            maxHealth: Math.floor(template.stats.baseHealth * levelMultiplier),
            damage: Math.floor(template.stats.baseDamage * levelMultiplier),
            armor: Math.floor(template.stats.baseArmor * levelMultiplier),
        }
    };

    return {
        title: "BOSS-STRID!",
        description: `Du möter den mäktiga ${template.name}!`,
        element: template.element,
        enemies: [boss],
        modifiers: [],
        rewards: {
            xp: Math.floor(300 * levelMultiplier),
            items: [generateRandomItem(playerLevel), generateRandomItem(playerLevel)],
        }
    };
};