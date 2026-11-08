const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.join(__dirname, 'screenshots');
const PORT = Number(process.env.TEST_PORT || 4175);
const GAME_URL = `http://localhost:${PORT}`;
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function waitPort(port, server, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (server.exitCode !== null) {
        reject(new Error(`Vite exited with code ${server.exitCode}`));
        return;
      }
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        res.resume();
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else {
          reject(new Error(`Vite returned HTTP ${res.statusCode}`));
        }
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

(async () => {
  console.log('Spawning Vite dev server...');
  const viteBin = path.join(__dirname, '..', '..', 'node_modules', 'vite', 'bin', 'vite.js');
  const devServer = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    stdio: 'inherit',
  });
  let browser;

  try {
    console.log(`Waiting for dev server to start on port ${PORT}...`);
    await waitPort(PORT, devServer);
    console.log('Dev server is up!');

    console.log('Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

    console.log('Navigating to game...');
    await page.goto(GAME_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Generating cards and items for analysis...');
    const data = await page.evaluate(() => {
      const cardList = [];
      const itemList = [];
      
      // Generate 500 cards to ensure all random possibilities are represented
      for (let i = 0; i < 500; i++) {
        const lvl = Math.floor(Math.random() * 5) + 1;
        const rnd = Math.floor(Math.random() * 5) + 1;
        cardList.push(window.generateRandomCard(lvl, rnd));
      }

      // Generate 500 items
      for (let i = 0; i < 500; i++) {
        const lvl = Math.floor(Math.random() * 5) + 1;
        itemList.push(window.generateRandomItem(lvl));
      }

      return { cardList, itemList };
    });

    console.log(`Generated ${data.cardList.length} cards and ${data.itemList.length} items successfully.`);

    // Analyze Items
    const slots = {};
    const itemRarities = {};
    const itemTypes = {};
    data.itemList.forEach(item => {
      slots[item.slot] = (slots[item.slot] || 0) + 1;
      itemRarities[item.rarity] = (itemRarities[item.rarity] || 0) + 1;
      const type = item.isRelic ? 'Relic' : (item.consumableEffect ? 'Potion/Consumable' : 'Equipment');
      itemTypes[type] = (itemTypes[type] || 0) + 1;
    });

    // Analyze Cards
    const cardTypes = {};
    const cardElements = {};
    const combatEnemies = new Set();
    const choiceScenarios = new Set();
    const puzzleScenarios = new Set();
    const curses = new Set();
    const boons = new Set();

    data.cardList.forEach(card => {
      cardTypes[card.type] = (cardTypes[card.type] || 0) + 1;
      cardElements[card.element] = (cardElements[card.element] || 0) + 1;

      if (card.type === 'COMBAT' && card.payload && card.payload.enemies) {
        card.payload.enemies.forEach(e => {
          const baseName = e.name.replace(/\s+\d+$/, '');
          combatEnemies.add(baseName);
        });
      } else if (card.type === 'CHOICE') {
        choiceScenarios.add(card.title);
      } else if (card.type === 'PUZZLE') {
        puzzleScenarios.add(card.title);
      } else if (card.type === 'CURSE') {
        curses.add(card.title);
      } else if (card.type === 'BOON') {
        boons.add(card.title);
      }
    });

    console.log('\n--- VERIFICATION REPORT ---');
    console.log('\nITEM SLOTS DISTRIBUTION:');
    console.log(slots);

    console.log('\nITEM RARITIES:');
    console.log(itemRarities);

    console.log('\nITEM TYPES:');
    console.log(itemTypes);

    console.log('\nCARD TYPES:');
    console.log(cardTypes);

    console.log('\nCARD ELEMENTS:');
    console.log(cardElements);

    console.log('\nUNIQUE ENEMY NAMES ENCOUNTERED (Total: ' + combatEnemies.size + '):');
    console.log(Array.from(combatEnemies).sort());

    console.log('\nCHOICE SCENARIOS (Total: ' + choiceScenarios.size + '):');
    console.log(Array.from(choiceScenarios).sort());

    console.log('\nPUZZLE CHALLENGES (Total: ' + puzzleScenarios.size + '):');
    console.log(Array.from(puzzleScenarios).sort());

    console.log('\nCURSE VARIETIES (Total: ' + curses.size + '):');
    console.log(Array.from(curses).sort());

    console.log('\nBOON VARIETIES (Total: ' + boons.size + '):');
    console.log(Array.from(boons).sort());

    // Basic assertions
    const requiredSlots = ['Hjälm', 'Bröst', 'Vapen 1', 'Vapen 2', 'Handskar', 'Bälte', 'Byxor', 'Stövlar', 'Föremål'];
    const missingSlots = requiredSlots.filter(s => !slots[s]);
    
    if (missingSlots.length > 0) {
      console.error('FAIL: Missing generated slots:', missingSlots);
      process.exitCode = 1;
    } else {
      console.log('PASS: All required slots are generated successfully!');
    }

    const expectedNewChoices = ['Den vilsna resenären', 'Önskebrunnen', 'Elementens Obelisk', 'Den vandrande alkemisten'];
    const missingChoices = expectedNewChoices.filter(c => !choiceScenarios.has(c));
    if (missingChoices.length > 0) {
      console.error('FAIL: Missing new choice scenarios:', missingChoices);
      process.exitCode = 1;
    } else {
      console.log('PASS: All new choice scenarios are generated successfully!');
    }

    const expectedNewPuzzles = ['Gåtan av']; // Title starts with "Gåtan av"
    const hasPuzzles = Array.from(puzzleScenarios).some(p => p.includes('Gåtan av'));
    if (!hasPuzzles) {
      console.error('FAIL: Puzzle scenarios were not generated.');
      process.exitCode = 1;
    } else {
      console.log('PASS: Puzzle scenarios are working!');
    }

    const expectedCurseTypes = ['Eldfeber', 'Förstenade fötter', 'Elektrisk stöt', 'Iskall frost'];
    const foundCurses = expectedCurseTypes.filter(c => curses.has(c));
    if (foundCurses.length === 0) {
      console.error('FAIL: None of the new element-specific curses were generated.');
      process.exitCode = 1;
    } else {
      console.log(`PASS: Element-specific curses generated: ${foundCurses.join(', ')}`);
    }

    const expectedBoonTypes = ['Älvans välsignelse', 'Upptäckarglädje'];
    const foundBoons = expectedBoonTypes.filter(b => boons.has(b));
    if (foundBoons.length === 0) {
      console.error('FAIL: None of the new boons were generated.');
      process.exitCode = 1;
    } else {
      console.log(`PASS: New boons generated: ${foundBoons.join(', ')}`);
    }

    console.log('Closing browser...');
  } catch (err) {
    console.error('Error during test execution:', err);
    process.exitCode = 1;
  } finally {
    console.log('Stopping dev server...');
    if (browser) await browser.close();
    devServer.kill();
  }
})();
