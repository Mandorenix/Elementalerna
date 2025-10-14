import { type Character, type Enemy, type StatusEffect, type CombatLogMessage } from '../types';
import { createLogMessage } from './combatLog';

// Helper to apply a status effect
export const applyStatusEffect = (target: Character | Enemy, effect: StatusEffect): (Character | Enemy) => {
  const existingEffectIndex = target.statusEffects?.findIndex(e => e.type === effect.type);

  if (existingEffectIndex !== undefined && existingEffectIndex !== -1) {
    // If effect exists, refresh duration and potentially update value
    const updatedEffects = [...(target.statusEffects || [])];
    updatedEffects[existingEffectIndex] = { ...updatedEffects[existingEffectIndex], ...effect };
    return { ...target, statusEffects: updatedEffects };
  } else {
    // Add new effect
    return { ...target, statusEffects: [...(target.statusEffects || []), effect] };
  }
};

// Helper to remove a status effect
export const removeStatusEffect = (target: Character | Enemy, effectType: StatusEffect['type']): (Character | Enemy) => {
  return { ...target, statusEffects: target.statusEffects?.filter(e => e.type !== effectType) };
};

export const applyStatusEffectDamageAndDuration = (
  player: Character,
  enemies: Enemy[],
): { updatedPlayer: Character; updatedEnemies: Enemy[]; log: CombatLogMessage[] } => {
  const log: CombatLogMessage[] = [];
  let updatedPlayer = { ...player };
  let updatedEnemies = [...enemies];

  // Process player's status effects
  updatedPlayer.statusEffects = updatedPlayer.statusEffects?.map(effect => {
    let newEffect = { ...effect };
    switch (effect.type) {
      case 'burning':
        if ('damage' in effect) {
          updatedPlayer.resources.health.current = Math.max(0, updatedPlayer.resources.health.current - effect.damage);
          log.push(createLogMessage(`${updatedPlayer.name} tar ${effect.damage} eldskada från brännskada.`, 'player'));
        }
        break;
      case 'poisoned':
        if ('damage' in effect) {
          updatedPlayer.resources.health.current = Math.max(0, updatedPlayer.resources.health.current - effect.damage);
          log.push(createLogMessage(`${updatedPlayer.name} tar ${effect.damage} giftskada från förgiftning.`, 'player'));
        }
        break;
      case 'regenerating':
        if ('heal' in effect) {
          updatedPlayer.resources.health.current = Math.min(updatedPlayer.resources.health.max, updatedPlayer.resources.health.current + effect.heal);
          log.push(createLogMessage(`${updatedPlayer.name} läker ${effect.heal} hälsa från regenerering.`, 'player'));
        }
        break;
      case 'bleeding':
        if ('damage' in effect) {
          updatedPlayer.resources.health.current = Math.max(0, updatedPlayer.resources.health.current - effect.damage);
          log.push(createLogMessage(`${updatedPlayer.name} tar ${effect.damage} skada från blödning.`, 'player'));
        }
        break;
    }
    newEffect.duration--;
    return newEffect;
  }).filter(effect => effect.duration > 0);

  // Process enemies' status effects
  updatedEnemies = updatedEnemies.map(enemy => {
    let updatedEnemy = { ...enemy };
    updatedEnemy.statusEffects = updatedEnemy.statusEffects?.map(effect => {
      let newEffect = { ...effect };
      switch (effect.type) {
        case 'burning':
          if ('damage' in effect) {
            updatedEnemy.stats.health = Math.max(0, updatedEnemy.stats.health - effect.damage);
            log.push(createLogMessage(`${updatedEnemy.name} tar ${effect.damage} eldskada från brännskada.`, 'enemy'));
          }
          break;
        case 'poisoned':
          if ('damage' in effect) {
            updatedEnemy.stats.health = Math.max(0, updatedEnemy.stats.health - effect.damage);
            log.push(createLogMessage(`${updatedEnemy.name} tar ${effect.damage} giftskada från förgiftning.`, 'enemy'));
          }
          break;
        case 'bleeding':
          if ('damage' in effect) {
            updatedEnemy.stats.health = Math.max(0, updatedEnemy.stats.health - effect.damage);
            log.push(createLogMessage(`${updatedEnemy.name} tar ${effect.damage} skada från blödning.`, 'enemy'));
          }
          break;
      }
      newEffect.duration--;
      return newEffect;
    }).filter(effect => effect.duration > 0);
    return updatedEnemy;
  });

  return { updatedPlayer, updatedEnemies, log };
};