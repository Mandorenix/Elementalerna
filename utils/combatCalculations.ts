import {
  type Character,
  type Enemy,
  type PlayerAbility,
  type UltimateAbility,
  type CombatLogMessage,
} from '../types';
import { createLogMessage } from './combatLog';
import { applyPlayerAbility } from './playerAbilities';
import { processEnemyTurn } from './enemyAI';
import { applyStatusEffectDamageAndDuration } from './statusEffects';

// This file now acts as an orchestrator for combat logic,
// importing functions from more specialized modules.

export { createLogMessage } from './combatLog';
export { getCharacterDamage, getCharacterArmor, getCharacterCritChance, getCharacterDodgeChance, getElementalDamageBonus, getHealingBonus } from './characterStats';
export { applyStatusEffect, removeStatusEffect, applyStatusEffectDamageAndDuration } from './statusEffects';
export { calculateDamage } from './damageCalculations';
export { applyPlayerAbility } from './playerAbilities';
export { processEnemyTurn } from './enemyAI';
export { getRandom } from './utils';

// You can add higher-level combat orchestration functions here if needed,
// which would then call functions from the imported modules.