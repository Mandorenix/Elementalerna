import React from 'react';
import type { Character, Skill, Archetype, Item, Rarity, Enemy, GameEvent, EquipmentSlot, EventModifier, EventCard, ChoiceOption, Outcome, PlayerAbility, ItemAffix, ElementalBonus, Environment, PassiveTalent, UltimateAbility } from './types';
import { Element } from './types';

// Helper for creating simple, pixelated-style SVG icons
const createIcon = (paths: string[], color: string): React.FC => () => (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {paths.map((d, i) => <path key={i} d={d} fill={color} />)}
  </svg>
);

export const Icons = {
    Start: createIcon(["M7 1h2v1h1v1h1v1h1v2h-1v1h-1v1h-1v1H8v-1H7v-1H6v-1H5V5h1V4h1V2h1V1z"], "#a855f7"),
    Fire: createIcon(["M8 11v-1h1V9h-1V8h1V7h-1V5h1V4h-1V3h1V2h-1V1H7v1H6v1h1v1h-1v2h1v1h-1v1h1v1H6v1h4v-1h-1v-1H8z"], "#f97316"),
    Burn: createIcon(["M8 9H7V8h1V9z M9 8h-1v1h1V8z M8 7h1V6H8v1z M7 6h1V5H7v1z M6 8h1V7H6v1z M10 8V7h-1v1h1z M11 6h-1v1h1V6z M5 6v1h1V6H5z M8 11v-1h1v-1H8v-1H7v1H6v1h1v1h1z"], "#ef4444"),
    Earth: createIcon(["M13 10h-1V9h-1V8H5v1H4v1H3v1h1v1h1v1h6v-1h1v-1h1v-1z M8 8h1V7h1V6H6v1h1v1h1z"], "#22c55e"),
    Shield: createIcon(["M8 1C4 1 3 4 3 8s1 7 5 7 5-3 5-7-1-7-5-7zm0 1v1h1v1h1v2H9v1H7V6H5V4h1V3h1V2h1z"], "#16a34a"),
    Wind: createIcon(["M3 5h1V4h8v1h1v2h-1v1h-1v1H5V8H4V7H3V5z M10 8h1V7h-1v1z M5 7h1V6H5v1z"], "#0ea5e9"),
    Push: createIcon(["M4 7h1v2H4V7z M6 7h1v2H6V7z M8 7h1v2H8V7z M10 7h1v2h-1V7z M12 6h-1v4h1V6z"], "#38bdf8"),
    Water: createIcon(["M8 7C6 7 5 8 5 9s1 2 3 2 3-1 3-1-1-3-3-3z M8 13c-2 0-3-1-3-2s1-2 3-2v1c-1 0-1 0-1 1s0 1 1 1 1 0 1-1v-1c2 0 3 1 3 2s-1 2-3 2z"], "#3b82f6"),
    Slow: createIcon(["M8 15l-3-3h2V9h2v3h2l-3 3z M8 1l3 3h-2V7H7V4H5l3-3z"], "#60a5fa"),
    Poison: createIcon(["M8 1C5 1 3 3 3 6c0 1 0 1 1 2s1 2 3 3c2-1 2-2 3-3s1-1 1-2c0-3-2-5-5-5z M6 6h1v1H6V6z m3 0h1v1H9V6z M8 9c-1 0-1-1-1-1h2c0 0 0 1-1 1z"], "#84cc16"),
    // New status icons
    FullFlow: createIcon(["M8 7C6 7 5 8 5 9s1 2 3 2 3-1 3-1-1-3-3-3z M8 4l-2-2h1v2h2V2h1L8 4z"], "#22d3ee"),
    Overheat: createIcon(["M8 9v-1h1V7h-1V6h1V5h-1V4h1V3h-1V2h-1V1H6v1H5v1h1v1h-1v1h1v1h-1v1h1v1H5v1h1v1H5v1h6v-1h-1v-1H8z m0-2h1V6H8v1z", "M7 12h2v2H7v-2z"], "#fef08a"),
    Rooted: createIcon(["M8 13v-2H7v-1h2v1h-1v2H8z M6 10H5V8h1v2z m4 0h1V8h-1v2z M8 8H7V6h2v2h-1z M10 5h-1V4H7v1H6V4H5v2h1v1h4V6h1V4h-1v1z"], "#78350f"),
    Regenerating: createIcon(["M8 4l-1 2h2L8 4z M7 6v1h2V6H7z M6 8v1h4V8H6z M5 10v1h6v-1H5z"], "#4ade80"),
    Blinded: createIcon(["M8 4c-2 0-3 2-3 4s1 4 3 4 3-2 3-4-1-4-3-4z M8 6c1 0 1 1 1 2s0 2-1 2-1-1-1-2 0-2 1-2z M5 8h6v1H5V8z"], "#9ca3af"), // New icon for Blinded
    Steamed: createIcon(["M4 7h2v1H4V7z M10 7h2v1h-2V7z M7 4h2v1H7V4z M5 9h6v1H5V9z M4 11h8v1H4v-1z"], "#e0f2f4"), // New icon for Steamed
    // New Tier 1.5 Icons
    Fireball: createIcon(["M8 1c-2 2-3 4-3 6s1 4 3 4 3-2 3-4-1-4-3-6zm0 2c-1 1-1 2-1 3s0 2 1 3 1-2 1-3-0-2-1-3z"], "#f87171"),
    Earthquake: createIcon(["M2 8h2V7h1v2h2V7h2v2h2V7h1v1h2v1H2z M3 10h10v-1H3v1z"], "#a16207"),
    Cyclone: createIcon(["M8 4c-2 0-4 2-4 4h2c0-1 1-2 2-2s2 1 2 2h2c0 2-2 4-4 4z m0 8c2 0 4-2 4-4h-2c0 1-1 2-2 2s-2-1-2-2H4c0 2 2 4 4 4z"], "#38bdf8"),
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
    // Passive Talent Icons
    Counter: createIcon(["M8 1l-3 3h2v2h2V4h2L8 1z M4 8h8v1H4V8z"], "#f97316"), // Eldens Vrede
    HealBonus: createIcon(["M8 1l-1 2h2L8 1z M7 3v1h2V3H7z M6 5v1h4V5H6z M5 7v1h6V7H5z"], "#4ade80"), // Jordens Resonans
    // Ultimate Ability Icons
    Meteor: createIcon(["M8 1c-2 2-3 4-3 6s1 4 3 4 3-2 3-4-1-4-3-6zm0 2c-1 1-1 2-1 3s0 2 1 3 1-2 1-3-0-2-1-3z M4 10h8v1H4v-1z M3 12h10v1H3v-1z"], "#ef4444"),
    EarthquakeUltimate: createIcon(["M2 8h2V7h1v2h2V7h2v2h2V7h1v1h2v1H2z M3 10h10v-1H3v1z M1 12h14v1H1v-1z"], "#a16207"),
    
    // NEW ICONS FOR EXPANDED AFFINITIES
    MagmaShield: createIcon(["M8 1C4 1 3 4 3 8s1 7 5 7 5-3 5-7-1-7-5-7zm0 1v1h1v1h1v2H9v1H7V6H5V4h1V3h1V2h1z M7 10h2v1H7v-1z"], "#f97316"), // Magma Skin
    Volcano: createIcon(["M8 1l-3 4h6L8 1z M4 5h8v1H4V5z M3 6h10v1H3V6z M2 7h12v1H2V7z M1 8h14v1H1V8z M5 9h6v1H5V9z M6 10h4v1H6v-1z M7 11h2v1H7v-1z"], "#ef4444"), // Volcanic Eruption
    Shard: createIcon(["M8 1l-3 3h2v2h2V4h2L8 1z M4 8h8v1H4V8z M7 10h2v2H7v-1z"], "#475569"), // Obsidian Shard
    Gaze: createIcon(["M8 4c-2 0-3 2-3 4s1 4 3 4 3-2 3-4-1-4-3-4z M8 6c1 0 1 1 1 2s0 2-1 2-1-1-1-2 0-2 1-2z M5 8h6v1H5V8z M7 10h2v1H7v-1z"], "#1e293b"), // Petrifying Gaze
    SwiftFire: createIcon(["M8 11v-1h1V9h-1V8h1V7h-1V5h1V4h-1V3h1V2h-1V1H7v1H6v1h1v1h-1v2h1v1h-1v1h1v1H6v1h4v-1h-1v-1H8z M4 7h1v2H4V7z"], "#f59e0b"), // Swift Inferno
    Tornado: createIcon(["M8 1c-2 0-4 2-4 4h2c0-1 1-2 2-2s2 1 2 2h2c0 2-2 4-4 4z m0 8c2 0 4-2 4-4h-2c0 1-1 2-2 2s-2-1-2-2H4c0 2 2 4 4 4z M7 13h2v1H7v-1z"], "#38bdf8"), // Raging Cyclone
    Haze: createIcon(["M4 7h2v1H4V7z M10 7h2v1h-2V7z M7 4h2v1H7V4z M5 9h6v1H5V9z M4 11h8v1H4v-1z M7 13h2v1H7v-1z"], "#fbbf24"), // Heat Haze
    Scorch: createIcon(["M8 11v-1h1V9h-1V8h1V7h-1V5h1V4h-1V3h1V2h-1V1H7v1H6v1h1v1h-1v2h1v1h-1v1h1v1H6v1h4v-1h-1v-1H8z M4 13h8v1H4v-1z"], "#ef4444"), // Scorch Wind
    SteamCloud: createIcon(["M4 7h2v1H4V7z M10 7h2v1h-2V7z M7 4h2v1H7V4z M5 9h6v1H5V9z M4 11h8v1H4v-1z M7 13h2v1H7v-1z"], "#eab308"), // Steam Veil
    Geyser: createIcon(["M8 1l-2 2h1v3h2V3h1L8 1z M4 7h8v1H4V7z M3 9h10v1H3V9z M2 11h12v1H2V11z M1 13h14v1H1V13z"], "#60a5fa"), // Geyser Burst
    Mist: createIcon(["M4 7h2v1H4V7z M10 7h2v1h-2V7z M7 4h2v1H7V4z M5 9h6v1H5V9z M4 11h8v1H4v-1z M7 13h2v1H7v-1z"], "#fcd34d"), // Soothing Mist
    Cleanse: createIcon(["M8 1l-1 2h2L8 1z M7 3v1h2V3H7z M6 5v1h4V5H6z M5 7v1h6V7H5z M4 9h8v1H4V9z M3 11h10v1H3V11z"], "#4ade80"), // Cleansing Geyser
    SandClock: createIcon(["M8 1l-3 3h6L8 1z M4 5h8v1H4V5z M3 6h10v1H3V6z M2 7h12v1H2V7z M1 8h14v1H1V8z M5 9h6v1H5V9z M6 10h4v1H6v-1z M7 11h2v1H7v-1z"], "#a16207"), // Shifting Sands
    Desert: createIcon(["M2 8h2v1H2V8zm2 2h2v-1H4v1zm2 1h2V9H6v2zm2-1h2V8H8v2zm2-2h2V7h-2v1zm2 1h2V6h-2v2z M1 13h14v1H1v-1z"], "#ca8a04"), // Desert Storm
    Grind: createIcon(["M12 4H4v1h8V4z m0 2H4v1h8V6z m0 3H4v1h8V9z m-2 2H6v1h4v-1z M7 13h2v1H7v-1z"], "#ca8a04"), // Grinding Winds
    Dust: createIcon(["M8 1c-2 0-4 2-4 4h2c0-1 1-2 2-2s2 1 2 2h2c0 2-2 4-4 4z m0 8c2 0 4-2 4-4h-2c0 1-1 2-2 2s-2-1-2-2H4c0 2 2 4 4 4z M7 13h2v1H7v-1z"], "#a16207"), // Dust Devil
    Mire: createIcon(["M4 8v1h1v1h6V9h1V8H4z M6 11h4v1H6v-1z M7 13h2v1H7v-1z"], "#78350f"), // Sticky Mire
    Quagmire: createIcon(["M4 8v1h1v1h6V9h1V8H4z M6 11h4v1H6v-1z M1 13h14v1H1v-1z"], "#78350f"), // Quagmire
    Leaf: createIcon(["M8 1l-1 2h2L8 1z M7 3v1h2V3H7z M6 5v1h4V5H6z M5 7v1h6V7H5z M4 9h8v1H4V9z M3 11h10v1H3V11z"], "#4d7c0f"), // Verdant Aura
    Flower: createIcon(["M8 1l-1 2h2L8 1z M7 3v1h2V3H7z M6 5v1h4V5H6z M5 7v1h6V7H5z M4 9h8v1H4V9z M3 11h10v1H3V11z M7 13h2v1H7v-1z"], "#4ade80"), // Lifebloom
    Frost: createIcon(["M8 1l-2 2h1v3h2V3h1L8 1z M4 7l-2 2h1v3h2V9h1L4 7z m8 0l-2 2h1v3h2V9h1l-2-2z M7 13h2v1H7v-1z"], "#7dd3fc"), // Frostbite
    Spike: createIcon(["M8 1l-2 2h1v3h2V3h1L8 1z M4 7l-2 2h1v3h2V9h1L4 7z m8 0l-2 2h1v3h2V9h1l-2-2z M1 13h14v1H1v-1z"], "#bae6fd"), // Glacial Spike
    Lightning: createIcon(["M7 1v1h1v1h1v2H8v1H6V5h1V4h1V3H7V2H6V1h1z M10 10h-1v-1h-1v-1h-1v2h1v1h1v1h1v1h-1v-1h-1v-1h-1v-2h1V9h1v1h1v1h-1z"], "#0284c7"), // Static Charge
    Thunder: createIcon(["M7 1v1h1v1h1v2H8v1H6V5h1V4h1V3H7V2H6V1h1z M10 10h-1v-1h-1v-1h-1v2h1v1h1v1h1v1h-1v-1h-1v-1h-1v-2h1V9h1v1h1v1h-1z M1 13h14v1H1v-1z"], "#38bdf8"), // Thunderclap
    // New icons for base element passive/ultimate
    FireAura: createIcon(["M8 11v-1h1V9h-1V8h1V7h-1V5h1V4h-1V3h1V2h-1V1H7v1H6v1h1v1h-1v2h1v1h-1v1h1v1H6v1h4v-1h-1v-1H8z M4 7h1v1H4V7z M11 7h1v1h-1V7z"], "#f97316"), // Fire Aura
    EarthShield: createIcon(["M8 1C4 1 3 4 3 8s1 7 5 7 5-3 5-7-1-7-5-7zm0 1v1h1v1h1v2H9v1H7V6H5V4h1V3h1V2h1z M7 10h2v1H7v-1z"], "#22c55e"), // Earth Shield
    WindDodge: createIcon(["M3 5h1V4h8v1h1v2h-1v1h-1v1H5V8H4V7H3V5z M10 8h1V7h-1v1z M5 7h1V6H5v1z M7 10h2v1H7v-1z"], "#0ea5e9"), // Wind Dodge
    WaterRegen: createIcon(["M8 7C6 7 5 8 5 9s1 2 3 2 3-1 3-1-1-3-3-3z M8 13c-2 0-3-1-3-2s1-2 3-2v1c-1 0-1 0-1 1s0 1 1 1 1 0 1-1v-1c2 0 3 1 3 2s-1 2-3 2z M7 4h2v1H7V4z"], "#3b82f6"), // Water Regeneration
    FireNova: createIcon(["M8 1c-2 2-3 4-3 6s1 4 3 4 3-2 3-4-1-4-3-6zm0 2c-1 1-1 2-1 3s0 2 1 3 1-2 1-3-0-2-1-3z M4 10h8v1H4v-1z M3 12h10v1H3v-1z M2 14h12v1H2v-1z"], "#ef4444"), // Fire Nova
    EarthWall: createIcon(["M2 10h12v1H2v-1z M3 8h10v1H3V8z M4 6h8v1H4V6z M5 4h6v1H5V4z"], "#a16207"), // Earth Wall
    WindBurst: createIcon(["M8 1c-2 0-4 2-4 4h2c0-1 1-2 2-2s2 1 2 2h2c0 2-2 4-4 4z m0 8c2 0 4-2 4-4h-2c0 1-1 2-2 2s-2-1-2-2H4c0 2 2 4 4 4z M7 13h2v1H7v-1z M6 14h4v1H6v-1z"], "#38bdf8"), // Wind Burst
    WaterBless: createIcon(["M8 7C6 7 5 8 5 9s1 2 3 2 3-1 3-1-1-3-3-3z M8 13c-2 0-3-1-3-2s1-2 3-2v1c-1 0-1 0-1 1s0 1 1 1 1 0 1-1v-1c2 0 3 1 3 2s-1 2-3 2z M7 4h2v1H7V4z M6 2h4v1H6V2z"], "#60a5fa"), // Water Bless
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

export const INITIAL_CHARACTER_BASE: Omit<Character, 'name' | 'archetype' | 'unlockedPassiveTalents' | 'unlockedUltimateAbilities'> = {
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
  elementalAffinities: {}, // Initialize empty elemental affinities
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

// --- NEW: Passive Talents ---
export const PASSIVE_TALENTS: Record<string, PassiveTalent> = {
  'fire_vengeance': {
    id: 'fire_vengeance',
    name: 'Eldens Vrede',
    description: '15% chans att kontra med 5 eldskada när du tar eldskada.',
    element: Element.FIRE,
    icon: Icons.Counter,
    effect: { type: 'COUNTER_ATTACK', element: Element.FIRE, damage: 5, chance: 15 },
  },
  'earth_resonance': {
    id: 'earth_resonance',
    name: 'Jordens Resonans',
    description: 'Ökar all självläkning med 10%.',
    element: Element.EARTH,
    icon: Icons.HealBonus,
    effect: { type: 'HEAL_BONUS', value: 10, isPercentage: true },
  },
  'magma_skin': {
    id: 'magma_skin',
    name: 'Magmahud',
    description: '10% chans att bränna anfallare för 3 eldskada i 2 rundor när du tar skada.',
    element: Element.MAGMA,
    icon: Icons.MagmaShield,
    effect: { type: 'APPLY_STATUS', status: 'burning', duration: 2, value: 3, chance: 10 },
  },
  'obsidian_shard': {
    id: 'obsidian_shard',
    name: 'Obsidianskärva',
    description: '15% chans att sakta ner anfallare i 1 runda när du tar skada.',
    element: Element.OBSIDIAN,
    icon: Icons.Shard,
    effect: { type: 'APPLY_STATUS', status: 'slowed', duration: 1, chance: 15 },
  },
  'swift_inferno': {
    id: 'swift_inferno',
    name: 'Snabb Inferno',
    description: 'Efter att ha delat ut eldskada, ökar din ATB-hastighet med 5% i 1 runda.',
    element: Element.FIRESTORM,
    icon: Icons.SwiftFire,
    effect: { type: 'RESOURCE_GAIN', stat: 'dexterity', value: 5, isPercentage: true }, // Represents ATB speed
  },
  'heat_haze': {
    id: 'heat_haze',
    name: 'Hett Dis',
    description: '5% chans att blända fiender i 1 runda när du delar ut eld- eller vindskada.',
    element: Element.HOT_AIR,
    icon: Icons.Haze,
    effect: { type: 'APPLY_STATUS', status: 'blinded', duration: 1, chance: 5 },
  },
  'steam_veil': {
    id: 'steam_veil',
    name: 'Ångslöja',
    description: '10% chans att applicera Ångad på fiender i 1 runda när du träffar med eld- eller vattenförmågor.',
    element: Element.STEAM,
    icon: Icons.SteamCloud,
    effect: { type: 'APPLY_STATUS', status: 'steamed', duration: 1, accuracyReduction: 10, chance: 10 },
  },
  'soothing_mist': {
    id: 'soothing_mist',
    name: 'Lugnande Dimma',
    description: 'Ökar all helande du mottar med 5%.',
    element: Element.HOT_SPRINGS,
    icon: Icons.Mist,
    effect: { type: 'HEAL_BONUS', value: 5, isPercentage: true },
  },
  'shifting_sands': {
    id: 'shifting_sands',
    name: 'Skiftande Sand',
    description: '10% chans att sakta ner anfallare i 1 runda när du tar skada.',
    element: Element.SAND,
    icon: Icons.SandClock,
    effect: { type: 'APPLY_STATUS', status: 'slowed', duration: 1, chance: 10 },
  },
  'grinding_winds': {
    id: 'grinding_winds',
    name: 'Malande Vindar',
    description: '5% chans att minska fiendens rustning med 1 i 2 rundor när du träffar med vind- eller jordskada.',
    element: Element.EROSION,
    icon: Icons.Grind,
    effect: { type: 'APPLY_STATUS', status: 'armor_reduction', duration: 2, value: 1, chance: 5 },
  },
  'sticky_mire': {
    id: 'sticky_mire',
    name: 'Klibbig Myr',
    description: '5% chans att rota anfallare i 1 runda när du tar skada.',
    element: Element.MUD,
    icon: Icons.Mire,
    effect: { type: 'APPLY_STATUS', status: 'rooted', duration: 1, chance: 5 },
  },
  'verdant_aura': {
    id: 'verdant_aura',
    name: 'Grönskande Aura',
    description: 'Ökar all regenerering du mottar med 10%.',
    element: Element.GROWTH,
    icon: Icons.Leaf,
    effect: { type: 'HEAL_BONUS', value: 10, isPercentage: true },
  },
  'frostbite': {
    id: 'frostbite',
    name: 'Köldskada',
    description: '5% chans att sakta ner fiender i 2 rundor när du träffar med vatten- eller vindskada.',
    element: Element.ICE,
    icon: Icons.Frost,
    effect: { type: 'APPLY_STATUS', status: 'slowed', duration: 2, chance: 5 },
  },
  'static_charge': {
    id: 'static_charge',
    name: 'Statisk Laddning',
    description: '5% chans att förlama fiender i 1 runda när du träffar med vind- eller vattenskada.',
    element: Element.STORM,
    icon: Icons.Lightning,
    effect: { type: 'APPLY_STATUS', status: 'stunned', duration: 1, chance: 5 },
  },
  // New base element passive talents
  'fire_aura': {
    id: 'fire_aura',
    name: 'Eldig Aura',
    description: 'Alla fiender tar 2 eldskada varje runda.',
    element: Element.FIRE,
    icon: Icons.FireAura,
    effect: { type: 'DEAL_ELEMENTAL_DAMAGE', element: Element.FIRE, damage: 2, chance: 100 }, // Passive, always active
  },
  'earth_guard': {
    id: 'earth_guard',
    name: 'Jordens Vakt',
    description: '10% chans att få +5 rustning i 1 runda när du tar skada.',
    element: Element.EARTH,
    icon: Icons.EarthShield,
    effect: { type: 'APPLY_STATUS', status: 'defending', duration: 1, value: 5, chance: 10 }, // Placeholder for temp armor
  },
  'wind_evasion': {
    id: 'wind_evasion',
    name: 'Vindens Undanflykt',
    description: '5% ökad undvikandechans.',
    element: Element.WIND,
    icon: Icons.WindDodge,
    effect: { type: 'STAT_BONUS', stat: 'undvikandechans', value: 5, isPercentage: true },
  },
  'water_flow': {
    id: 'water_flow',
    name: 'Vattenflöde',
    description: 'Regenererar 5% av din maxhälsa varje runda.',
    element: Element.WATER,
    icon: Icons.WaterRegen,
    effect: { type: 'HEAL_BONUS', value: 5, isPercentage: true }, // Represents passive regen
  },
};

// --- NEW: Ultimate Abilities ---
export const ULTIMATE_ABILITIES: Record<string, UltimateAbility> = {
  'fire_meteor': {
    id: 'fire_meteor',
    name: 'Meteorregn',
    description: 'Kallar ner ett meteorregn som skadar alla fiender massivt.',
    element: Element.FIRE,
    icon: Icons.Meteor,
    cooldown: 10, // 10 turns cooldown
    effect: { type: 'AOE_DAMAGE', damage: 50 }, // Base damage, scaled by player stats
  },
  'earth_quake_ultimate': {
    id: 'earth_quake_ultimate',
    name: 'Jordens Vrede',
    description: 'Ett massivt jordskalv som skadar och rotar alla fiender.',
    element: Element.EARTH,
    icon: Icons.EarthquakeUltimate,
    cooldown: 12,
    effect: { type: 'AOE_DAMAGE', damage: 30, buff: 'rooted', duration: 2 },
  },
  'volcanic_eruption': {
    id: 'volcanic_eruption',
    name: 'Vulkanutbrott',
    description: 'Orsakar ett vulkanutbrott som skadar alla fiender och sätter dem i brand.',
    element: Element.MAGMA,
    icon: Icons.Volcano,
    cooldown: 15,
    effect: { type: 'AOE_DAMAGE', damage: 40, buff: 'burning', duration: 3, value: 5 },
  },
  'petrifying_gaze': {
    id: 'petrifying_gaze',
    name: 'Förstenande Blick',
    description: 'Förstenar alla fiender, rotar dem och orsakar skada.',
    element: Element.OBSIDIAN,
    icon: Icons.Gaze,
    cooldown: 18,
    effect: { type: 'AOE_DAMAGE', damage: 35, buff: 'rooted', duration: 3 },
  },
  'raging_cyclone': {
    id: 'raging_cyclone',
    name: 'Rasande Cyklon',
    description: 'En rasande cyklon skadar alla fiender och bländar dem.',
    element: Element.FIRESTORM,
    icon: Icons.Tornado,
    cooldown: 14,
    effect: { type: 'AOE_DAMAGE', damage: 30, buff: 'blinded', duration: 2 },
  },
  'scorch_wind': {
    id: 'scorch_wind',
    name: 'Svedande Vind',
    description: 'En het vind skadar alla fiender och applicerar Ångad.',
    element: Element.HOT_AIR,
    icon: Icons.Scorch,
    cooldown: 13,
    effect: { type: 'AOE_DAMAGE', damage: 25, buff: 'steamed', duration: 2, value: 3 },
  },
  'geyser_burst': {
    id: 'geyser_burst',
    name: 'Gejserutbrott',
    description: 'En kraftfull gejser skadar alla fiender och knuffar tillbaka dem.',
    element: Element.STEAM,
    icon: Icons.Geyser,
    cooldown: 14,
    effect: { type: 'AOE_DAMAGE', damage: 30, buff: 'pushed_back', duration: 1 }, // Placeholder status type
  },
  'cleansing_geyser': {
    id: 'cleansing_geyser',
    name: 'Renande Gejser',
    description: 'En gejser läker alla allierade och tar bort negativa statusar.',
    element: Element.HOT_SPRINGS,
    icon: Icons.Cleanse,
    cooldown: 16,
    effect: { type: 'MASS_HEAL', heal: 60, buff: 'cleanse_debuffs_action' }, // Placeholder buff type
  },
  'desert_storm': {
    id: 'desert_storm',
    name: 'Ökenstorm',
    description: 'En massiv sandstorm skadar, bländar och saktar ner alla fiender.',
    element: Element.SAND,
    icon: Icons.Desert,
    cooldown: 15,
    effect: { type: 'AOE_DAMAGE', damage: 35, buff: 'blinded', duration: 2, value: 2 }, // Value for slow amount
  },
  'dust_devil': {
    id: 'dust_devil',
    name: 'Dammvirvel',
    description: 'En dammvirvel skadar alla fiender och minskar deras rustning.',
    element: Element.EROSION,
    icon: Icons.Dust,
    cooldown: 13,
    effect: { type: 'AOE_DAMAGE', damage: 25, buff: 'armor_reduction', duration: 3, value: 3 },
  },
  'quagmire': {
    id: 'quagmire',
    name: 'Kärr',
    description: 'Skapar ett kärr som rotar och förgiftar alla fiender.',
    element: Element.MUD,
    icon: Icons.Quagmire,
    cooldown: 16,
    effect: { type: 'AOE_DAMAGE', damage: 20, buff: 'rooted', duration: 3, value: 4 }, // Value for poison damage
  },
  'lifebloom': {
    id: 'lifebloom',
    name: 'Livsblom',
    description: 'En livsblom läker alla allierade och ger dem regenerering.',
    element: Element.GROWTH,
    icon: Icons.Flower,
    cooldown: 17,
    effect: { type: 'MASS_HEAL', heal: 50, buff: 'regenerating', duration: 4, value: 10 },
  },
  'glacial_spike': {
    id: 'glacial_spike',
    name: 'Glaciärspik',
    description: 'En massiv isspik skadar en fiende kraftigt och fryser dem.',
    element: Element.ICE,
    icon: Icons.Spike,
    cooldown: 12,
    effect: { type: 'SINGLE_TARGET_DAMAGE', damage: 70, buff: 'frozen', duration: 2 }, // Placeholder status type
  },
  'thunderclap': {
    id: 'thunderclap',
    name: 'Åskknall',
    description: 'En åskknall skadar och förlamar alla fiender.',
    element: Element.STORM,
    icon: Icons.Thunder,
    cooldown: 14,
    effect: { type: 'AOE_DAMAGE', damage: 40, buff: 'stunned', duration: 1 },
  },
  'volcanic_storm_ultimate': {
    id: 'volcanic_storm_ultimate',
    name: 'Vulkanisk Storm',
    description: 'En rasande tornado som slungar ut brinnande stenbumlingar och skadar alla fiender massivt.',
    element: Element.VOLCANIC_STORM,
    icon: Icons.VolcanicStorm,
    cooldown: 20,
    effect: { type: 'AOE_DAMAGE', damage: 80, buff: 'burning', duration: 5, value: 8 },
  },
  'electrified_mud_ultimate': {
    id: 'electrified_mud_ultimate',
    name: 'Elektrifierad Lera',
    description: 'Ett fält av lera som saktar, skadar med blixtar och förlamar alla fiender.',
    element: Element.ELECTRIFIED_MUD,
    icon: Icons.ElectrifiedMud,
    cooldown: 20,
    effect: { type: 'AOE_DAMAGE', damage: 60, buff: 'stunned', duration: 2, value: 5 }, // Value for slow/poison
  },
  'vitrified_storm_ultimate': {
    id: 'vitrified_storm_ultimate',
    name: 'Förglasad Storm',
    description: 'En het storm som smälter sand till ett fält av vasst glas, skadar och minskar rustning på alla fiender.',
    element: Element.VITRIFIED_STORM,
    icon: Icons.VitrifiedStorm,
    cooldown: 20,
    effect: { type: 'AOE_DAMAGE', damage: 70, buff: 'armor_reduction', duration: 4, value: 10 },
  },
  // New base element ultimate abilities
  'fire_nova': {
    id: 'fire_nova',
    name: 'Eldnova',
    description: 'En explosion av eld som skadar alla fiender runt dig.',
    element: Element.FIRE,
    icon: Icons.FireNova,
    cooldown: 15,
    effect: { type: 'AOE_DAMAGE', damage: 60 },
  },
  'earth_wall': {
    id: 'earth_wall',
    name: 'Jordvägg',
    description: 'Skapar en jordvägg som absorberar inkommande skada för dig och dina allierade.',
    element: Element.EARTH,
    icon: Icons.EarthWall,
    cooldown: 18,
    effect: { type: 'GLOBAL_BUFF', buff: 'damage_reduction', duration: 3, value: 30, isPercentage: true }, // 30% damage reduction
  },
  'wind_burst': {
    id: 'wind_burst',
    name: 'Vindstöt',
    description: 'En kraftig vindstöt som knuffar tillbaka och saktar ner alla fiender.',
    element: Element.WIND,
    icon: Icons.WindBurst,
    cooldown: 16,
    effect: { type: 'AOE_DAMAGE', damage: 20, buff: 'slowed', duration: 2 }, // Small damage, primary CC
  },
  'water_blessing': {
    id: 'water_blessing',
    name: 'Vattenvälsignelse',
    description: 'Läker alla allierade och tar bort alla negativa statusar.',
    element: Element.WATER,
    icon: Icons.WaterBless,
    cooldown: 20,
    effect: { type: 'MASS_HEAL', heal: 80, buff: 'cleanse_all_debuffs_action' }, // Heals and cleanses
  },
};


export const ELEMENTAL_AFFINITY_BONUSES: Record<Element, ElementalBonus[]> = {
  [Element.FIRE]: [
    { threshold: 1, description: "+1 Skada", effect: { type: 'STAT_BONUS', stat: 'skada', value: 1 } },
    { threshold: 5, description: "+5% Kritisk Träff", effect: { type: 'STAT_BONUS', stat: 'kritiskTräff', value: 5, isPercentage: true } },
    { threshold: 10, description: "+10% Eldskada", effect: { type: 'DAMAGE_BONUS', element: Element.FIRE, value: 10, isPercentage: true } },
    { threshold: 15, description: "Låser upp passiv talang: Eldens Vrede", effect: { type: 'PASSIVE_TALENT', talentId: 'fire_vengeance' } },
    { threshold: 20, description: "+15% Eldskada", effect: { type: 'DAMAGE_BONUS', element: Element.FIRE, value: 15, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Meteorregn", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'fire_meteor' } },
    { threshold: 30, description: "+2 Intelligens", effect: { type: 'STAT_BONUS', stat: 'intelligence', value: 2 } },
    { threshold: 35, description: "+10% Eldresistans", effect: { type: 'RESISTANCE', element: Element.FIRE, value: 10, isPercentage: true } },
    { threshold: 40, description: "Låser upp passiv talang: Eldig Aura", effect: { type: 'PASSIVE_TALENT', talentId: 'fire_aura' } },
    { threshold: 45, description: "+20% Kritisk Skada", effect: { type: 'STAT_BONUS', stat: 'kritiskTräff', value: 20, isPercentage: true } },
    { threshold: 50, description: "Låser upp ultimat förmåga: Eldnova", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'fire_nova' } },
  ],
  [Element.EARTH]: [
    { threshold: 1, description: "+1 Rustning", effect: { type: 'STAT_BONUS', stat: 'rustning', value: 1 } },
    { threshold: 5, description: "+10 Max Hälsa", effect: { type: 'STAT_BONUS', stat: 'constitution', value: 10 } }, // Constitution affects max health
    { threshold: 10, description: "+10% Jordresistans", effect: { type: 'RESISTANCE', element: Element.EARTH, value: 10, isPercentage: true } },
    { threshold: 15, description: "Låser upp passiv talang: Jordens Resonans", effect: { type: 'PASSIVE_TALENT', talentId: 'earth_resonance' } },
    { threshold: 20, description: "+15% Max Hälsa", effect: { type: 'STAT_BONUS', stat: 'constitution', value: 15, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Jordens Vrede", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'earth_quake_ultimate' } },
    { threshold: 30, description: "+2 Styrka", effect: { type: 'STAT_BONUS', stat: 'strength', value: 2 } },
    { threshold: 35, description: "+15% Rustning", effect: { type: 'STAT_BONUS', stat: 'rustning', value: 15, isPercentage: true } },
    { threshold: 40, description: "Låser upp passiv talang: Jordens Vakt", effect: { type: 'PASSIVE_TALENT', talentId: 'earth_guard' } },
    { threshold: 45, description: "+20 Max Hälsa", effect: { type: 'STAT_BONUS', stat: 'constitution', value: 20 } },
    { threshold: 50, description: "Låser upp ultimat förmåga: Jordvägg", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'earth_wall' } },
  ],
  [Element.WIND]: [
    { threshold: 1, description: "+1 Undvikandechans", effect: { type: 'STAT_BONUS', stat: 'undvikandechans', value: 1 } },
    { threshold: 5, description: "+5% ATB-hastighet", effect: { type: 'RESOURCE_REGEN', stat: 'dexterity', value: 5, isPercentage: true } }, // Representing ATB speed
    { threshold: 10, description: "+10% Vindskada", effect: { type: 'DAMAGE_BONUS', element: Element.WIND, value: 10, isPercentage: true } },
    { threshold: 15, description: "+10% Undvikandechans", effect: { type: 'STAT_BONUS', stat: 'undvikandechans', value: 10, isPercentage: true } },
    { threshold: 20, description: "+10% ATB-hastighet", effect: { type: 'RESOURCE_REGEN', stat: 'dexterity', value: 10, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Rasande Cyklon", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'raging_cyclone' } },
    { threshold: 30, description: "+2 Dexteritet", effect: { type: 'STAT_BONUS', stat: 'dexterity', value: 2 } },
    { threshold: 35, description: "+10% Vindresistans", effect: { type: 'RESISTANCE', element: Element.WIND, value: 10, isPercentage: true } },
    { threshold: 40, description: "Låser upp passiv talang: Vindens Undanflykt", effect: { type: 'PASSIVE_TALENT', talentId: 'wind_evasion' } },
    { threshold: 45, description: "+15% ATB-hastighet", effect: { type: 'RESOURCE_REGEN', stat: 'dexterity', value: 15, isPercentage: true } },
    { threshold: 50, description: "Låser upp ultimat förmåga: Vindstöt", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'wind_burst' } },
  ],
  [Element.WATER]: [
    { threshold: 1, description: "+1 Intelligens", effect: { type: 'STAT_BONUS', stat: 'intelligence', value: 1 } },
    { threshold: 5, description: "+5% Resursregeneration", effect: { type: 'RESOURCE_REGEN', stat: 'intelligence', value: 5, isPercentage: true } }, // Affects Aether regen
    { threshold: 10, description: "+10% Vattenresistans", effect: { type: 'RESISTANCE', element: Element.WATER, value: 10, isPercentage: true } },
    { threshold: 15, description: "+10% Helande effekt", effect: { type: 'HEAL_BONUS', value: 10, isPercentage: true } },
    { threshold: 20, description: "+10% Resursregeneration", effect: { type: 'RESOURCE_REGEN', stat: 'intelligence', value: 10, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Gejserutbrott", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'geyser_burst' } },
    { threshold: 30, description: "+2 Konstitution", effect: { type: 'STAT_BONUS', stat: 'constitution', value: 2 } },
    { threshold: 35, description: "+15% Vattenresistans", effect: { type: 'RESISTANCE', element: Element.WATER, value: 15, isPercentage: true } },
    { threshold: 40, description: "Låser upp passiv talang: Vattenflöde", effect: { type: 'PASSIVE_TALENT', talentId: 'water_flow' } },
    { threshold: 45, description: "+15% Helande effekt", effect: { type: 'HEAL_BONUS', value: 15, isPercentage: true } },
    { threshold: 50, description: "Låser upp ultimat förmåga: Vattenvälsignelse", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'water_blessing' } },
  ],
  // Hybrid elements
  [Element.MAGMA]: [
    { threshold: 1, description: "+2 Skada, +2 Rustning", effect: { type: 'STAT_BONUS', stat: 'skada', value: 2 } },
    { threshold: 5, description: "+10% Eld- och Jordresistans", effect: { type: 'RESISTANCE', element: Element.FIRE, value: 10, isPercentage: true } },
    { threshold: 10, description: "Låser upp passiv talang: Magmahud", effect: { type: 'PASSIVE_TALENT', talentId: 'magma_skin' } },
    { threshold: 15, description: "+15% Magmaskada", effect: { type: 'DAMAGE_BONUS', element: Element.MAGMA, value: 15, isPercentage: true } },
    { threshold: 20, description: "+10 Max Hetta, +5% Hetta-regen", effect: { type: 'RESOURCE_REGEN', stat: 'aether', value: 10 } }, // Assuming aether is Hetta
    { threshold: 25, description: "Låser upp ultimat förmåga: Vulkanutbrott", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'volcanic_eruption' } },
  ],
  [Element.OBSIDIAN]: [
    { threshold: 1, description: "+3 Rustning, +1 Styrka", effect: { type: 'STAT_BONUS', stat: 'rustning', value: 3 } },
    { threshold: 5, description: "+15% Skadeåterkastning", effect: { type: 'DAMAGE_BONUS', stat: 'rustning', value: 15, isPercentage: true } }, // Placeholder for retaliation
    { threshold: 10, description: "Låser upp passiv talang: Obsidianskärva", effect: { type: 'PASSIVE_TALENT', talentId: 'obsidian_shard' } },
    { threshold: 15, description: "+20 Max Hälsa", effect: { type: 'STAT_BONUS', stat: 'constitution', value: 20 } },
    { threshold: 20, description: "+10% Jord- och Eldresistans", effect: { type: 'RESISTANCE', element: Element.EARTH, value: 10, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Förstenande Blick", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'petrifying_gaze' } },
  ],
  [Element.FIRESTORM]: [
    { threshold: 1, description: "+2 Dexteritet, +2 Intelligens", effect: { type: 'STAT_BONUS', stat: 'dexterity', value: 2 } },
    { threshold: 5, description: "+10% Kritisk Skada", effect: { type: 'STAT_BONUS', stat: 'kritiskTräff', value: 10, isPercentage: true } },
    { threshold: 10, description: "Låser upp passiv talang: Snabb Inferno", effect: { type: 'PASSIVE_TALENT', talentId: 'swift_inferno' } },
    { threshold: 15, description: "+15% Eldstormskada", effect: { type: 'DAMAGE_BONUS', element: Element.FIRESTORM, value: 15, isPercentage: true } },
    { threshold: 20, description: "+10% ATB-hastighet", effect: { type: 'RESOURCE_REGEN', stat: 'dexterity', value: 10, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Rasande Cyklon", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'raging_cyclone' } },
  ],
  [Element.HOT_AIR]: [
    { threshold: 1, description: "+10% chans att blinda fiender", effect: { type: 'STAT_BONUS', stat: 'dexterity', value: 10, isPercentage: true } },
    { threshold: 5, description: "+5% Undvikandechans", effect: { type: 'STAT_BONUS', stat: 'undvikandechans', value: 5, isPercentage: true } },
    { threshold: 10, description: "Låser upp passiv talang: Hett Dis", effect: { type: 'PASSIVE_TALENT', talentId: 'heat_haze' } },
    { threshold: 15, description: "+10% chans att applicera Ångad", effect: { type: 'APPLY_STATUS', status: 'steamed', duration: 2, value: 15, isPercentage: true, chance: 10 } },
    { threshold: 20, description: "+10% Vind- och Eldresistans", effect: { type: 'RESISTANCE', element: Element.WIND, value: 10, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Svedande Vind", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'scorch_wind' } },
  ],
  [Element.STEAM]: [
    { threshold: 1, description: "+10% chans att bränna fiender", effect: { type: 'STAT_BONUS', stat: 'intelligence', value: 10, isPercentage: true } },
    { threshold: 5, description: "+5% Aether Regeneration", effect: { type: 'RESOURCE_REGEN', stat: 'intelligence', value: 5, isPercentage: true } },
    { threshold: 10, description: "Låser upp passiv talang: Ångslöja", effect: { type: 'PASSIVE_TALENT', talentId: 'steam_veil' } },
    { threshold: 15, description: "+15% Ångskada", effect: { type: 'DAMAGE_BONUS', element: Element.STEAM, value: 15, isPercentage: true } },
    { threshold: 20, description: "+10 Max Flöde, +5% Flöde-regen", effect: { type: 'RESOURCE_REGEN', stat: 'aether', value: 10 } }, // Assuming aether is Flöde
    { threshold: 25, description: "Låser upp ultimat förmåga: Gejserutbrott", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'geyser_burst' } },
  ],
  [Element.HOT_SPRINGS]: [
    { threshold: 1, description: "+5% helande effekt", effect: { type: 'HEAL_BONUS', value: 5, isPercentage: true } },
    { threshold: 5, description: "+10 Max Hälsa", effect: { type: 'STAT_BONUS', stat: 'constitution', value: 10 } },
    { threshold: 10, description: "Låser upp passiv talang: Lugnande Dimma", effect: { type: 'PASSIVE_TALENT', talentId: 'soothing_mist' } },
    { threshold: 15, description: "+10% Resursregeneration", effect: { type: 'RESOURCE_REGEN', stat: 'intelligence', value: 10, isPercentage: true } },
    { threshold: 20, description: "+10% Vatten- och Eldresistans", effect: { type: 'RESISTANCE', element: Element.WATER, value: 10, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Renande Gejser", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'cleansing_geyser' } },
  ],
  [Element.SAND]: [
    { threshold: 1, description: "+10% chans att sakta ner fiender", effect: { type: 'STAT_BONUS', stat: 'dexterity', value: 10, isPercentage: true } },
    { threshold: 5, description: "+5% Undvikandechans", effect: { type: 'STAT_BONUS', stat: 'undvikandechans', value: 5, isPercentage: true } },
    { threshold: 10, description: "Låser upp passiv talang: Skiftande Sand", effect: { type: 'PASSIVE_TALENT', talentId: 'shifting_sands' } },
    { threshold: 15, description: "+15% Sandskada", effect: { type: 'DAMAGE_BONUS', element: Element.SAND, value: 15, isPercentage: true } },
    { threshold: 20, description: "+10% Jord- och Vindresistans", effect: { type: 'RESISTANCE', element: Element.EARTH, value: 10, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Ökenstorm", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'desert_storm' } },
  ],
  [Element.EROSION]: [
    { threshold: 1, description: "-5% fienderustning", effect: { type: 'STAT_BONUS', stat: 'armor', value: -5, isPercentage: true } },
    { threshold: 5, description: "+5% Kritisk Träff", effect: { type: 'STAT_BONUS', stat: 'kritiskTräff', value: 5, isPercentage: true } },
    { threshold: 10, description: "Låser upp passiv talang: Malande Vindar", effect: { type: 'PASSIVE_TALENT', talentId: 'grinding_winds' } },
    { threshold: 15, description: "-10% fienderustning", effect: { type: 'STAT_BONUS', stat: 'armor', value: -10, isPercentage: true } },
    { threshold: 20, description: "+10% Vind- och Jordresistans", effect: { type: 'RESISTANCE', element: Element.WIND, value: 10, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Dammvirvel", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'dust_devil' } },
  ],
  [Element.MUD]: [
    { threshold: 1, description: "+10% chans att rota fiender", effect: { type: 'STAT_BONUS', stat: 'constitution', value: 10, isPercentage: true } },
    { threshold: 5, description: "+10 Max Hälsa", effect: { type: 'STAT_BONUS', stat: 'constitution', value: 10 } },
    { threshold: 10, description: "Låser upp passiv talang: Klibbig Myr", effect: { type: 'PASSIVE_TALENT', talentId: 'sticky_mire' } },
    { threshold: 15, description: "+15% Lerskada", effect: { type: 'DAMAGE_BONUS', element: Element.MUD, value: 15, isPercentage: true } },
    { threshold: 20, description: "+10% Jord- och Vattenresistans", effect: { type: 'RESISTANCE', element: Element.EARTH, value: 10, isPercentage: true } },
    { threshold: 25, description: "Låser upp ultimat förmåga: Kärr", effect: { type: 'ULTIMATE_ABILITY', abilityId: 'quagmire' } },
  ],
  [Element.GROWTH]: [
    { threshold: 1, description: "+5% regenerering", effect: { type: 'HEAL_BONUS', value: 5, isPercentage: true } },
    { threshold: 5, description: "+10 Max Hälsa", effect: { type: 'STAT_BONUS', stat: 'constitution', value: 10 } },
    { threshold: 10<dyad-problem-report summary="14 problems">
<problem file="constants.tsx" line="486" column="37" code="2322">Type '{ type: string; duration: number; damage: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="494" column="37" code="2322">Type '{ type: string; duration: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="510" column="37" code="2322">Type '{ type: string; duration: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="518" column="37" code="2322">Type '{ type: string; duration: number; accuracyReduction: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="534" column="37" code="2322">Type '{ type: string; duration: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="542" column="37" code="2322">Type '{ type: string; duration: number; value: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="550" column="37" code="2322">Type '{ type: string; duration: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="566" column="37" code="2322">Type '{ type: string; duration: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="574" column="37" code="2322">Type '{ type: string; duration: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="591" column="37" code="2322">Type '{ type: string; duration: number; value: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
<problem file="constants.tsx" line="683" column="44" code="2322">Type '&quot;cleanse_debuffs&quot;' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | ... 9 more ... | &quot;damage_reduction_buff&quot;'.</problem>
<problem file="constants.tsx" line="801" column="44" code="2322">Type '&quot;cleanse_all_debuffs&quot;' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | ... 9 more ... | &quot;damage_reduction_buff&quot;'.</problem>
<problem file="constants.tsx" line="888" column="79" code="2322">Type '&quot;APPLY_STATUS&quot;' is not assignable to type '&quot;HEAL_BONUS&quot; | &quot;STAT_BONUS&quot; | &quot;RESOURCE_REGEN&quot; | &quot;RESISTANCE&quot; | &quot;DAMAGE_BONUS&quot; | &quot;PASSIVE_TALENT&quot; | &quot;ULTIMATE_ABILITY&quot;'.</problem>
<problem file="constants.tsx" line="996" column="41" code="2322">Type '{ type: string; duration: number; damage: number; }' is not assignable to type '&quot;defending&quot; | &quot;hasted&quot; | &quot;burning&quot; | &quot;poisoned&quot; | &quot;slowed&quot; | &quot;retaliating&quot; | &quot;blinded&quot; | &quot;full_flow&quot; | &quot;overheated&quot; | &quot;rooted&quot; | &quot;steamed&quot; | &quot;regenerating&quot; | &quot;armor_reduction&quot; | &quot;stunned&quot; | &quot;frozen&quot; | &quot;damage_reduction&quot;'.</problem>
</dyad-problem-report>Absolut! Jag ser att de återstående felen handlar om att `status` egenskapen i `APPLY_STATUS` effekterna förväntar sig en strängliteral (t.ex. `'burning'`) men får ett helt objekt (t.ex. `{ type: 'burning', duration: 2, damage: 3 }`). Dessutom finns det några fel där `buff` i `UltimateAbility` förväntar sig en `StatusEffect['type']` men får en strängliteral som inte är en del av den typen.

Jag kommer att åtgärda detta genom att:

1.  **Uppdatera `PassiveTalent['effect']` och `ItemAffix['effect']` i `types.ts`** så att `APPLY_STATUS` effekten direkt tar `StatusEffect['type']` som en strängliteral för `status` egenskapen, och sedan inkluderar de andra egenskaperna (som `duration`, `value`, `damage`, `accuracyReduction`) direkt i `APPLY_STATUS` objektet. Detta gör att vi kan definiera hela statuseffekten inom `effect` objektet.
2.  **Justera `UltimateAbility['effect']` i `types.ts`** för att inkludera de specifika strängliteralerna `'pushed_back'`, `'cleanse_debuffs_action'`, `'cleanse_all_debuffs_action'`, `'armor_reduction_buff'`, `'stunned_buff'`, `'frozen_buff'`, och `'damage_reduction_buff'` som möjliga `buff`-typer, utöver `StatusEffect['type']`. Detta löser felen där dessa strängar inte matchade `StatusEffect['type']`.
3.  **Justera `constants.tsx`** för att matcha de nya typdefinitionerna.

Här är den uppdaterade koden:

<dyad-write path="types.ts" description="Uppdaterar typdefinitioner för PassiveTalent, UltimateAbility och ItemAffix för att hantera nya effekttyper och buff-namn korrekt.">
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

// --- UPDATERAD PassiveTalent interface ---
export interface PassiveTalent {
  id: string;
  name: string;
  description: string;
  element: Element;
  icon: React.FC;
  effect:
    | { type: 'COUNTER_ATTACK'; element?: Element; damage?: number; chance?: number; }
    | { type: 'HEAL_BONUS'; value?: number; isPercentage?: boolean; }
    | { type: 'RESOURCE_GAIN'; stat?: keyof CharacterStats | 'aether' | 'undvikandechans' | 'kritiskTräff' | 'skada' | 'rustning'; value?: number; isPercentage?: boolean; }
    | { type: 'APPLY_STATUS'; status: StatusEffect['type']; chance: number; duration?: number; value?: number; isPercentage?: boolean; damage?: number; accuracyReduction?: number; } // Added damage, accuracyReduction
    | { type: 'DEAL_ELEMENTAL_DAMAGE'; element: Element; damage: number; chance: number; }
    | { type: 'STAT_BONUS'; stat: keyof CharacterStats | 'skada' | 'rustning' | 'undvikandechans' | 'kritiskTräff'; value: number; isPercentage?: boolean; };
}

// --- UPDATERAD UltimateAbility interface ---
export interface UltimateAbility {
  id: string;
  name: string;
  description: string;
  element: Element;
  icon: React.FC;
  cooldown: number; // In turns
  effect:
    | { type: 'AOE_DAMAGE'; damage?: number; buff?: StatusEffect['type'] | 'pushed_back' | 'armor_reduction_buff' | 'stunned_buff' | 'frozen_buff' | 'cleanse_debuffs_action' | 'cleanse_all_debuffs_action'; duration?: number; value?: number; isPercentage?: boolean; }
    | { type: 'MASS_HEAL'; heal?: number; buff?: StatusEffect['type'] | 'cleanse_debuffs_action' | 'cleanse_all_debuffs_action'; duration?: number; value?: number; isPercentage?: boolean; }
    | { type: 'GLOBAL_BUFF'; buff?: StatusEffect['type'] | 'damage_reduction_buff'; duration?: number; value?: number; isPercentage?: boolean; }
    | { type: 'SINGLE_TARGET_DAMAGE'; damage?: number; buff?: StatusEffect['type'] | 'frozen_buff'; duration?: number; value?: number; isPercentage?: boolean; };
}

// --- UPDATERAD ElementalBonus interface ---
export interface ElementalBonus {
  threshold: number; // Points needed to unlock this bonus
  description: string;
  effect: {
    type: 'STAT_BONUS' | 'RESOURCE_REGEN' | 'RESISTANCE' | 'DAMAGE_BONUS' | 'PASSIVE_TALENT' | 'ULTIMATE_ABILITY' | 'HEAL_BONUS';
    stat?: keyof CharacterStats | 'skada' | 'rustning' | 'undvikandechans' | 'kritiskTräff' | 'damage' | 'armor' | 'aether';
    element?: Element;
    value?: number; // Flat value or percentage
    isPercentage?: boolean;
    talentId?: string; // For PASSIVE_TALENT
    abilityId?: string; // For ULTIMATE_ABILITY
  };
}

export interface Character {
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
  elementalAffinities: Partial<Record<Element, number>>; // New: Points in each element
  unlockedPassiveTalents: string[]; // New: IDs of unlocked passive talents
  unlockedUltimateAbilities: string[]; // New: IDs of unlocked ultimate abilities
}

export type View = 'skillTree' | 'characterSheet' | 'inventory' | 'event' | 'deck' | 'debug';

// --- Complex Inventory & Item System ---

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
    damage?: number; // Added for burning/poisoned
    accuracyReduction?: number; // Added for steamed
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

// --- Event & Combat System ---
export interface AbilityRankData {
  description: string;
  resourceCost: number;
  damageMultiplier?: number; // e.g., 1.2 for 120% of calculated base skill damage
  dotDamage?: number;        // flat damage for DoT effects
  healMultiplier?: number;   // e.g., 0.25 for 25% max HP
  duration?: number;         // in turns for buffs/debuffs
  chance?: number;           // e.g., 0.25 for 25% chance to apply effect
}

export interface PlayerAbility {
  id: string; // Corresponds to skill ID
  name: string;
  element: Element;
  isAoe?: boolean; // Flag for area-of-effect abilities
  category?: 'damage' | 'heal' | 'buff' | 'cc';
  ranks: AbilityRankData[];
  cooldown?: number; // NEW: Cooldown in turns
  currentCooldown?: number; // NEW: Current cooldown
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
  resistances?: Partial<Record<Element, number>>; // E.g. { [Element.FIRE]: 50, [Element.WATER]: -25 }
  icon: React.FC;
  ability?: 'HASTE_SELF';
  onHitEffect?: 
    | { type: 'burning'; duration: number; damage: number }
    | { type: 'poison'; duration: number; damage: number }
    | { type: 'slow'; duration: number };
}

// NEW: Environment effects
export interface EnvironmentEffect {
  description: string;
  type: 'dot' | 'status_apply' | 'stat_modifier' | 'atb_modifier';
  element?: Element; // Element associated with the effect (e.g., fire for burning ground)
  value?: number; // Damage for dot, stat change for stat_modifier, ATB change (percentage)
  status?: StatusEffect['type']; // For status_apply
  statusDuration?: number;
  statusChance?: number; // Chance to apply status
  targetScope: 'all' | 'player' | 'enemies' | 'non_elemental' | 'elemental';
  targetElement?: Element; // If scope is non_elemental/elemental
}

export interface Environment {
  name: string;
  description: string;
  element: Element; // Primary element of the environment
  effects: EnvironmentEffect[];
}

export interface EventModifier {
  description: string;
  effect: 'player_stat' | 'enemy_stat' | 'reward_bonus'; // Environment effects are now handled by the Environment interface
  stat?: 'damage' | 'health' | 'armor' | 'crit' | 'dodge';
  value?: number;
  isPercentage?: boolean;
}

export interface GameEvent {
  title: string;
  description: string;
  element: Element;
  modifiers: EventModifier[];
  environment?: Environment; // NEW: Optional environment for the combat
  enemies: Enemy[];
  rewards: {
    xp: number;
    items: Item[];
  };
}

// --- UPDATERAD StatusEffect type ---
export type StatusEffect = 
  | { type: 'defending'; duration: number; value?: number; } // Added value for potential armor bonus
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
  | { type: 'armor_reduction'; duration: number; value: number; } // New: for reducing armor
  | { type: 'stunned'; duration: number; } // New: for stunning
  | { type: 'frozen'; duration: number; } // New: for freezing
  | { type: 'damage_reduction'; duration: number; value: number; isPercentage?: boolean; }; // New: for global damage reduction


export interface CombatLogMessage {
  id: number;
  text: string;
  type: 'player' | 'enemy' | 'system' | 'reward';
}

// --- New Deck & Card System ---
export type EventType = 'COMBAT' | 'CHOICE' | 'BOON' | 'CURSE';

export interface Outcome {
    log: string;
    xp?: number;
    healthChange?: number; // Can be negative. Number is direct value, not percentage.
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