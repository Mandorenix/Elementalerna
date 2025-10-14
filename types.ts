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
    status: StatusEffect;
    chance: number;
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

export interface EventModifier {
  description: string;
  effect: 'player_stat' | 'enemy_stat' | 'reward_bonus' | 'environment_dot';
  stat?: 'damage' | 'health' | 'armor' | 'crit' | 'dodge';
  value?: number;
  isPercentage?: boolean;
}

export interface GameEvent {
  title: string;
  description: string;
  element: Element;
  modifiers: EventModifier[];
  enemies: Enemy[];
  rewards: {
    xp: number;
    items: Item[];
  };
}

export type StatusEffect = 
  | { type: 'defending'; duration: number }
  | { type: 'hasted'; duration: number }
  | { type: 'burning'; duration: number; damage: number }
  | { type: 'poisoned'; duration: number; damage: number }
  | { type: 'slowed'; duration: number }
  | { type: 'retaliating'; duration: number; damage: number }
  | { type: 'blinded'; duration: number }
  | { type: 'full_flow'; duration: number }
  | { type: 'overheated'; duration: number }
  | { type: 'rooted'; duration: number }
  | { type: 'regenerating'; duration: number; heal: number };


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