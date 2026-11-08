const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

async function loadSaveValidator() {
  const sourcePath = path.join(__dirname, '..', '..', 'utils', 'validateSaveData.ts');
  const source = await readFile(sourcePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  return import(moduleUrl);
}

function createValidSave() {
  const helmet = {
    id: 'start_helmet',
    name: 'Läderhuva',
    rarity: 'Vanlig',
    slot: 'Hjälm',
    stats: { rustning: 2 },
  };

  return {
    version: 1,
    timestamp: 1_700_000_000_000,
    character: {
      name: 'Pyromanten',
      archetype: 'Pyromanten',
      level: 1,
      stats: { strength: 5, dexterity: 5, intelligence: 5, constitution: 5 },
      resources: {
        health: { current: 100, max: 100 },
        aether: { current: 0, max: 50, name: 'Hetta' },
      },
      experience: { current: 0, max: 100 },
      elementalAffinities: { 1: 2 },
      unlockedPassiveTalents: [],
      unlockedUltimateAbilities: [],
    },
    skillPoints: 1,
    attributePoints: 0,
    elementalPoints: 0,
    unlockedSkillEntries: [['start', 1]],
    equipment: {
      'Hjälm': helmet,
      'Bröst': null,
      'Vapen 1': null,
      'Vapen 2': null,
      'Handskar': null,
      'Bälte': null,
      'Byxor': null,
      'Stövlar': null,
    },
    inventory: [{
      id: 'test-relic',
      name: 'Eldsten',
      rarity: 'Sällsynt',
      slot: 'Föremål',
      stats: { strength: 1, skada: 2 },
      affix: {
        trigger: 'PASSIVE',
        effect: { type: 'APPLY_STATUS', status: 'burning', chance: 0.25, duration: 1 },
        description: 'Brinner ibland',
      },
      consumableEffect: { type: 'BUFF', status: 'hasted', duration: 2, description: 'Snabbare' },
      isRelic: true,
    }],
    gold: 100,
    roundLevel: 1,
    gameStarted: true,
    activeView: 'deck',
  };
}

test('accepts a complete version 1 save with serialized item effects', async () => {
  const { isSaveDataV1 } = await loadSaveValidator();
  const save = createValidSave();

  assert.equal(isSaveDataV1(save), true);
  assert.deepEqual(save, createValidSave());
});

test('rejects invalid envelopes, character fields, and views', async () => {
  const { isSaveDataV1 } = await loadSaveValidator();

  for (const invalid of [null, [], { ...createValidSave(), version: 2 }, { ...createValidSave(), activeView: 'unknown' }]) {
    assert.equal(isSaveDataV1(invalid), false);
  }

  const missingResources = createValidSave();
  delete missingResources.character.resources.health;
  assert.equal(isSaveDataV1(missingResources), false);

  const invalidStats = createValidSave();
  invalidStats.character.stats.strength = 'five';
  assert.equal(isSaveDataV1(invalidStats), false);
});

test('rejects malformed skill entries and equipment records', async () => {
  const { isSaveDataV1 } = await loadSaveValidator();

  const invalidSkills = createValidSave();
  invalidSkills.unlockedSkillEntries = [['start', 'one']];
  assert.equal(isSaveDataV1(invalidSkills), false);

  const invalidSlot = createValidSave();
  invalidSlot.equipment.Unknown = null;
  assert.equal(isSaveDataV1(invalidSlot), false);

  const invalidEquipmentItem = createValidSave();
  invalidEquipmentItem.equipment['Hjälm'].stats.rustning = 'two';
  assert.equal(isSaveDataV1(invalidEquipmentItem), false);
});

test('rejects malformed inventory effects and item slots', async () => {
  const { isSaveDataV1 } = await loadSaveValidator();

  const invalidAffix = createValidSave();
  invalidAffix.inventory[0].affix.effect.status = 'unknown';
  assert.equal(isSaveDataV1(invalidAffix), false);

  const invalidConsumable = createValidSave();
  invalidConsumable.inventory[0].consumableEffect.duration = 'long';
  assert.equal(isSaveDataV1(invalidConsumable), false);

  const invalidItemSlot = createValidSave();
  invalidItemSlot.inventory[0].slot = 'Unknown';
  assert.equal(isSaveDataV1(invalidItemSlot), false);
});
