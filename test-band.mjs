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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL);
  await sleep(2000);

  // Default look - should be similar to original
  console.log('Default (should look like original):');
  await screenshot(page, 'band_01_default');

  // Concentration progression
  console.log('Concentration progression:');
  await setSlider(page, 'Concentration', 2);
  await sleep(500);
  await screenshot(page, 'band_02_conc_2');

  await setSlider(page, 'Concentration', 5);
  await sleep(500);
  await screenshot(page, 'band_03_conc_5');

  await setSlider(page, 'Concentration', 10);
  await sleep(500);
  await screenshot(page, 'band_04_conc_10');

  // User's exact scenario: amplitude 0, concentration 10
  console.log('User scenario (amplitude 0, concentration 10):');
  await setSlider(page, 'Amplitude', 0);
  await setSlider(page, 'Concentration', 10);
  await setSlider(page, 'Thickness', 0.01);
  await setSlider(page, 'Blur', 0);
  await sleep(500);
  await screenshot(page, 'band_05_user_scenario');

  // Same but with some amplitude
  await setSlider(page, 'Amplitude', 0.06);
  await sleep(500);
  await screenshot(page, 'band_06_conc10_amp06');

  // Concentration 0 with different amplitudes
  console.log('Concentration 0 with amplitudes:');
  await setSlider(page, 'Concentration', 0);
  await setSlider(page, 'Thickness', 0.06);
  await setSlider(page, 'Blur', 0.03);
  await setSlider(page, 'Amplitude', 0);
  await sleep(500);
  await screenshot(page, 'band_07_conc0_amp0');

  await setSlider(page, 'Amplitude', 0.06);
  await sleep(500);
  await screenshot(page, 'band_08_conc0_amp06');

  await setSlider(page, 'Amplitude', 0.15);
  await sleep(500);
  await screenshot(page, 'band_09_conc0_amp15');

  await browser.close();
  console.log('\nDone!');
})();
