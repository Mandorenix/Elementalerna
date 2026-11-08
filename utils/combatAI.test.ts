import { describe, it, expect } from 'vitest';
import type { Enemy, EnemyPhase } from '../types';
import { evaluateBossPhase, resolveBehaviorTarget } from './combatAI';

const mockPhases: EnemyPhase[] = [
  { name: 'Rasande', threshold: 0.5 } as any,
  { name: 'Försvar', threshold: 0.2 } as any,
];

const createMockEnemy = (phases?: EnemyPhase[]): Enemy =>
  ({
    id: 'boss1',
    name: 'Boss',
    level: 10,
    element: 0 as any,
    stats: { health: 100, maxHealth: 100, damage: 10, armor: 5 },
    phases,
  } as any);

const playerActor = { id: 'player' };
const enemyActor = { id: 'enemy1' };

describe('evaluateBossPhase', () => {
  it('1. Returnerar null när enemy.phases saknas eller är tom.', () => {
    const enemyNoPhases = createMockEnemy(undefined);
    expect(evaluateBossPhase(enemyNoPhases, 50, 0)).toBe(null);

    const enemyEmpty = createMockEnemy([]);
    expect(evaluateBossPhase(enemyEmpty, 50, 0)).toBe(null);
  });

  it('2. Returnerar null när HP är över alla trösklar (t.ex. 100%).', () => {
    const enemy = createMockEnemy(mockPhases);
    expect(evaluateBossPhase(enemy, 100, 0)).toBe(null);
  });

  it('3. Triggar 0.5-fas när HP faller under 50% från currentPhaseIndex=0.', () => {
    const enemy = createMockEnemy(mockPhases);
    const result = evaluateBossPhase(enemy, 40, 0);
    expect(result).not.toBe(null);
    expect(result!.nextPhaseIndex).toBe(1);
    expect(result!.phase).toBe(mockPhases[0]);
  });

  it('4. Triggar 0.2-fas när HP faller under 20% från currentPhaseIndex=1 (efter 0.5-fas).', () => {
    const enemy = createMockEnemy(mockPhases);
    const result = evaluateBossPhase(enemy, 10, 1);
    expect(result).not.toBe(null);
    expect(result!.nextPhaseIndex).toBe(2);
    expect(result!.phase).toBe(mockPhases[1]);
  });

  it('5. Returnerar null när currentPhaseIndex=2 (alla faser applicerade).', () => {
    const enemy = createMockEnemy(mockPhases);
    expect(evaluateBossPhase(enemy, 10, 2)).toBe(null);
  });

  it('6. Triggar bara en fas per anrop även om HP faller under båda trösklarna (t.ex. 10% HP från index 0 returnerar 0.5-fasen).', () => {
    const enemy = createMockEnemy(mockPhases);
    const result = evaluateBossPhase(enemy, 10, 0);
    expect(result).not.toBe(null);
    expect(result!.nextPhaseIndex).toBe(1);
    expect(result!.phase).toBe(mockPhases[0]);
  });
});

describe('resolveBehaviorTarget', () => {
  it('7. ATTACK_PLAYER → target=player.id, action=\'ATTACK\'.', () => {
    const res = resolveBehaviorTarget('ATTACK_PLAYER', playerActor, enemyActor);
    expect(res).toEqual({ action: 'ATTACK', targetId: 'player' });
  });

  it('8. ATTACK_LOWEST_HP → target=player.id, action=\'ATTACK\'.', () => {
    const res = resolveBehaviorTarget('ATTACK_LOWEST_HP', playerActor, enemyActor);
    expect(res).toEqual({ action: 'ATTACK', targetId: 'player' });
  });

  it('9. ATTACK_HIGHEST_DAMAGE_PLAYER → target=player.id, action=\'ATTACK\'.', () => {
    const res = resolveBehaviorTarget('ATTACK_HIGHEST_DAMAGE_PLAYER', playerActor, enemyActor);
    expect(res).toEqual({ action: 'ATTACK', targetId: 'player' });
  });

  it('10. BUFF_SELF → target=enemyActor.id, action=\'BUFF_SELF\'.', () => {
    const res = resolveBehaviorTarget('BUFF_SELF', playerActor, enemyActor);
    expect(res).toEqual({ action: 'BUFF_SELF', targetId: 'enemy1' });
  });

  it('11. BUFF_ALLIES → target=\'all\', action=\'BUFF_ALLIES\'.', () => {
    const res = resolveBehaviorTarget('BUFF_ALLIES', playerActor, enemyActor);
    expect(res).toEqual({ action: 'BUFF_ALLIES', targetId: 'all' });
  });

  it('12. APPLY_DEBUFF_TO_PLAYER → target=player.id, action=\'APPLY_DEBUFF\'.', () => {
    const res = resolveBehaviorTarget('APPLY_DEBUFF_TO_PLAYER', playerActor, enemyActor);
    expect(res).toEqual({ action: 'APPLY_DEBUFF', targetId: 'player' });
  });

  // Extra test to reach 100% line coverage on default branch (61-63)
  it('default exhaustive case (for coverage)', () => {
    const res = resolveBehaviorTarget('INVALID_BEHAVIOR' as any, playerActor, enemyActor);
    expect(res).toEqual({ action: 'ATTACK', targetId: 'player' });
  });
});
