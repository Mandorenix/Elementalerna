const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.join(__dirname, 'screenshots');
const GAME_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

(async () => {
  console.log('Starting mobile Puppeteer test...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Console log tracking from browser
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });

  // 1. Portrait Mode - iPhone 13 (390 x 844)
  console.log('Setting viewport to mobile portrait (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  console.log(`Navigating to ${GAME_URL}...`);
  await page.goto(GAME_URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_01_main_menu_portrait.png') });
  console.log('Screenshot 1: Main Menu (portrait)');

  // Click "NYTT SPEL" or "Nytt äventyr"
  console.log('Clicking Nytt Äventyr...');
  await page.evaluate(() => {
    // Try to find buttons
    const btns = Array.from(document.querySelectorAll('button'));
    const newGameBtn = btns.find(b => b.textContent?.toLowerCase().includes('nytt') || b.title?.includes('Nytt'));
    if (newGameBtn) {
      newGameBtn.click();
    } else {
      console.log('Could not find Nytt äventyr button by text, clicking first button');
      if (btns[0]) btns[0].click();
    }
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_02_char_select_portrait.png') });
  console.log('Screenshot 2: Character Selection (portrait)');

  // Select first archetype (Pyromanten)
  console.log('Selecting primary archetype...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
    if (cards.length > 0) {
      cards[0].click();
    } else {
      console.log('No archetype cards found!');
    }
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_03_primary_selected_portrait.png') });
  console.log('Screenshot 3: Primary Selected (portrait)');

  // Confirm primary
  console.log('Confirming primary archetype...');
  await page.evaluate(() => {
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Huvudarketyp') || b.textContent?.includes('Välj'));
    if (confirmBtn) {
      confirmBtn.click();
    } else {
      console.log('Confirm primary button not found!');
    }
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_04_secondary_select_portrait.png') });
  console.log('Screenshot 4: Secondary Archetype Selection (portrait)');

  // Skip secondary
  console.log('Skipping secondary archetype...');
  await page.evaluate(() => {
    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Hoppa') || b.textContent?.includes('över'));
    if (skipBtn) {
      skipBtn.click();
    } else {
      console.log('Skip secondary button not found, clicking any button with Hoppa');
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_05_deck_view_empty_portrait.png') });
  console.log('Screenshot 5: Deck View Empty (portrait)');

  // 2. Landscape Mode - Empty Deck View (844 x 390)
  console.log('Switching to mobile landscape (844x390) to check empty view...');
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_06_deck_view_empty_landscape.png') });
  console.log('Screenshot 6: Deck View Empty (landscape)');

  // Rotate back to Portrait to draw card
  console.log('Switching back to portrait...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 1000));

  // Click on "Dra ett kort" or deck pile
  console.log('Drawing a card...');
  await page.evaluate(() => {
    const drawBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Dra ett kort') || b.textContent?.includes('Dra'));
    if (drawBtn) {
      drawBtn.click();
    } else {
      console.log('Draw card button not found, searching for clickables in deck-pile...');
      const pile = document.querySelector('.deck-pile-card');
      if (pile) pile.click();
    }
  });
  await new Promise(r => setTimeout(r, 3000)); // wait for draw animation and card flip

  // Inspect sizes and content
  const sizes = await page.evaluate(() => {
    const slot = document.querySelector('.drawn-card-slot');
    const scene = document.querySelector('.card-scene');
    const inner = document.querySelector('.card-inner');
    const front = document.querySelector('.card-face-front');
    const p3Div = document.querySelector('.card-face-front > div.p-3');
    
    const children = p3Div ? Array.from(p3Div.children).map((c, idx) => {
      const rect = c.getBoundingClientRect();
      return {
        idx,
        tagName: c.tagName,
        className: c.className,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
      };
    }) : [];
    
    const slotRect = slot ? slot.getBoundingClientRect() : null;
    const sceneRect = scene ? scene.getBoundingClientRect() : null;
    const frontRect = front ? front.getBoundingClientRect() : null;
    const p3DivRect = p3Div ? p3Div.getBoundingClientRect() : null;
    
    return {
      slot: slotRect ? { x: slotRect.x, y: slotRect.y, w: slotRect.width, h: slotRect.height } : null,
      scene: sceneRect ? { x: sceneRect.x, y: sceneRect.y, w: sceneRect.width, h: sceneRect.height } : null,
      inner: inner ? { w: inner.clientWidth, h: inner.clientHeight, className: inner.className } : null,
      front: frontRect ? { x: frontRect.x, y: frontRect.y, w: frontRect.width, h: frontRect.height } : null,
      p3Div: p3DivRect ? {
        className: p3Div.className,
        x: p3DivRect.x,
        y: p3DivRect.y,
        w: p3DivRect.width,
        h: p3DivRect.height,
        sh: p3Div.scrollHeight,
        st: p3Div.scrollTop,
      } : null,
      children
    };
  });
  console.log('MEASURED SIZES (Portrait):', JSON.stringify(sizes, null, 2));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_07_card_drawn_portrait.png') });
  console.log('Screenshot 7: Card Drawn (portrait)');

  // 3. Landscape Mode - Card Drawn (844 x 390)
  console.log('Switching to mobile landscape (844x390) to check drawn card view...');
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_08_card_drawn_landscape.png') });
  console.log('Screenshot 8: Card Drawn (landscape)');

  console.log('Closing browser...');
  await browser.close();
  console.log('Mobile Puppeteer test completed successfully.');
})();
