import {
  type Character,
  type Enemy,
  type CombatLogMessage,
  type EnemyAbility,
  type StatusEffect,
} from '../types';
import { ENEMY_ABILITIES } from '../constants';
import { createLogMessage } from './combatLog';
import { calculateDamage } from './damageCalculations';
import { applyStatusEffect } from './statusEffects';
import { getRandom } from './utils';

export const processEnemyTurn = (
  player: Character,
  enemies: Enemy[],
  currentEnemy: Enemy,
): { updatedPlayer: Character; updatedEnemies: Enemy[]; log: CombatLogMessage[]; damageToPlayer: number } => {
  let updatedPlayer = { ...player };
  let updatedEnemies = [...enemies];
  const log: CombatLogMessage[] = [];
  let damageToPlayer = 0;

  // Check for Paralyzed/Frozen status
  const isParalyzed = currentEnemy.statusEffects?.some(e => e.type === 'paralyzed');
  const isFrozen = currentEnemy.statusEffects?.some(e => e.type === 'frozen');
  if (isParalyzed || isFrozen) {
    log.push(createLogMessage(`${currentEnemy.name} är ${isParalyzed ? 'förlamad' : 'frusen'} och kan inte agera!`, 'enemy'));
    return { updatedPlayer, updatedEnemies, log, damageToPlayer };
  }

  // Check for Frightened status
  const frightenedEffect = currentEnemy.statusEffects?.find(e => e.type === 'frightened') as (StatusEffect & { chanceToMissTurn: number; chanceToAttackRandom: number }) | undefined;
  if (frightenedEffect && Math.random() < frightenedEffect.chanceToMissTurn) {
    log.push(createLogMessage(`${currentEnemy.name} är skräckslagen och missar sin tur!`, 'enemy'));
    return { updatedPlayer, updatedEnemies, log, damageToPlayer };
  }

  // Determine enemy action based on behavior and abilities
  let chosenAbility: EnemyAbility | undefined;
  let targetForAbility: Character | Enemy | undefined = updatedPlayer; // Default target is player

  if (currentEnemy.abilities && currentEnemy.abilities.length > 0) {
    // Filter out abilities on cooldown
    const availableAbilities = currentEnemy.abilities.filter(ab => (ab.currentCooldown || 0) <= 0);

    if (availableAbilities.length > 0) {
      // Simple AI: Prioritize debuffs if player has no debuffs, then buffs if enemy needs buff, then damage
      if (currentEnemy.behavior === 'APPLY_DEBUFF_TO_PLAYER' && !updatedPlayer.statusEffects?.length) {
        chosenAbility = availableAbilities.find(ab => ab.category === 'cc' && ab.targetType === 'SINGLE_PLAYER');
      }
      if (!chosenAbility && currentEnemy.behavior === 'BUFF_SELF' && !currentEnemy.statusEffects?.some(e => e.type === 'defending' || e.type === 'hasted')) {
        chosenAbility = availableAbilities.find(ab => ab.category === 'buff' && ab.targetType === 'SELF');
        targetForAbility = currentEnemy;
      }
      if (!chosenAbility && currentEnemy.behavior === 'ATTACK_LOWEST_HP') {
        // In a single-player context, this is still the player
        chosenAbility = availableAbilities.find(ab => ab.category === 'damage' && ab.targetType === 'SINGLE_PLAYER');
      }
      if (!chosenAbility && currentEnemy.behavior === 'ATTACK_HIGHEST_DAMAGE_PLAYER') {
        // In a single-player context, this is still the player
        chosenAbility = availableAbilities.find(ab => ab.category === 'damage' && ab.targetType === 'SINGLE_PLAYER');
      }
      // Fallback to a random available ability if no specific behavior matched
      if (!chosenAbility) {
        chosenAbility = getRandom(availableAbilities);
      }
    }
  }

  // If no specific ability chosen, default to basic attack
  if (!chosenAbility) {
    chosenAbility = ENEMY_ABILITIES.basic_attack;
  }

  // Set cooldown for the chosen ability
  if (chosenAbility && chosenAbility.cooldown !== undefined) {
    currentEnemy.abilities = currentEnemy.abilities?.map(ab =>
      ab.id === chosenAbility?.id ? { ...ab, currentCooldown: chosenAbility.cooldown } : ab
    );
  }

  // Execute chosen ability
  if (chosenAbility) {
    log.push(createLogMessage(`${currentEnemy.name} använder ${chosenAbility.name}.`, 'enemy'));

    if (chosenAbility.category === 'damage') {
      const baseDamage = currentEnemy.stats.damage * (chosenAbility.damageMultiplier || 1);
      const { damage, isCritical, isDodged, isReflected, reflectedDamage } = calculateDamage(
        currentEnemy,
        updatedPlayer,
        baseDamage,
        chosenAbility.element,
        false, // Enemies don't crit for now
        false,
      );

      if (isDodged) {
        log.push(createLogMessage(`${updatedPlayer.name} undvek ${currentEnemy.name}s attack!`, 'player'));
      } else {
        updatedPlayer.resources.health.current = Math.max(0, updatedPlayer.resources.health.current - damage);
        damageToPlayer += damage;
        log.push(createLogMessage(`${currentEnemy.name} träffade ${updatedPlayer.name} för ${damage} skada!`, 'enemy'));

        if (isReflected) {
          updatedEnemies = updatedEnemies.map(e =>
            e.id === currentEnemy.id ? { ...e, stats: { ...e.stats, health: Math.max(0, e.stats.health - reflectedDamage) } } : e
          );
          log.push(createLogMessage(`${updatedPlayer.name} reflekterade ${Math.floor(reflectedDamage)} skada tillbaka till ${currentEnemy.name}!`, 'player'));
        }

        // Apply status effects from enemy ability
        if (chosenAbility.statusEffectsToApply) {
          chosenAbility.statusEffectsToApply.forEach(statusType => {
            let effect: StatusEffect;
            switch (statusType) {
              case 'burning': effect = { type: 'burning', duration: chosenAbility?.duration || 1, damage: chosenAbility?.value || 0 }; break;
              case 'poisoned': effect = { type: 'poisoned', duration: chosenAbility?.duration || 1, damage: chosenAbility?.value || 0 }; break;
              case 'slowed': effect = { type: 'slowed', duration: chosenAbility?.duration || 1 }; break;
              case 'paralyzed': effect = { type: 'paralyzed', duration: chosenAbility?.duration || 1 }; break;
              case 'bleeding': effect = { type: 'bleeding', duration: chosenAbility?.duration || 1, damage: chosenAbility?.value || 0 }; break;
              case 'frightened': effect = { type: 'frightened', duration: chosenAbility?.duration || 1, chanceToMissTurn: chosenAbility?.value || 0.3, chanceToAttackRandom: chosenAbility?.value || 0.3 }; break;
              case 'frozen': effect = { type: 'frozen', duration: chosenAbility?.duration || 1 }; break;
              case 'armor_reduction': effect = { type: 'armor_reduction', duration: chosenAbility?.duration || 1, value: chosenAbility?.value || 0 }; break;
              case 'stunned': effect = { type: 'stunned', duration: chosenAbility?.duration || 1 }; break;
              case 'damage_reduction': effect = { type: 'damage_reduction', duration: chosenAbility?.duration || 1, value: chosenAbility?.value || 0, isPercentage: false }; break;
              default: return;
            }
            updatedPlayer = applyStatusEffect(updatedPlayer, effect) as Character;
            log.push(createLogMessage(`${updatedPlayer.name} blev ${statusType === 'burning' ? 'bränd' : statusType === 'poisoned' ? 'förgiftad' : statusType === 'slowed' ? 'förlångsammad' : statusType === 'paralyzed' ? 'förlamad' : statusType === 'bleeding' ? 'blödande' : statusType === 'frightened' ? 'skräckslagen' : statusType === 'frozen' ? 'frusen' : statusType === 'armor_reduction' ? 'rustningsreducerad' : statusType === 'stunned' ? 'bedövad' : statusType === 'damage_reduction' ? 'skadereducerad' : 'påverkad'}!`, 'enemy'));
          });
        }
      }
    } else if (chosenAbility.category === 'buff' && targetForAbility) {
      if (targetForAbility.id === player.id) { // Corrected: Compare with player.id
        // Buff player (unlikely for enemy, but possible)
        if (chosenAbility.statusEffectsToApply) {
          chosenAbility.statusEffectsToApply.forEach(statusType => {
            let effect: StatusEffect;
            switch (statusType) {
              case 'hasted': effect = { type: 'hasted', duration: chosenAbility?.duration || 1 }; break;
              case 'defending': effect = { type: 'defending', duration: chosenAbility?.duration || 1, value: chosenAbility?.value || 0 }; break;
              case 'damage_reduction': effect = { type: 'damage_reduction', duration: chosenAbility?.duration || 1, value: chosenAbility?.value || 0, isPercentage: false }; break;
              case 'reflecting': effect = { type: 'reflecting', duration: chosenAbility?.duration || 1, element: chosenAbility.element, value: chosenAbility?.value || 0 }; break;
              case 'absorbing': effect = { type: 'absorbing', duration: chosenAbility?.duration || 1, element: chosenAbility.element, value: chosenAbility?.value || 0 }; break;
              default: return;
            }
            updatedPlayer = applyStatusEffect(updatedPlayer, effect) as Character;
            log.push(createLogMessage(`${updatedPlayer.name} fick ${statusType}!`, 'enemy'));
          });
        }
      } else if (targetForAbility.id === currentEnemy.id) {
        // Buff self
        if (chosenAbility.statusEffectsToApply) {
          chosenAbility.statusEffectsToApply.forEach(statusType => {
            let effect: StatusEffect;
            switch (statusType) {
              case 'hasted': effect = { type: 'hasted', duration: chosenAbility?.duration || 1 }; break;
              case 'defending': effect = { type: 'defending', duration: chosenAbility?.duration || 1, value: chosenAbility?.value || 0 }; break;
              case 'damage_reduction': effect = { type: 'damage_reduction', duration: chosenAbility?.duration || 1, value: chosenAbility?.value || 0, isPercentage: false }; break;
              case 'reflecting': effect = { type: 'reflecting', duration: chosenAbility?.duration || 1, element: chosenAbility.element, value: chosenAbility?.value || 0 }; break;
              case 'absorbing': effect = { type: 'absorbing', duration: chosenAbility?.duration || 1, element: chosenAbility.element, value: chosenAbility?.value || 0 }; break;
              case 'bleeding': effect = { type: 'bleeding', duration: chosenAbility?.duration || 1, damage: chosenAbility?.value || 0 }; break; // For self-inflicted bleeding buffs
              default: return;
            }
            updatedEnemies = updatedEnemies.map(e =>
              e.id === currentEnemy.id ? applyStatusEffect(e, effect) as Enemy : e
            );
            log.push(createLogMessage(`${currentEnemy.name} fick ${statusType}!`, 'enemy'));
          });
        }
      }
    } else if (chosenAbility.category === 'heal' && targetForAbility) {
      if (targetForAbility.id === currentEnemy.id) {
        const healAmount = currentEnemy.stats.maxHealth * (chosenAbility.healMultiplier || 0.1); // Heal for 10% of max health
        updatedEnemies = updatedEnemies.map(e =>
          e.id === currentEnemy.id ? { ...e, stats: { ...e.stats, health: Math.min(e.stats.maxHealth, e.stats.health + healAmount) } } : e
        );
        log.push(createLogMessage(`${currentEnemy.name} läkte ${Math.floor(healAmount)} hälsa.`, 'enemy'));
      }
    } else if (chosenAbility.category === 'cc') {
      // Apply CC to player
      if (chosenAbility.statusEffectsToApply) {
        chosenAbility.statusEffectsToApply.forEach(statusType => {
          let effect: StatusEffect;
          switch (statusType) {
            case 'paralyzed': effect = { type: 'paralyzed', duration: chosenAbility?.duration || 1 }; break;
            case 'frozen': effect = { type: 'frozen', duration: chosenAbility?.duration || 1 }; break;
            case 'slowed': effect = { type: 'slowed', duration: chosenAbility?.duration || 1 }; break;
            case 'blinded': effect = { type: 'blinded', duration: chosenAbility?.duration || 1 }; break;
            case 'frightened': effect = { type: 'frightened', duration: chosenAbility?.duration || 1, chanceToMissTurn: chosenAbility?.value || 0.3, chanceToAttackRandom: chosenAbility?.value || 0.3 }; break;
            default: return;
          }
          updatedPlayer = applyStatusEffect(updatedPlayer, effect) as Character;
          log.push(createLogMessage(`${updatedPlayer.name} blev ${statusType === 'paralyzed' ? 'förlamad' : statusType === 'frozen' ? 'frusen' : statusType === 'slowed' ? 'förlångsammad' : statusType === 'blinded' ? 'bländad' : statusType === 'frightened' ? 'skräckslagen' : 'påverkad'}!`, 'enemy'));
        });
      }
    }
  }

  // Decrement cooldowns for current enemy's abilities
  currentEnemy.abilities = currentEnemy.abilities?.map(ab =>
    ab.currentCooldown && ab.currentCooldown > 0 ? { ...ab, currentCooldown: ab.currentCooldown - 1 } : ab
  );

  return { updatedPlayer, updatedEnemies, log, damageToPlayer };
};