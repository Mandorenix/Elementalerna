const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

async function loadCombatStats() {
  const sourcePath = path.join(__dirname, '..', '..', 'utils', 'playerCombatStats.ts');
  const source = await readFile(sourcePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  return import(moduleUrl);
}

test('combines character, equipment, relic and skill stats without changing the combat output', async () => {
  const { calculatePlayerCombatStats } = await loadCombatStats();
  const abilities = [{ id: 'test-ability' }];
  const character = {
    stats: { strength: 10, dexterity: 8, intelligence: 6, constitution: 4 },
    resources: {
      health: { current: 40, max: 50 },
      aether: { current: 5, max: 20, name: 'Energi' },
    },
  };
  const equipment = {
    'Hjälm': { stats: { strength: 2, dexterity: 1, intelligence: 4, constitution: 2, skada: 5, rustning: 1, undvikandechans: 0.5, kritiskTräff: 2 } },
    'Bröst': null,
    'Vapen 1': null,
    'Vapen 2': null,
    'Handskar': null,
    'Bälte': null,
    'Byxor': null,
    'Stövlar': null,
  };
  const inventory = [
    { isRelic: true, stats: { strength: 1, constitution: 1, skada: 2, rustning: 3, undvikandechans: 1 } },
    { isRelic: false, stats: { strength: 100, skada: 100, rustning: 100 } },
  ];

  const result = calculatePlayerCombatStats(
    character,
    equipment,
    inventory,
    new Map([['granite_stance', 2], ['tailwind', 3]]),
    abilities,
  );

  assert.deepEqual(result, {
    health: 40,
    maxHealth: 50,
    aether: 5,
    maxAether: 20,
    resourceName: 'Energi',
    damage: 33,
    armor: 29,
    dodge: 15,
    crit: 3.8,
    intelligence: 10,
    abilities,
    totalStats: { strength: 13, dexterity: 9, intelligence: 10, constitution: 7 },
  });
  assert.strictEqual(result.abilities, abilities);
});

test('returns null when no character is selected', async () => {
  const { calculatePlayerCombatStats } = await loadCombatStats();
  assert.equal(calculatePlayerCombatStats(null, {}, [], new Map(), []), null);
});
