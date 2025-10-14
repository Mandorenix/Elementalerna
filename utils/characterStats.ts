import { type Character, Element, type ItemStats } from '../types';
import { ELEMENTAL_AFFINITY_BONUSES } from '../constants'; // Korrigerad import

// Helper to get a character's total damage (base + stat bonuses)
export const getCharacterDamage = (character: Character): number => {
  const weaponDamage = character.equippedItems.find(item => item.slot === 'Vapen 1')?.stats.skada || 0;
  const strBonus = character.stats.strength * 0.5;
  const intBonus = character.stats.intelligence * 0.5;
  return weaponDamage + strBonus + intBonus;
};

// Helper to get a character's total armor
export const getCharacterArmor = (character: Character): number => {
  const equippedArmor = character.equippedItems.reduce((sum, item) => sum + (item.stats.rustning || 0), 0);
  const conBonus = character.stats.constitution * 0.5;
  return equippedArmor + conBonus;
};

// Helper to get a character's critical hit chance
export const getCharacterCritChance = (character: Character): number => {
  const equippedCrit = character.equippedItems.reduce((sum, item) => sum + (item.stats.kritiskTräff || 0), 0);
  const dexBonus = character.stats.dexterity * 0.2;
  return equippedCrit + dexBonus;
};

// Helper to get a character's dodge chance
export const getCharacterDodgeChance = (character: Character): number => {
  const equippedDodge = character.equippedItems.reduce((sum, item) => sum + (item.stats.undvikandechans || 0), 0);
  const dexBonus = character.stats.dexterity * 0.3;
  return equippedDodge + dexBonus;
};

// Helper to calculate elemental damage bonus
export const getElementalDamageBonus = (character: Character, element: Element): number => {
  const affinity = character.elementalAffinities[element] || 0;
  let bonus = 0;
  const fireBonuses = ELEMENTAL_AFFINITY_BONUSES[Element.FIRE]; // Använder korrekta konstanten
  if (element === Element.FIRE && fireBonuses) {
    fireBonuses.forEach(b => {
      if (affinity >= b.threshold && b.effect.type === 'STAT_BONUS' && b.effect.stat === 'skada' && b.effect.isPercentage && b.effect.element === Element.FIRE) {
        bonus += b.effect.value || 0;
      }
    });
  }
  return bonus;
};

// Helper to calculate healing bonus
export const getHealingBonus = (character: Character): number => {
  const waterAffinities = character.elementalAffinities[Element.WATER] || 0;
  let bonus = 0;
  const waterBonuses = ELEMENTAL_AFFINITY_BONUSES[Element.WATER]; // Använder korrekta konstanten
  if (waterBonuses) {
    waterBonuses.forEach(b => {
      if (waterAffinities >= b.threshold && b.effect.type === 'HEAL_BONUS' && b.effect.isPercentage) {
        bonus += b.effect.value || 0;
      }
    });
  }
  return bonus;
};