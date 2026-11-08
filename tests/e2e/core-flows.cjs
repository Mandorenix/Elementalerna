const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { installBrowserDiagnostics } = require('./browserDiagnostics.cjs');

const port = Number(process.env.TEST_PORT || 4176);
const gameUrl = `http://127.0.0.1:${port}`;
const viteBin = path.join(__dirname, '..', '..', 'node_modules', 'vite', 'bin', 'vite.js');

function waitForServer(server, timeout = 15000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      if (server.exitCode !== null) {
        reject(new Error(`Vite exited with code ${server.exitCode}`));
        return;
      }

      const request = http.get(gameUrl, response => {
        response.resume();
        resolve();
      });

      request.on('error', () => {
        if (Date.now() - startedAt >= timeout) {
          reject(new Error(`Timed out waiting for Vite on port ${port}`));
          return;
        }
        setTimeout(check, 250);
      });
    };

    check();
  });
}

async function clickElementContainingText(page, selector, text) {
  const clicked = await page.evaluate(({ selector, text }) => {
    const element = Array.from(document.querySelectorAll(selector))
      .find(candidate => candidate.textContent?.includes(text));
    if (!(element instanceof HTMLElement)) return false;
    element.click();
    return true;
  }, { selector, text });

  assert.equal(clicked, true, `Expected to find ${selector} containing "${text}"`);
}

async function clickButtonContainingText(page, text) {
  await clickElementContainingText(page, 'button', text);
}

async function run() {
  const server = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    stdio: 'inherit',
  });
  let browser;

  try {
    await waitForServer(server);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    const diagnostics = installBrowserDiagnostics(page, gameUrl);
    let phase = 'load new isolated game';
    diagnostics.setPhase(phase);
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.goto(gameUrl, { waitUntil: 'networkidle2' });

    phase = 'select character and draw card';
    diagnostics.setPhase(phase);
    await page.locator('button[title="Nytt Äventyr"]').click();
    await clickElementContainingText(page, '.cursor-pointer', 'Pyromanten');
    await clickButtonContainingText(page, 'Välj som Huvudarketyp');
    await clickButtonContainingText(page, 'Hoppa över');
    await clickButtonContainingText(page, 'Dra ett kort');
    await page.waitForSelector('.card-inner.is-flipped');

    await page.waitForFunction(() => {
      const raw = localStorage.getItem('elementalerna_save_data');
      if (!raw) return false;
      const save = JSON.parse(raw);
      return save.character?.archetype === 'Pyromanten' && save.activeView === 'deck';
    }, { timeout: 5000 });

    const saveBeforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem('elementalerna_save_data')));
    assert.equal(saveBeforeReload.version, 1);
    assert.equal(saveBeforeReload.character.archetype, 'Pyromanten');
    assert.equal(saveBeforeReload.roundLevel, 1);

    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('button[title="Fortsätt Äventyret"]');
    await page.locator('button[title="Fortsätt Äventyret"]').click();
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button'))
      .some(button => button.textContent?.includes('Dra ett kort')));

    const resumedSave = await page.evaluate(() => JSON.parse(localStorage.getItem('elementalerna_save_data')));
    assert.equal(resumedSave.character.archetype, 'Pyromanten');
    assert.equal(resumedSave.activeView, 'deck');

    for (const invalidSave of [JSON.stringify({ version: 1, character: {} }), '{"version":1']) {
      phase = 'reject invalid save';
      diagnostics.setPhase(phase);
      await page.evaluate(raw => localStorage.setItem('elementalerna_save_data', raw), invalidSave);
      await page.reload({ waitUntil: 'networkidle2' });
      await page.locator('button[title="Fortsätt Äventyret"]').click();
      await page.waitForSelector('button[title="Fortsätt Äventyret"]');
      const continueButton = await page.$('button[title="Fortsätt Äventyret"]');
      assert.notEqual(continueButton, null);
      assert.equal(await page.evaluate(() => localStorage.getItem('elementalerna_save_data')), invalidSave);
    }
    assert.deepEqual(diagnostics.firstPartyFailures, [], `Browser diagnostics: ${JSON.stringify(diagnostics.events)}`);
    console.log('PASS: character selection, autosave, resume, and invalid-save protection');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
