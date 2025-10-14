import {
  type Character,
  type Enemy,
  type PlayerAbility,
  type UltimateAbility,
  type StatusEffect,
  Element,
  type CombatLogMessage,
  type EnemyAbility,
  type EnemyBehavior,
} from '../types';
import { ELEMENTAL_BONUSES, PLAYER_ABILITIES, ULTIMATE_ABILITIES, ENEMY_ABILITIES } from '../constants';

let logMessageId = 0;

// Helper to get a random element from an array
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const createLogMessage = (text: string, type: CombatLogMessage['type']): CombatLogMessage => {
  return { id: logMessageId++, text, type };
};

// Helper to get a character's total damage (base + stat bonuses)
const getCharacterDamage = (character: Character): number => {
  // Base damage (e.g., from weapon) + strength/intelligence bonus
  const weaponDamage = character.equippedItems.find(item => item.slot === 'Vapen 1')?.stats.skada || 0;
  const strBonus = character.stats.strength * 0.5; // Example scaling
  const intBonus = character.stats.intelligence * 0.5; // Example scaling
  return weaponDamage + strBonus + intBonus;
};

// Helper to get a character's total armor
const getCharacterArmor = (character: Character): number => {
  const equippedArmor = character.equippedItems.reduce((sum, item) => sum + (item.stats.rustning || 0), 0);
  const conBonus = character.stats.constitution * 0.5; // Example scaling
  return equippedArmor + conBonus;
};

// Helper to get a character's critical hit chance
const getCharacterCritChance = (character: Character): number => {
  const equippedCrit = character.equippedItems.reduce((sum, item) => sum + (item.stats.kritiskTräff || 0), 0);
  const dexBonus = character.stats.dexterity * 0.2; // Example scaling
  return equippedCrit + dexBonus;
};

// Helper to get a character's dodge chance
const getCharacterDodgeChance = (character: Character): number => {
  const equippedDodge = character.equippedItems.reduce((sum, item) => sum + (item.stats.undvikandechans || 0), 0);
  const dexBonus = character.stats.dexterity * 0.3; // Example scaling
  return equippedDodge + dexBonus;
};

// Helper to calculate elemental damage bonus
const getElementalDamageBonus = (character: Character, element: Element): number => {
  const affinity = character.elementalAffinities[element] || 0;
  let bonus = 0;
  const fireBonuses = ELEMENTAL_BONUSES[Element.FIRE];
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
const getHealingBonus = (character: Character): number => {
  const waterAffinities = character.elementalAffinities[Element.WATER] || 0;
  let bonus = 0;
  const waterBonuses = ELEMENTAL_BONUSES[Element.WATER];
  if (waterBonuses) {
    waterBonuses.forEach(b => {
      if (waterAffinities >= b.threshold && b.effect.type === 'HEAL_BONUS' && b.effect.isPercentage) {
        bonus += b.effect.value || 0;
      }
    });
  }
  return bonus;
};

// Helper to apply a status effect
const applyStatusEffect = (target: Character | Enemy, effect: StatusEffect): (Character | Enemy) => {
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
const removeStatusEffect = (target: Character | Enemy, effectType: StatusEffect['type']): (Character | Enemy) => {
  return { ...target, statusEffects: target.statusEffects?.filter(e => e.type !== effectType) };
};

// --- Main Combat Functions ---

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
  const dodgeChance = isPlayerAttacking ? getCharacterDodgeChance(defender as Character) : 0; // Only player can dodge for now
  if (Math.random() * 100 < dodgeChance) {
    isDodged = true;
    return { damage: 0, isCritical: false, isDodged: true, isReflected: false, reflectedDamage: 0 };
  }

  // 2. Critical Hit
  if (isCritical) {
    totalDamage *= 1.5; // 50% critical damage bonus
  }

  // 3. Elemental Resistances/Weaknesses (for enemies)
  if (!isPlayerAttacking && (defender as Enemy).resistances) {
    const resistance = (defender as Enemy).resistances?.[element] || 0;
    totalDamage *= (100 - resistance) / 100;
  }

  // 4. Armor Reduction
  const armor = isPlayerAttacking ? getCharacterArmor(defender as Character) : (defender as Enemy).stats.armor;
  totalDamage -= armor * 0.5; // Armor reduces damage by 50% of its value

  // Ensure damage is not negative
  totalDamage = Math.max(1, totalDamage);

  // 5. Reflecting Status Effect
  const reflectingEffect = defender.statusEffects?.find(e => e.type === 'reflecting') as (StatusEffect & { element: Element; value: number }) | undefined;
  if (reflectingEffect && reflectingEffect.element === element) {
    isReflected = true;
    reflectedDamage = totalDamage * (reflectingEffect.value / 100);
    totalDamage -= reflectedDamage; // Reflected damage is subtracted from incoming damage
  }

  // 6. Absorbing Status Effect
  const absorbingEffect = defender.statusEffects?.find(e => e.type === 'absorbing') as (StatusEffect & { element: Element; value: number }) | undefined;
  if (absorbingEffect && absorbingEffect.element === element) {
    totalDamage *= (100 - absorbingEffect.value) / 100; // Reduce damage by absorption percentage
  }

  return { damage: Math.floor(totalDamage), isCritical, isDodged, isReflected, reflectedDamage };
};

export const applyAbility = (
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
              default: return; // Skip if unknown status
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
      if (targetForAbility.id === updatedPlayer.id) {
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
      case 'bleeding': // New: Bleeding damage
        if ('damage' in effect) {
          updatedPlayer.resources.health.current = Math.max(0, updatedPlayer.resources.health.current - effect.damage);
          log.push(createLogMessage(`${updatedPlayer.name} tar ${effect.damage} skada från blödning.`, 'player'));
        }
        break;
      // No direct damage for paralyzed, frightened, reflecting, absorbing, etc.
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
        case 'bleeding': // New: Bleeding damage
          if ('damage' in effect) {
            updatedEnemy.stats.health = Math.max(0, updatedEnemy.stats.health - effect.damage);
            log.push(createLogMessage(`${updatedEnemy.name} tar ${effect.damage} skada från blödning.`, 'enemy'));
          }
          break;
        // No direct damage for paralyzed, frightened, reflecting, absorbing, etc.
      }
      newEffect.duration--;
      return newEffect;
    }).filter(effect => effect.duration > 0);
    return updatedEnemy;
  });

  return { updatedPlayer, updatedEnemies, log };
};