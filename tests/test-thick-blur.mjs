import { chromium } from '@playwright/test';

const URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'screenshots';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png` });
  console.log(`  -> ${name}.png`);
}

async function clickReset(page) {
  await page.locator('button:has-text("Reset to defaults")').click();
  await sleep(500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL);
  await sleep(2000);

  // Use concentration to make waves visible as distinct bands
  console.log('Thickness vs Blur comparison (concentration=8 for clarity):');

  // 1. High thickness, no blur → thick solid bands, hard edges
  await clickReset(page);
  await setSlider(page, 'Concentration', 8);
  await setSlider(page, 'Thickness', 0.15);
  await setSlider(page, 'Blur', 0);
  await sleep(500);
  await screenshot(page, 'tb_01_thick_high_blur_none');

  // 2. No thickness, high blur → thin bands, very soft edges
  await setSlider(page, 'Thickness', 0.01);
  await setSlider(page, 'Blur', 0.15);
  await sleep(500);
  await screenshot(page, 'tb_02_thick_none_blur_high');

  // 3. High thickness + high blur → thick bands with soft edges
  await setSlider(page, 'Thickness', 0.15);
  await setSlider(page, 'Blur', 0.15);
  await sleep(500);
  await screenshot(page, 'tb_03_thick_high_blur_high');

  // 4. Min thickness, min blur → thinnest possible bands, hard edges
  await setSlider(page, 'Thickness', 0.01);
  await setSlider(page, 'Blur', 0);
  await sleep(500);
  await screenshot(page, 'tb_04_thick_min_blur_none');

  // 5. Default values for reference
  await clickReset(page);
  await setSlider(page, 'Concentration', 8);
  await sleep(500);
  await screenshot(page, 'tb_05_defaults_conc8');

  // 6. With amplitude 0 (flat lines) for clearest comparison
  console.log('\nFlat lines (amplitude=0, concentration=5):');
  await clickReset(page);
  await setSlider(page, 'Amplitude', 0);
  await setSlider(page, 'Concentration', 5);

  await setSlider(page, 'Thickness', 0.1);
  await setSlider(page, 'Blur', 0);
  await sleep(500);
  await screenshot(page, 'tb_06_flat_thick_only');

  await setSlider(page, 'Thickness', 0.01);
  await setSlider(page, 'Blur', 0.1);
  await sleep(500);
  await screenshot(page, 'tb_07_flat_blur_only');

  await setSlider(page, 'Thickness', 0.1);
  await setSlider(page, 'Blur', 0.1);
  await sleep(500);
  await screenshot(page, 'tb_08_flat_both');

  // 7. Default look (no concentration)
  console.log('\nDefault spread (concentration=0):');
  await clickReset(page);
  await screenshot(page, 'tb_09_default');

  await setSlider(page, 'Thickness', 0.15);
  await setSlider(page, 'Blur', 0);
  await sleep(500);
  await screenshot(page, 'tb_10_spread_thick_only');

  await setSlider(page, 'Thickness', 0.01);
  await setSlider(page, 'Blur', 0.15);
  await sleep(500);
  await screenshot(page, 'tb_11_spread_blur_only');

  await browser.close();
  console.log('\nDone!');
})();
