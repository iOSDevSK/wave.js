import { chromium } from '@playwright/test';

const URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'screenshots';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function setSlider(page, label, value) {
  await page.evaluate(({ label, value }) => {
    const spans = [...document.querySelectorAll('span')];
    const span = spans.find(s => s.textContent === label);
    const input = span.closest('label').querySelector('input[type="range"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { label, value });
  await sleep(300);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: false });
  console.log(`  -> ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL);
  await sleep(2000);

  // Test concentration at different levels
  console.log('Concentration tests:');
  await screenshot(page, 'fix_01_conc_0');

  await setSlider(page, 'Concentration', 3);
  await sleep(500);
  await screenshot(page, 'fix_02_conc_3');

  await setSlider(page, 'Concentration', 5);
  await sleep(500);
  await screenshot(page, 'fix_03_conc_5');

  await setSlider(page, 'Concentration', 10);
  await sleep(500);
  await screenshot(page, 'fix_04_conc_10');

  // Test with transparent colors - reproduce user's issue
  console.log('\nTransparent color test:');
  await setSlider(page, 'Concentration', 10);
  await setSlider(page, 'Opacity', 1);
  await sleep(500);
  await screenshot(page, 'fix_05_conc10_opacity1');

  await browser.close();
  console.log('\nDone!');
})();
