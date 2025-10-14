import { type Character, type Enemy, type StatusEffect, Element } from '../types';
import { getCharacterDodgeChance, getCharacterArmor } from './characterStats';

export const calculateDamage = (
  attacker: Character | Enemy,
  defender: Character | Enemy,
  baseDamage: number,
  element: Element,
  isCritical: boolean,
  isPlayerAttacking: boolean,
): { damage: number; isCritical: boolean; isDodged: boolean; isReflected: boolean; reflectedDamage: number } => {
  let totalDamage = baseDamage;
  let isDodged = false;
  let isReflected = false;
  let reflectedDamage = 0;

  // 1. Dodge Chance
  const dodgeChance = isPlayerAttacking ? getCharacterDodgeChance(defender as Character) : 0;
  if (Math.random() * 100 < dodgeChance) {
    isDodged = true;
    return { damage: 0, isCritical: false, isDodged: true, isReflected: false, reflectedDamage: 0 };
  }

  // 2. Critical Hit
  if (isCritical) {
    totalDamage *= 1.5;
  }

  // 3. Elemental Resistances/Weaknesses (for enemies)
  if (!isPlayerAttacking && (defender as Enemy).resistances) {
    const resistance = (defender as Enemy).resistances?.[element] || 0;
    totalDamage *= (100 - resistance) / 100;
  }

  // 4. Armor Reduction
  const armor = isPlayerAttacking ? getCharacterArmor(defender as Character) : (defender as Enemy).stats.armor;
  totalDamage -= armor * 0.5;

  // Ensure damage is not negative
  totalDamage = Math.max(1, totalDamage);

  // 5. Reflecting Status Effect
  const reflectingEffect = defender.statusEffects?.find(e => e.type === 'reflecting') as (StatusEffect & { element: Element; value: number }) | undefined;
  if (reflectingEffect && reflectingEffect.element === element) {
    isReflected = true;
    reflectedDamage = totalDamage * (reflectingEffect.value / 100);
    totalDamage -= reflectedDamage;
  }

  // 6. Absorbing Status Effect
  const absorbingEffect = defender.statusEffects?.find(e => e.type === 'absorbing') as (StatusEffect & { element: Element; value: number }) | undefined;
  if (absorbingEffect && absorbingEffect.element === element) {
    totalDamage *= (100 - absorbingEffect.value) / 100;
  }

  return { damage: Math.floor(totalDamage), isCritical, isDodged, isReflected, reflectedDamage };
};