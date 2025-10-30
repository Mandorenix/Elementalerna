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
    | { type: 'APPLY_STATUS'; status: StatusEffect['type']; chance: number; duration?: number; value?: number; isPercentage?: boolean; damage?: number; accuracyReduction?: number; }
    | { type: 'DEAL_ELEMENTAL_DAMAGE'; element: Element; damage: number; chance: number; }
    | { type: 'STAT_BONUS'; stat: keyof CharacterStats | 'skada' | 'rustning' | 'undvikandechans' | 'kritiskTräff'; value: number; isPercentage?: boolean; };
}

export interface UltimateAbility {
  id: string;
  name: string;
  description?: string;
  element: Element;
  icon: React.FC;
  cooldown: number; // In turns
  targetType?: 'SINGLE_ENEMY' | 'ALL_ENEMIES' | 'LINE_AOE' | 'CIRCLE_AOE' | 'LOWEST_HP_ENEMY' | 'HIGHEST_HP_ENEMY' | 'SELF' | 'ALL_ALLIES'; // New
  effect:
    | { type: 'AOE_DAMAGE'; damage?: number; buff?: StatusEffect['type'] | 'pushed_back' | 'cleanse_debuffs_action' | 'cleanse_all_debuffs_action'; duration?: number; value?: number; isPercentage?: boolean; }
    | { type: 'MASS_HEAL'; heal?: number; buff?: StatusEffect['type'] | 'cleanse_debuffs_action' | 'cleanse_all_debuffs_action'; duration?: number; value?: number; isPercentage?: boolean; } // Added regenerating
    | { type: 'GLOBAL_BUFF'; buff?: StatusEffect['type']; duration?: number; value?: number; isPercentage?: boolean; }
    | { type: 'SINGLE_TARGET_DAMAGE'; damage?: number; buff?: StatusEffect['type']; duration?: number; value?: number; isPercentage?: boolean; };
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
  unlockedUltimateAbilities: string[];
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
    element?: Element; // Added for reflecting/absorbing
    isPercentage?: boolean; // Added for damage_reduction
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
  price?: number; // New: for merchant
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
  statusEffectsToApplyToSelf?: StatusEffect[]; // Changed from StatusEffect['type'][] to StatusEffect[]
  description?: string;
}

// New interface for on-hit effects that apply a status
export interface EnemyApplyStatusEffect {
  type: 'APPLY_STATUS';
  status: StatusEffect['type'];
  chance: number;
  duration?: number;
  value?: number; // For statuses like 'paralyzed' (chanceToMissTurn) or 'frail' (damageTakenIncrease)
  damage?: number; // For statuses like 'burning', 'poisoned'
  accuracyReduction?: number; // For 'steamed'
  isPercentage?: boolean; // For 'frail'
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
    | { type: 'slow'; duration: number }
    | EnemyApplyStatusEffect; // Allow applying any status effect
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
  stat?: keyof CharacterStats | 'damage' | 'armor' | 'crit' | 'dodge' | 'health'; // Added stat property
  isPercentage?: boolean; // Added isPercentage for stat_modifier
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

// New: Outcome interface
export interface Outcome {
  log: string;
  xp?: number;
  items?: Item[];
  healthChange?: number;
  goldChange?: number; // New: for merchant
}

// New: ChoiceOption interface
export interface ChoiceOption {
  buttonText: string;
  description: string;
  outcome: Outcome;
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
  | { type: 'frozen'; duration: number; } // New
  | { type: 'paralyzed'; duration: number; chanceToMissTurn: number; } // New
  | { type: 'damage_reduction'; duration: number; value: number; isPercentage?: boolean; }
  | { type: 'bleeding'; duration: number; damage: number; } // New
  | { type: 'frightened'; duration: number; chanceToMissTurn: number; chanceToAttackRandom: number; } // New
  | { type: 'reflecting'; duration: number; element: Element; value: number; } // New
  | { type: 'absorbing'; duration: number; element: Element; value: number; } // New
  | { type: 'petrified'; duration: number; damageTakenIncrease?: number; } // New: Förstenad
  | { type: 'frail'; duration: number; damageTakenIncrease: number; isPercentage?: boolean; } // New: Förgänglighet
  | { type: 'frightened'; duration: number; chanceToMissTurn: number; chanceToAttackRandom: number; }; // New: Fruktan

export interface CombatLogMessage {
  id: number;
  text: string;
  type: 'player' | 'enemy' | 'system' | 'reward';
}

export type EventType = 'COMBAT' | 'CHOICE' | 'BOON' | 'CURSE' | 'PUZZLE' | 'MERCHANT'; // New event types

export interface PuzzleChallenge {
    challengeText: string;
    statCheck?: keyof CharacterStats;
    elementalCheck?: Element;
    threshold: number; // Value needed for stat/affinity check
    successOutcome: Outcome;
    failureOutcome: Outcome;
    options?: ChoiceOption[]; // Optional choices for puzzle
}

export interface MerchantOffer {
    itemsForSale: Item[];
    currencyName: string; // e.g., "Guld"
    playerCurrency: number; // How much player has
    onPurchase: (item: Item) => Outcome;
    onLeave: Outcome;
}

export type DamagePopupType = 'damage' | 'crit' | 'heal' | 'miss' | 'status_damage' | 'resisted' | 'weakness'; // Added 'resisted' and 'weakness'

export interface EventCard {
    id: string;
    title: string;
    description: string;
    icon: React.FC;
    element: Element;
    type: EventType;
    payload: GameEvent | { options: ChoiceOption[] } | Outcome | PuzzleChallenge | MerchantOffer; // Updated payload
    isBoss?: boolean;
}