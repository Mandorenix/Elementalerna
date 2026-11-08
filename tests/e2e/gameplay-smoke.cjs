const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { installBrowserDiagnostics } = require('./browserDiagnostics.cjs');

const port = Number(process.env.TEST_PORT || 4178);
const gameUrl = `http://127.0.0.1:${port}`;
const viteBin = path.join(__dirname, '..', '..', 'node_modules', 'vite', 'bin', 'vite.js');

async function waitForLayout(page) {
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

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
        if (response.statusCode >= 200 && response.statusCode < 400) {
          resolve();
        } else {
          reject(new Error(`Vite returned HTTP ${response.statusCode}`));
        }
      });

      request.setTimeout(1000, () => request.destroy(new Error('Vite health check timed out')));
      request.on('error', error => {
        if (Date.now() - startedAt >= timeout) {
          reject(new Error(`Timed out waiting for Vite on port ${port}: ${error.message}`));
          return;
        }
        setTimeout(check, 250);
      });
    };

    check();
  });
}

async function clickElementContainingText(page, selector, text) {
  const clicked = await page.evaluate(({ selector, searchText }) => {
    const button = Array.from(document.querySelectorAll(selector))
      .find(candidate => candidate.textContent?.includes(searchText));
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  }, { selector, searchText: text });

  assert.equal(clicked, true, `Expected to find ${selector} containing "${text}"`);
}

async function clickButtonContainingText(page, text) {
  await clickElementContainingText(page, 'button', text);
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(metrics.document <= metrics.viewport + 1 && metrics.body <= metrics.viewport + 1,
    `${label} overflows horizontally: ${JSON.stringify(metrics)}`);
}

async function assertVisibleWithinViewport(page, selector, label) {
  const bounds = await page.$eval(selector, element => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      cssWidth: style.width,
      cssHeight: style.height,
      landscape: window.matchMedia('(orientation: landscape)').matches,
      shortViewport: window.matchMedia('(max-height: 480px)').matches,
    };
  });
  const viewport = page.viewport();
  const layout = await page.evaluate(() => {
    const deckMain = document.querySelector('.deck-main');
    const deckSide = document.querySelector('.deck-side');
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      deckMainDirection: deckMain ? window.getComputedStyle(deckMain).flexDirection : null,
      deckSideDirection: deckSide ? window.getComputedStyle(deckSide).flexDirection : null,
    };
  });
  assert.ok(bounds.width > 0 && bounds.height > 0, `${label} is not visible`);
  assert.ok(bounds.left >= -1 && bounds.right <= viewport.width + 1,
    `${label} is clipped horizontally: ${JSON.stringify({ bounds, viewport, layout })}`);
  assert.ok(bounds.top >= -1 && bounds.bottom <= viewport.height + 1,
    `${label} is clipped vertically: ${JSON.stringify({ bounds, viewport, layout })}`);
}

async function assertResponsiveDeck(page, width, height, label) {
  await page.setViewport({ width, height, deviceScaleFactor: width < 500 ? 2 : 1 });
  await waitForLayout(page);
  await assertNoHorizontalOverflow(page, label);
  await assertVisibleWithinViewport(page, 'button.deck-pile-card', `${label} draw-card button`);
}

async function waitForPlayerTurnOrResult(page) {
  await page.waitForFunction(() => {
    const body = document.body.innerText;
    return body.includes('Seger!') || body.includes('Besegrad...')
      || Boolean(document.querySelector('button[title="Normala attack"]'));
  }, { timeout: 30000 });
}

async function run() {
  const server = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    stdio: 'inherit',
  });
  let browser;
  let diagnostics;
  let phase = 'start';

  try {
    await waitForServer(server);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Math.random = () => 0.1;
    });
    diagnostics = installBrowserDiagnostics(page, gameUrl);
    page.setDefaultTimeout(15000);
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

    phase = 'load new isolated game';
    diagnostics.setPhase(phase);
    await page.goto(gameUrl, { waitUntil: 'networkidle2' });
    await page.locator('button[title="Nytt Äventyr"]').click();

    phase = 'select character';
    diagnostics.setPhase(phase);
    await clickElementContainingText(page, '.cursor-pointer', 'Pyromanten');
    await clickButtonContainingText(page, 'Välj som Huvudarketyp');
    await clickButtonContainingText(page, 'Hoppa över');
    await page.waitForSelector('button.deck-pile-card');

    phase = 'responsive deck';
    diagnostics.setPhase(phase);
    await assertResponsiveDeck(page, 1280, 900, 'desktop deck');
    await assertResponsiveDeck(page, 390, 844, 'mobile portrait deck');
    await assertResponsiveDeck(page, 844, 390, 'mobile landscape deck');
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

    phase = 'draw combat card';
    diagnostics.setPhase(phase);
    await clickButtonContainingText(page, 'Dra ett kort');
    await page.waitForSelector('.card-inner.is-flipped');
    await page.waitForFunction(() => document.body.innerText.includes('COMBAT'));
    await clickButtonContainingText(page, 'Konfrontera');

    phase = 'wait for player turn';
    diagnostics.setPhase(phase);
    await page.waitForSelector('button[title="Normala attack"]');

    phase = 'responsive combat controls';
    diagnostics.setPhase(phase);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await waitForLayout(page);
    await assertNoHorizontalOverflow(page, 'mobile portrait combat');
    await assertVisibleWithinViewport(page, 'button[title="Normala attack"]', 'mobile portrait attack button');
    await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2 });
    await waitForLayout(page);
    await assertNoHorizontalOverflow(page, 'mobile landscape combat');
    await assertVisibleWithinViewport(page, 'button[title="Normala attack"]', 'mobile landscape attack button');

    phase = 'resolve combat';
    diagnostics.setPhase(phase);
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    let result = '';
    for (let turn = 0; turn < 15; turn += 1) {
      await waitForPlayerTurnOrResult(page);
      result = await page.evaluate(() => document.body.innerText.includes('Seger!')
        ? 'victory'
        : document.body.innerText.includes('Besegrad...') ? 'defeat' : '');
      if (result) break;
      await page.locator('button[title="Normala attack"]').click();
    }

    assert.equal(result, 'victory', `Expected to win the deterministic combat within 15 turns; got ${result || 'no result'}`);
    await clickButtonContainingText(page, 'Fortsätt');

    phase = 'verify combat reward and save';
    diagnostics.setPhase(phase);
    await page.waitForFunction(() => !document.querySelector('.victory-title'));
    await page.locator('button[title="Spara spelet"]').click();
    const postCombat = await page.evaluate(() => ({
      text: document.body.innerText,
      save: JSON.parse(localStorage.getItem('elementalerna_save_data')),
    }));
    assert.match(postCombat.text, /EXP:\s*[1-9]\d*\//, 'Expected combat XP to be applied');
    assert.equal(postCombat.save.activeView, 'deck');
    assert.equal(postCombat.save.roundLevel, 1);
    assert.deepEqual(diagnostics.firstPartyFailures, [], `Browser diagnostics: ${JSON.stringify(diagnostics.events)}`);

    console.log('PASS: isolated character → combat → victory/reward → save; desktop and mobile layouts');
    console.log(`Browser diagnostics collected: ${diagnostics.events.length}`);
  } catch (error) {
    console.error(`Gameplay smoke failed during "${phase}": ${error.stack || error.message}`);
    if (diagnostics) console.error(`Browser diagnostics: ${JSON.stringify(diagnostics.events)}`);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
