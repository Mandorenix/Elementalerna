import type { Character, CharacterStats, EquipmentSlot, Item, ItemStats, PlayerAbility } from '../types';

export interface PlayerCombatStats {
  health: number;
  maxHealth: number;
  aether: number;
  maxAether: number;
  resourceName: string;
  damage: number;
  armor: number;
  dodge: number;
  crit: number;
  intelligence: number;
  abilities: PlayerAbility[];
  totalStats: CharacterStats;
}

const createEmptyItemStats = (): Required<ItemStats> => ({
  strength: 0,
  dexterity: 0,
  intelligence: 0,
  constitution: 0,
  skada: 0,
  rustning: 0,
  undvikandechans: 0,
  kritiskTräff: 0,
});

function sumItemStats(items: (Item | null)[]): Required<ItemStats> {
  return items.reduce<Required<ItemStats>>((totals, item) => {
    if (!item) return totals;

    for (const key of Object.keys(totals) as Array<keyof ItemStats>) {
      const value = item.stats[key];
      if (value !== undefined) totals[key] += value;
    }

    return totals;
  }, createEmptyItemStats());
}

export function calculatePlayerCombatStats(
  character: Character | null,
  equipment: Record<EquipmentSlot, Item | null>,
  inventory: Item[],
  unlockedSkills: ReadonlyMap<string, number>,
  abilities: PlayerAbility[],
): PlayerCombatStats | null {
  if (!character) return null;

  const equipmentStats = sumItemStats(Object.values(equipment));
  const relicStats = sumItemStats(inventory.filter(item => item.isRelic));
  const totalStats: CharacterStats = {
    strength: character.stats.strength + equipmentStats.strength + relicStats.strength,
    dexterity: character.stats.dexterity + equipmentStats.dexterity + relicStats.dexterity,
    intelligence: character.stats.intelligence + equipmentStats.intelligence + relicStats.intelligence,
    constitution: character.stats.constitution + equipmentStats.constitution + relicStats.constitution,
  };

  const graniteRank = unlockedSkills.get('granite_stance') || 0;
  const tailwindRank = unlockedSkills.get('tailwind') || 0;

  return {
    health: character.resources.health.current,
    maxHealth: character.resources.health.max,
    aether: character.resources.aether.current,
    maxAether: character.resources.aether.max,
    resourceName: character.resources.aether.name,
    damage: (totalStats.strength * 2) + equipmentStats.skada + relicStats.skada,
    armor: Math.floor((totalStats.constitution * 1.5) + (totalStats.strength * 0.5) + equipmentStats.rustning + relicStats.rustning) + (graniteRank * 4),
    dodge: (totalStats.dexterity * 0.5) + equipmentStats.undvikandechans + relicStats.undvikandechans + (tailwindRank * 3),
    crit: (totalStats.dexterity * 0.2) + equipmentStats.kritiskTräff + relicStats.kritiskTräff,
    intelligence: totalStats.intelligence,
    abilities,
    totalStats,
  };
}
