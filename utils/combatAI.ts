import type { Enemy, EnemyBehavior, EnemyPhase } from '../types';

/**
 * Evaluates if a boss should transition to a new phase based on current HP ratio.
 * Phases are assumed to be provided in descending threshold order (highest first).
 * Uses currentPhaseIndex to avoid re-applying the same or previous phases.
 */
export function evaluateBossPhase(
  enemy: Enemy,
  currentHp: number,
  currentPhaseIndex: number
): { nextPhaseIndex: number; phase: EnemyPhase } | null {
  if (!enemy.phases || enemy.phases.length === 0) {
    return null;
  }

  const maxHealth = enemy.stats?.maxHealth || 1;
  const hpRatio = currentHp / maxHealth;

  // currentPhaseIndex = number of applied phases (0 = none)
  // Iterate starting from currentPhaseIndex, return nextPhaseIndex = i + 1
  for (let i = currentPhaseIndex; i < enemy.phases.length; i++) {
    if (enemy.phases[i].threshold !== undefined && hpRatio <= enemy.phases[i].threshold) {
      return { nextPhaseIndex: i + 1, phase: enemy.phases[i] };
    }
  }

  return null;
}

/**
 * Maps EnemyBehavior to an action and target.
 *
 * Signature extended with enemyActor to support BUFF_SELF (original signature in handoff
 * did not include enemy id; added for completeness as allowed by task).
 * For ATTACK_* variants we target the player as a simple starting point (full targeting
 * logic like lowest/highest HP can be expanded later if needed).
 */
export function resolveBehaviorTarget(
  behavior: EnemyBehavior,
  playerActor: { id: string },
  enemyActor: { id: string }
): { action: 'ATTACK' | 'BUFF_SELF' | 'BUFF_ALLIES' | 'APPLY_DEBUFF'; targetId: string } {
  switch (behavior) {
    case 'ATTACK_PLAYER':
    case 'ATTACK_LOWEST_HP':
    case 'ATTACK_HIGHEST_DAMAGE_PLAYER':
      return { action: 'ATTACK', targetId: playerActor.id };

    case 'BUFF_SELF':
      return { action: 'BUFF_SELF', targetId: enemyActor.id };

    case 'BUFF_ALLIES':
      return { action: 'BUFF_ALLIES', targetId: 'all' };

    case 'APPLY_DEBUFF_TO_PLAYER':
      return { action: 'APPLY_DEBUFF', targetId: playerActor.id };

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = behavior;
      return { action: 'ATTACK', targetId: playerActor.id };
    }
  }
}
