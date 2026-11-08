import type { SaveData } from '../save';

const ARCHETYPES = new Set([
  'Pyromanten',
  'Stenväktaren',
  'Stormdansaren',
  'Tidvattenvävaren',
  'Ljusbringaren',
  'Skuggvävaren',
]);

const EQUIPMENT_SLOTS = new Set([
  'Hjälm',
  'Bröst',
  'Vapen 1',
  'Vapen 2',
  'Handskar',
  'Bälte',
  'Byxor',
  'Stövlar',
]);

const ITEM_SLOTS = new Set([...EQUIPMENT_SLOTS, 'Föremål']);
const RARITIES = new Set(['Vanlig', 'Magisk', 'Sällsynt', 'Legendarisk']);
const VIEWS = new Set(['skillTree', 'characterSheet', 'inventory', 'event', 'deck', 'debug']);
const STATUS_EFFECTS = new Set([
  'defending',
  'hasted',
  'burning',
  'poisoned',
  'slowed',
  'retaliating',
  'blinded',
  'full_flow',
  'overheated',
  'rooted',
  'steamed',
  'regenerating',
  'armor_reduction',
  'stunned',
  'frozen',
  'paralyzed',
  'damage_reduction',
  'bleeding',
  'frightened',
  'reflecting',
  'absorbing',
  'petrified',
  'frail',
]);

const ITEM_STAT_KEYS = new Set([
  'strength',
  'dexterity',
  'intelligence',
  'constitution',
  'skada',
  'rustning',
  'undvikandechans',
  'kritiskTräff',
]);

const CHARACTER_STAT_KEYS = ['strength', 'dexterity', 'intelligence', 'constitution'];

export const SAVE_VERSION = 1;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasOptionalNumber(object: Record<string, unknown>, key: string): boolean {
  return object[key] === undefined || isFiniteNumber(object[key]);
}

function isEnumElement(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 21;
}

function isCharacter(value: unknown): boolean {
  if (!isObject(value) || typeof value.name !== 'string' || !ARCHETYPES.has(String(value.archetype))) return false;
  if (value.secondaryArchetype !== undefined && !ARCHETYPES.has(String(value.secondaryArchetype))) return false;
  if (!isFiniteNumber(value.level) || !isObject(value.experience)) return false;
  if (!isFiniteNumber(value.experience.current) || !isFiniteNumber(value.experience.max)) return false;
  if (!isObject(value.stats) || !CHARACTER_STAT_KEYS.every(key => isFiniteNumber(value.stats[key]))) return false;

  if (!isObject(value.resources) || !isObject(value.resources.health) || !isObject(value.resources.aether)) return false;
  if (!isFiniteNumber(value.resources.health.current) || !isFiniteNumber(value.resources.health.max)) return false;
  if (!isFiniteNumber(value.resources.aether.current) || !isFiniteNumber(value.resources.aether.max)) return false;
  if (typeof value.resources.aether.name !== 'string') return false;

  if (!isObject(value.elementalAffinities) || !Object.entries(value.elementalAffinities).every(
    ([element, affinity]) => /^\d+$/.test(element) && isEnumElement(Number(element)) && isFiniteNumber(affinity),
  )) return false;

  return Array.isArray(value.unlockedPassiveTalents)
    && value.unlockedPassiveTalents.every(talent => typeof talent === 'string')
    && Array.isArray(value.unlockedUltimateAbilities)
    && value.unlockedUltimateAbilities.every(ability => typeof ability === 'string');
}

function isItemStats(value: unknown): boolean {
  return isObject(value) && Object.entries(value).every(
    ([key, stat]) => ITEM_STAT_KEYS.has(key) && isFiniteNumber(stat),
  );
}

function isAffix(value: unknown): boolean {
  if (!isObject(value)
    || !['ON_HIT', 'ON_TAKE_DAMAGE', 'PASSIVE'].includes(String(value.trigger))
    || typeof value.description !== 'string'
    || !isObject(value.effect)) return false;

  const effect = value.effect;
  if (effect.type === 'DEAL_ELEMENTAL_DAMAGE') {
    return isEnumElement(effect.element) && isFiniteNumber(effect.damage) && isFiniteNumber(effect.chance);
  }
  if (effect.type !== 'APPLY_STATUS' || !STATUS_EFFECTS.has(String(effect.status)) || !isFiniteNumber(effect.chance)) return false;

  return hasOptionalNumber(effect, 'duration')
    && hasOptionalNumber(effect, 'value')
    && hasOptionalNumber(effect, 'damage')
    && hasOptionalNumber(effect, 'accuracyReduction')
    && (effect.element === undefined || isEnumElement(effect.element))
    && (effect.isPercentage === undefined || typeof effect.isPercentage === 'boolean');
}

function isConsumableEffect(value: unknown): boolean {
  if (!isObject(value) || typeof value.description !== 'string') return false;

  if (['HEAL', 'AETHER', 'REVIVE'].includes(String(value.type))) {
    return isFiniteNumber(value.value);
  }
  if (value.type !== 'BUFF' || !STATUS_EFFECTS.has(String(value.status)) || !isFiniteNumber(value.duration)) return false;

  return hasOptionalNumber(value, 'value') && hasOptionalNumber(value, 'damage');
}

function isSerializableItem(value: unknown): boolean {
  if (!isObject(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || !RARITIES.has(String(value.rarity))
    || !ITEM_SLOTS.has(String(value.slot))
    || !isItemStats(value.stats)) return false;

  return (value.affix === undefined || isAffix(value.affix))
    && hasOptionalNumber(value, 'price')
    && (value.consumableEffect === undefined || isConsumableEffect(value.consumableEffect))
    && (value.isRelic === undefined || typeof value.isRelic === 'boolean');
}

export function isSaveDataV1(value: unknown): value is SaveData {
  if (!isObject(value)
    || value.version !== SAVE_VERSION
    || !isFiniteNumber(value.timestamp)
    || !isCharacter(value.character)
    || !isFiniteNumber(value.skillPoints)
    || !isFiniteNumber(value.attributePoints)
    || !isFiniteNumber(value.elementalPoints)
    || !isFiniteNumber(value.gold)
    || !isFiniteNumber(value.roundLevel)
    || typeof value.gameStarted !== 'boolean'
    || !VIEWS.has(String(value.activeView))) return false;

  if (!Array.isArray(value.unlockedSkillEntries) || !value.unlockedSkillEntries.every(
    entry => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === 'string' && isFiniteNumber(entry[1]),
  )) return false;

  if (!isObject(value.equipment) || !Object.entries(value.equipment).every(
    ([slot, item]) => EQUIPMENT_SLOTS.has(slot) && (item === null || isSerializableItem(item)),
  )) return false;

  return Array.isArray(value.inventory) && value.inventory.every(isSerializableItem);
}
