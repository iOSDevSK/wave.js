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

  // Flat lines + concentration for clearest view of thickness differences
  console.log('Thickness Random verification (amplitude=0, concentration=5):');

  await setSlider(page, 'Amplitude', 0);
  await setSlider(page, 'Concentration', 5);
  await setSlider(page, 'Thickness', 0.15);
  await setSlider(page, 'Blur', 0);

  // Random=0: all bands should be identical width
  await setSlider(page, 'Thickness Random', 0);
  await sleep(500);
  await screenshot(page, 'trv_01_random0');

  // Random=0.5: some variation in band width
  await setSlider(page, 'Thickness Random', 0.5);
  await sleep(500);
  await screenshot(page, 'trv_02_random05');

  // Random=1: max variation, some bands very thin, some full width
  await setSlider(page, 'Thickness Random', 1);
  await sleep(500);
  await screenshot(page, 'trv_03_random1');

  // Same but with blur to see if blur stays consistent while thickness varies
  console.log('\nWith blur=0.05 (blur should be same for all, thickness varies):');
  await setSlider(page, 'Blur', 0.05);

  await setSlider(page, 'Thickness Random', 0);
  await sleep(500);
  await screenshot(page, 'trv_04_blur_random0');

  await setSlider(page, 'Thickness Random', 1);
  await sleep(500);
  await screenshot(page, 'trv_05_blur_random1');

  // With waves moving (amplitude > 0)
  console.log('\nWith amplitude (animated waves):');
  await clickReset(page);
  await setSlider(page, 'Thickness', 0.12);
  await setSlider(page, 'Blur', 0);
  await setSlider(page, 'Concentration', 3);

  await setSlider(page, 'Thickness Random', 0);
  await sleep(500);
  await screenshot(page, 'trv_06_animated_random0');

  await setSlider(page, 'Thickness Random', 1);
  await sleep(500);
  await screenshot(page, 'trv_07_animated_random1');

  await browser.close();
  console.log('\nDone!');
})();
