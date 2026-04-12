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
    if (!span) throw new Error(`Slider "${label}" not found`);
    const input = span.closest('label').querySelector('input[type="range"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { label, value });
  await sleep(300);
}

async function getSliderValue(page, label) {
  return page.evaluate((label) => {
    const spans = [...document.querySelectorAll('span')];
    const span = spans.find(s => s.textContent === label);
    if (!span) return null;
    return parseFloat(span.closest('label').querySelector('input[type="range"]').value);
  }, label);
}

async function getDisplayedValue(page, label) {
  return page.evaluate((label) => {
    const spans = [...document.querySelectorAll('span')];
    const span = spans.find(s => s.textContent === label);
    if (!span) return null;
    return span.parentElement.querySelector('span[style*="monospace"]')?.textContent?.trim();
  }, label);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png` });
  console.log(`    -> ${name}.png`);
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

  // =============================================
  console.log('\n--- 1. Thickness Random slider exists ---');
  // =============================================
  const val = await getSliderValue(page, 'Thickness Random');
  assert(val !== null, 'Thickness Random slider found');
  assert(val === 0, `Default = 0 (got ${val})`);

  const { min, max } = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('span')];
    const span = spans.find(s => s.textContent === 'Thickness Random');
    const input = span.closest('label').querySelector('input[type="range"]');
    return { min: parseFloat(input.min), max: parseFloat(input.max) };
  });
  assert(min === 0, `min = 0 (got ${min})`);
  assert(max === 1, `max = 1 (got ${max})`);

  // =============================================
  console.log('\n--- 2. Slider value changes ---');
  // =============================================
  await setSlider(page, 'Thickness Random', 0.5);
  let v = await getSliderValue(page, 'Thickness Random');
  assert(Math.abs(v - 0.5) < 0.01, `Set to 0.5 (got ${v})`);

  await setSlider(page, 'Thickness Random', 1);
  v = await getSliderValue(page, 'Thickness Random');
  assert(v === 1, `Set to 1 (got ${v})`);

  await setSlider(page, 'Thickness Random', 0);
  v = await getSliderValue(page, 'Thickness Random');
  assert(v === 0, `Set to 0 (got ${v})`);

  // =============================================
  console.log('\n--- 3. Displayed value formatting ---');
  // =============================================
  await setSlider(page, 'Thickness Random', 0.75);
  const display = await getDisplayedValue(page, 'Thickness Random');
  assert(display === '0.75', `Display shows "0.75" (got "${display}")`);

  // =============================================
  console.log('\n--- 4. Reset to defaults ---');
  // =============================================
  await setSlider(page, 'Thickness Random', 0.8);
  await clickReset(page);
  v = await getSliderValue(page, 'Thickness Random');
  assert(v === 0, `Resets to 0 (got ${v})`);

  // =============================================
  console.log('\n--- 5. All 11 sliders have correct defaults ---');
  // =============================================
  const defaults = {
    Waves: 8, Speed: 0.3, Amplitude: 0.06, Frequency: 2.5,
    Opacity: 0.6, Thickness: 0.06, Blur: 0.03, Concentration: 0,
    Randomness: 0, 'Thickness Random': 0, 'Vertical Offset': 0,
  };
  for (const [label, expected] of Object.entries(defaults)) {
    const val = await getSliderValue(page, label);
    assert(Math.abs(val - expected) < 0.001, `Default ${label} = ${expected} (got ${val})`);
  }

  // =============================================
  console.log('\n--- 6. Visual screenshots ---');
  // =============================================
  await screenshot(page, 'tr_01_default');

  // Thickness Random 0 vs 1 comparison
  await setSlider(page, 'Thickness', 0.15);
  await setSlider(page, 'Thickness Random', 0);
  await sleep(500);
  await screenshot(page, 'tr_02_thick015_random0');

  await setSlider(page, 'Thickness Random', 0.5);
  await sleep(500);
  await screenshot(page, 'tr_03_thick015_random05');

  await setSlider(page, 'Thickness Random', 1);
  await sleep(500);
  await screenshot(page, 'tr_04_thick015_random1');

  // With high concentration
  await clickReset(page);
  await setSlider(page, 'Concentration', 10);
  await setSlider(page, 'Thickness', 0.15);
  await setSlider(page, 'Thickness Random', 1);
  await sleep(500);
  await screenshot(page, 'tr_05_conc10_thick015_random1');

  // Both randomnesses at max
  await clickReset(page);
  await setSlider(page, 'Randomness', 1);
  await setSlider(page, 'Thickness Random', 1);
  await setSlider(page, 'Thickness', 0.15);
  await setSlider(page, 'Amplitude', 0.15);
  await sleep(500);
  await screenshot(page, 'tr_06_both_random_max');

  // With different themes
  const themeButtons = page.locator('button[title]');
  await clickReset(page);
  await setSlider(page, 'Thickness Random', 1);
  await setSlider(page, 'Thickness', 0.12);

  await themeButtons.nth(0).click(); // pre-dawn
  await sleep(1800);
  await screenshot(page, 'tr_07_predawn_thick_random');

  await themeButtons.nth(4).click(); // sunset
  await sleep(1800);
  await screenshot(page, 'tr_08_sunset_thick_random');

  // Extreme: many waves + thickness random
  await clickReset(page);
  await setSlider(page, 'Waves', 20);
  await setSlider(page, 'Thickness Random', 1);
  await setSlider(page, 'Thickness', 0.1);
  await sleep(500);
  await screenshot(page, 'tr_09_20waves_thick_random');

  // Amplitude 0 + thickness random (flat lines with varying thickness)
  await clickReset(page);
  await setSlider(page, 'Amplitude', 0);
  await setSlider(page, 'Thickness', 0.15);
  await setSlider(page, 'Thickness Random', 1);
  await setSlider(page, 'Concentration', 5);
  await sleep(500);
  await screenshot(page, 'tr_10_flat_thick_random');

  // =============================================
  console.log('\n--- 7. WebGL still working ---');
  // =============================================
  const glActive = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return gl && !gl.isContextLost();
  });
  assert(glActive, 'WebGL context active after all tests');

  // =============================================
  console.log('\n--- 8. Custom colors + thickness random ---');
  // =============================================
  await clickReset(page);
  const swatches = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"]');
  await swatches.nth(1).click();
  await sleep(400);
  const gInput = page.locator('div:has(> div:text-is("G")) input[type="number"]');
  await gInput.fill('255');
  await gInput.dispatchEvent('change');
  await sleep(300);
  await page.mouse.click(100, 100);
  await sleep(300);
  await setSlider(page, 'Thickness Random', 1);
  await setSlider(page, 'Thickness', 0.12);
  await sleep(500);
  await screenshot(page, 'tr_11_custom_green_thick_random');

  // Verify custom color persists
  await swatches.nth(1).click();
  await sleep(400);
  const gVal = await gInput.inputValue();
  assert(parseInt(gVal) === 255, `Custom green G=255 persists (got ${gVal})`);
  await page.mouse.click(100, 100);

  // =============================================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
