import { chromium } from '@playwright/test';

const URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'screenshots';
let passed = 0, failed = 0;

function assert(condition, name) {
  if (condition) { console.log(`  \u2713 ${name}`); passed++; }
  else { console.log(`  \u2717 ${name}`); failed++; }
}

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
  console.log(`    -> ${name}.png`);
}

async function clickReset(page) {
  await page.locator('button:has-text("Reset to defaults")').click();
  await sleep(500);
}

async function toggleCheckbox(page, label) {
  const box = page.locator(`label:has(span:text-is("${label}")) div`).first();
  await box.click();
  await sleep(300);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL);
  await sleep(2000);

  // =============================================
  console.log('\n--- 1. Glass checkbox exists ---');
  // =============================================
  const glassLabel = page.locator('label:has(span:text-is("Glass"))');
  assert(await glassLabel.isVisible(), 'Glass label visible');
  const glassBox = glassLabel.locator('div').first();
  const defaultBg = await glassBox.evaluate(el => el.style.background);
  assert(defaultBg === 'transparent', `Default unchecked (got ${defaultBg})`);

  // =============================================
  console.log('\n--- 2. Toggle on/off ---');
  // =============================================
  await glassBox.click();
  await sleep(300);
  const onBg = await glassBox.evaluate(el => el.style.background);
  assert(onBg.includes('rgba(255'), 'Glass toggles on');

  await glassBox.click();
  await sleep(300);
  const offBg = await glassBox.evaluate(el => el.style.background);
  assert(offBg === 'transparent', 'Glass toggles off');

  // =============================================
  console.log('\n--- 3. Reset clears glass ---');
  // =============================================
  await glassBox.click(); // on
  await clickReset(page);
  const resetBg = await glassBox.evaluate(el => el.style.background);
  assert(resetBg === 'transparent', 'Reset clears glass');

  // =============================================
  console.log('\n--- 4. Visual comparison: off vs on ---');
  // =============================================
  await screenshot(page, 'glass_01_off_default');

  await toggleCheckbox(page, 'Glass');
  await sleep(500);
  await screenshot(page, 'glass_02_on_default');

  // =============================================
  console.log('\n--- 5. Glass with different themes ---');
  // =============================================
  const themeButtons = page.locator('button[title]');

  await themeButtons.nth(0).click(); // pre-dawn
  await sleep(1800);
  await screenshot(page, 'glass_03_predawn');

  await themeButtons.nth(4).click(); // sunset
  await sleep(1800);
  await screenshot(page, 'glass_04_sunset');

  await themeButtons.nth(5).click(); // night
  await sleep(1800);
  await screenshot(page, 'glass_05_night');

  // =============================================
  console.log('\n--- 6. Glass with high amplitude ---');
  // =============================================
  await clickReset(page);
  await toggleCheckbox(page, 'Glass');
  await setSlider(page, 'Amplitude', 0.15);
  await setSlider(page, 'Frequency', 5);
  await sleep(500);
  await screenshot(page, 'glass_06_high_amp');

  // =============================================
  console.log('\n--- 7. Glass with concentration ---');
  // =============================================
  await setSlider(page, 'Concentration', 10);
  await sleep(500);
  await screenshot(page, 'glass_07_concentrated');

  // =============================================
  console.log('\n--- 8. Glass with many waves ---');
  // =============================================
  await clickReset(page);
  await toggleCheckbox(page, 'Glass');
  await setSlider(page, 'Waves', 20);
  await setSlider(page, 'Amplitude', 0.1);
  await sleep(500);
  await screenshot(page, 'glass_08_20waves');

  // =============================================
  console.log('\n--- 9. WebGL still working ---');
  // =============================================
  const glActive = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return gl && !gl.isContextLost();
  });
  assert(glActive, 'WebGL context active');

  // =============================================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
