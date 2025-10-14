import {
  type Character,
  type Enemy,
  type PlayerAbility,
  type UltimateAbility,
  type StatusEffect,
  Element,
  type CombatLogMessage,
} from '../types';
import { PLAYER_ABILITIES, ULTIMATE_ABILITIES } from '../constants';
import { createLogMessage } from './combatLog';
import { getCharacterDamage, getElementalDamageBonus, getCharacterCritChance, getHealingBonus } from './characterStats';
import { calculateDamage } from './damageCalculations';
import { applyStatusEffect } from './statusEffects';

export const applyPlayerAbility = (
  player: Character,
  enemies: Enemy[],
  ability: PlayerAbility | UltimateAbility,
  rank: number,
  targetEnemyId?: string,
): { updatedPlayer: Character; updatedEnemies: Enemy[]; log: CombatLogMessage[]; reflectedDamageToPlayer: number } => {
  const log: CombatLogMessage[] = [];
  let updatedPlayer = { ...player };
  let updatedEnemies = [...enemies];
  let reflectedDamageToPlayer = 0;

  const isUltimate = (ability as UltimateAbility).effect !== undefined;
  const abilityData = isUltimate ? (ability as UltimateAbility).effect : (ability as PlayerAbility).ranks[rank - 1];

  if (!abilityData) {
    log.push(createLogMessage(`Fel: Förmågedata saknas för ${ability.name}.`, 'system'));
    return { updatedPlayer, updatedEnemies, log, reflectedDamageToPlayer };
  }

  // Resource Cost
  const resourceCost = (abilityData as any).resourceCost || 0;
  if (updatedPlayer.resources.aether.current < resourceCost) {
    log.push(createLogMessage(`${updatedPlayer.name} har inte tillräckligt med Aether för att använda ${ability.name}!`, 'system'));
    return { updatedPlayer, updatedEnemies, log, reflectedDamageToPlayer };
  }
  updatedPlayer.resources.aether.current -= resourceCost;
  log.push(createLogMessage(`${updatedPlayer.name} använde ${ability.name}.`, 'player'));

  // Determine targets based on targetType
  let targets: Enemy[] = [];
  const currentTargetType = ability.targetType;

  if (currentTargetType === 'SINGLE_ENEMY' && targetEnemyId) {
    const target = updatedEnemies.find(e => e.id === targetEnemyId);
    if (target) targets.push(target);
  } else if (currentTargetType === 'ALL_ENEMIES') {
    targets = updatedEnemies;
  } else if (currentTargetType === 'LOWEST_HP_ENEMY') {
    const lowestHpEnemy = updatedEnemies.reduce((prev, curr) => (prev.stats.health < curr.stats.health ? prev : curr));
    if (lowestHpEnemy) targets.push(lowestHpEnemy);
  } else if (currentTargetType === 'HIGHEST_HP_ENEMY') {
    const highestHpEnemy = updatedEnemies.reduce((prev, curr) => (prev.stats.health > curr.stats.health ? prev : curr));
    if (highestHpEnemy) targets.push(highestHpEnemy);
  } else if (currentTargetType === 'SELF') {
    // Handled below for buffs/heals
  } else if (currentTargetType === 'ALL_ALLIES') {
    // Handled below for buffs/heals (for future party system)
  } else if (currentTargetType === 'LINE_AOE' || currentTargetType === 'CIRCLE_AOE') {
    // For now, treat AOE as ALL_ENEMIES until specific positioning is implemented
    targets = updatedEnemies;
    log.push(createLogMessage(`(AOE-effekt träffar alla fiender)`, 'system'));
  }


  // Apply effects
  if ((abilityData as any).damageMultiplier || (abilityData as any).damage) {
    const baseDamage = (isUltimate ? (abilityData as any).damage : getCharacterDamage(updatedPlayer) * (abilityData as any).damageMultiplier) || 0;
    const elementalDamageBonus = getElementalDamageBonus(updatedPlayer, ability.element);
    const finalBaseDamage = baseDamage * (1 + elementalDamageBonus / 100);

    const critChance = getCharacterCritChance(updatedPlayer);

    targets.forEach(target => {
      const isCritical = Math.random() * 100 < critChance;
      const { damage, isCritical: actualCrit, isDodged, isReflected, reflectedDamage } = calculateDamage(
        updatedPlayer,
        target,
        finalBaseDamage,
        ability.element,
        isCritical,
        true,
      );

      if (isDodged) {
        log.push(createLogMessage(`${target.name} undvek ${ability.name}!`, 'enemy'));
      } else {
        updatedEnemies = updatedEnemies.map(e =>
          e.id === target.id ? { ...e, stats: { ...e.stats, health: Math.max(0, e.stats.health - damage) } } : e
        );
        log.push(createLogMessage(`${updatedPlayer.name} träffade ${target.name} för ${damage} ${Element[ability.element]} skada${actualCrit ? ' (KRITISK)!' : '!'}`, 'player'));

        if (isReflected) {
          reflectedDamageToPlayer += reflectedDamage;
          log.push(createLogMessage(`${target.name} reflekterade ${Math.floor(reflectedDamage)} skada tillbaka till ${updatedPlayer.name}!`, 'enemy'));
        }

        // Apply DoT or other status effects from ability
        const statusEffectsToApply = (abilityData as any).statusEffectsToApply || (isUltimate && (abilityData as any).buff ? [(abilityData as any).buff] : []);
        
        statusEffectsToApply.forEach((statusType: StatusEffect['type']) => {
          if (Math.random() * 100 < ((abilityData as any).chance || 100)) {
            let effect: StatusEffect;
            switch (statusType) {
              case 'burning': effect = { type: 'burning', duration: (abilityData as any).duration || 1, damage: (abilityData as any).dotDamage || (abilityData as any).value || 0 }; break;
              case 'poisoned': effect = { type: 'poisoned', duration: (abilityData as any).duration || 1, damage: (abilityData as any).dotDamage || (abilityData as any).value || 0 }; break;
              case 'slowed': effect = { type: 'slowed', duration: (abilityData as any).duration || 1 }; break;
              case 'paralyzed': effect = { type: 'paralyzed', duration: (abilityData as any).duration || 1 }; break;
              case 'bleeding': effect = { type: 'bleeding', duration: (abilityData as any).duration || 1, damage: (abilityData as any).dotDamage || (abilityData as any).value || 0 }; break;
              case 'frightened': effect = { type: 'frightened', duration: (abilityData as any).duration || 1, chanceToMissTurn: (abilityData as any).value || 0.3, chanceToAttackRandom: (abilityData as any).value || 0.3 }; break;
              case 'frozen': effect = { type: 'frozen', duration: (abilityData as any).duration || 1 }; break;
              case 'armor_reduction': effect = { type: 'armor_reduction', duration: (abilityData as any).duration || 1, value: (abilityData as any).value || 0 }; break;
              case 'stunned': effect = { type: 'stunned', duration: (abilityData as any).duration || 1 }; break;
              case 'damage_reduction': effect = { type: 'damage_reduction', duration: (abilityData as any).duration || 1, value: (abilityData as any).value || 0, isPercentage: (abilityData as any).isPercentage || false }; break;
              default: return;
            }
            updatedEnemies = updatedEnemies.map(e =>
              e.id === target.id ? applyStatusEffect(e, effect) as Enemy : e
            );
            log.push(createLogMessage(`${target.name} blev ${statusType === 'burning' ? 'bränd' : statusType === 'poisoned' ? 'förgiftad' : statusType === 'slowed' ? 'förlångsammad' : statusType === 'paralyzed' ? 'förlamad' : statusType === 'bleeding' ? 'blödande' : statusType === 'frightened' ? 'skräckslagen' : statusType === 'frozen' ? 'frusen' : statusType === 'armor_reduction' ? 'rustningsreducerad' : statusType === 'stunned' ? 'bedövad' : statusType === 'damage_reduction' ? 'skadereducerad' : 'påverkad'}!`, 'player'));
          }
        });
      }
    });
  }

  if ((abilityData as any).healMultiplier || (abilityData as any).heal) {
    const baseHeal = (isUltimate ? (abilityData as any).heal : updatedPlayer.stats.intelligence * (abilityData as any).healMultiplier) || 0;
    const healingBonus = getHealingBonus(updatedPlayer);
    const finalHeal = baseHeal * (1 + healingBonus / 100);

    // For now, assume self-heal or single target heal
    updatedPlayer.resources.health.current = Math.min(
      updatedPlayer.resources.health.max,
      updatedPlayer.resources.health.current + finalHeal,
    );
    log.push(createLogMessage(`${updatedPlayer.name} läkte ${Math.floor(finalHeal)} hälsa.`, 'player'));

    const statusEffectsToApply = (abilityData as any).statusEffectsToApply || (isUltimate && (abilityData as any).buff ? [(abilityData as any).buff] : []);

    statusEffectsToApply.forEach((statusType: StatusEffect['type']) => {
      if (Math.random() * 100 < ((abilityData as any).chance || 100)) {
        let effect: StatusEffect;
        switch (statusType) {
          case 'regenerating': effect = { type: 'regenerating', duration: (abilityData as any).duration || 1, heal: (abilityData as any).value || 0 }; break;
          case 'hasted': effect = { type: 'hasted', duration: (abilityData as any).duration || 1 }; break;
          case 'defending': effect = { type: 'defending', duration: (abilityData as any).duration || 1, value: (abilityData as any).value || 0 }; break;
          case 'damage_reduction': effect = { type: 'damage_reduction', duration: (abilityData as any).duration || 1, value: (abilityData as any).value || 0, isPercentage: (abilityData as any).isPercentage || false }; break;
          case 'reflecting': effect = { type: 'reflecting', duration: (abilityData as any).duration || 1, element: ability.element, value: (abilityData as any).value || 0 }; break;
          case 'absorbing': effect = { type: 'absorbing', duration: (abilityData as any).duration || 1, element: ability.element, value: (abilityData as any).value || 0 }; break;
          default: return;
        }
        updatedPlayer = applyStatusEffect(updatedPlayer, effect) as Character;
        log.push(createLogMessage(`${updatedPlayer.name} fick ${statusType}!`, 'player'));
      }
    });
  }

  if ((abilityData as any).buff && !(abilityData as any).damageMultiplier && !(abilityData as any).healMultiplier) {
    const buffType = (abilityData as any).buff;
    const duration = (abilityData as any).duration || 1;
    const value = (abilityData as any).value || 0;
    const isPercentage = (abilityData as any).isPercentage || false;

    let effect: StatusEffect | undefined;
    switch (buffType) {
      case 'defending': effect = { type: 'defending', duration, value }; break;
      case 'hasted': effect = { type: 'hasted', duration }; break;
      case 'damage_reduction': effect = { type: 'damage_reduction', duration, value, isPercentage }; break;
      case 'burning': effect = { type: 'burning', duration, damage: value }; break;
      case 'paralyzed': effect = { type: 'paralyzed', duration }; break;
      case 'bleeding': effect = { type: 'bleeding', duration, damage: value }; break;
      case 'absorbing': effect = { type: 'absorbing', duration, element: ability.element, value }; break;
      default: break;
    }

    if (effect) {
      if (currentTargetType === 'SELF' || currentTargetType === 'ALL_ALLIES') {
        updatedPlayer = applyStatusEffect(updatedPlayer, effect) as Character;
        log.push(createLogMessage(`${updatedPlayer.name} fick ${buffType}!`, 'player'));
      } else {
        // Apply to enemies if it's a debuff from an AOE ultimate
        updatedEnemies = updatedEnemies.map(e => applyStatusEffect(e, effect as StatusEffect) as Enemy);
        log.push(createLogMessage(`Alla fiender fick ${buffType}!`, 'player'));
      }
    }
  }

  // Cooldowns
  if (ability.cooldown !== undefined) {
    if (isUltimate) {
      updatedPlayer.unlockedUltimateAbilities = updatedPlayer.unlockedUltimateAbilities.map(ua =>
        ua.id === ability.id ? { ...ua, currentCooldown: ability.cooldown } : ua
      );
    } else {
      updatedPlayer.activeAbilities = updatedPlayer.activeAbilities.map(pa =>
        pa.id === ability.id ? { ...pa, currentCooldown: ability.cooldown } : pa
      );
    }
  }

  return { updatedPlayer, updatedEnemies, log, reflectedDamageToPlayer };
};