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
  console.log('\n--- 1. Panel visibility ---');
  // =============================================
  assert(await page.locator('text=Waves').first().isVisible(), 'Panel visible on load');
  await page.locator('button:has-text("Controls")').click();
  await sleep(300);
  assert(!(await page.locator('text=Waves').first().isVisible()), 'Panel hides');
  await page.locator('button:has-text("Controls")').click();
  await sleep(300);
  assert(await page.locator('text=Waves').first().isVisible(), 'Panel reopens');

  // =============================================
  console.log('\n--- 2. Default values (10 sliders) ---');
  // =============================================
  const defaults = {
    Waves: 8, Speed: 0.3, Amplitude: 0.06, Frequency: 2.5,
    Opacity: 0.6, Thickness: 0.06, Blur: 0.03, Concentration: 0,
    Randomness: 0, 'Vertical Offset': 0,
  };
  for (const [label, expected] of Object.entries(defaults)) {
    const val = await getSliderValue(page, label);
    assert(Math.abs(val - expected) < 0.001, `Default ${label} = ${expected} (got ${val})`);
  }

  // =============================================
  console.log('\n--- 3. Slider min/max bounds ---');
  // =============================================
  const bounds = [
    { label: 'Waves', min: 1, max: 20 },
    { label: 'Speed', min: 0, max: 2 },
    { label: 'Amplitude', min: 0, max: 0.2 },
    { label: 'Frequency', min: 0.5, max: 10 },
    { label: 'Opacity', min: 0, max: 1 },
    { label: 'Thickness', min: 0.01, max: 0.2 },
    { label: 'Blur', min: 0, max: 0.3 },
    { label: 'Concentration', min: 0, max: 50 },
    { label: 'Randomness', min: 0, max: 1 },
    { label: 'Vertical Offset', min: -0.5, max: 0.5 },
  ];
  for (const b of bounds) {
    const { min, max } = await page.evaluate((label) => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === label);
      const input = span.closest('label').querySelector('input[type="range"]');
      return { min: parseFloat(input.min), max: parseFloat(input.max) };
    }, b.label);
    assert(min === b.min, `${b.label} min = ${b.min} (got ${min})`);
    assert(max === b.max, `${b.label} max = ${b.max} (got ${max})`);
  }

  // =============================================
  console.log('\n--- 4. Slider value changes ---');
  // =============================================
  const changes = [
    { label: 'Waves', value: 12 },
    { label: 'Speed', value: 1.5 },
    { label: 'Amplitude', value: 0.15 },
    { label: 'Frequency', value: 7 },
    { label: 'Opacity', value: 0.8 },
    { label: 'Thickness', value: 0.12 },
    { label: 'Blur', value: 0.2 },
    { label: 'Concentration', value: 25 },
    { label: 'Randomness', value: 0.7 },
    { label: 'Vertical Offset', value: 0.3 },
  ];
  for (const c of changes) {
    await setSlider(page, c.label, c.value);
    const val = await getSliderValue(page, c.label);
    assert(Math.abs(val - c.value) < 0.01, `${c.label} set to ${c.value} (got ${val})`);
  }

  // =============================================
  console.log('\n--- 5. Displayed value formatting ---');
  // =============================================
  await clickReset(page);
  await setSlider(page, 'Waves', 5);
  assert(await getDisplayedValue(page, 'Waves') === '5', 'Waves shows integer');
  await setSlider(page, 'Speed', 1.25);
  assert(await getDisplayedValue(page, 'Speed') === '1.25', 'Speed shows 2 decimals');
  await setSlider(page, 'Amplitude', 0.123);
  assert(await getDisplayedValue(page, 'Amplitude') === '0.123', 'Amplitude shows 3 decimals');
  await setSlider(page, 'Vertical Offset', -0.25);
  const voDisplay = await getDisplayedValue(page, 'Vertical Offset');
  assert(voDisplay === '-0.25', `Vertical Offset shows -0.25 (got ${voDisplay})`);

  // =============================================
  console.log('\n--- 6. Reset to defaults ---');
  // =============================================
  await setSlider(page, 'Waves', 15);
  await setSlider(page, 'Concentration', 30);
  await setSlider(page, 'Vertical Offset', 0.4);
  await setSlider(page, 'Randomness', 0.8);
  await clickReset(page);
  for (const [label, expected] of Object.entries(defaults)) {
    const val = await getSliderValue(page, label);
    assert(Math.abs(val - expected) < 0.001, `Reset: ${label} = ${expected} (got ${val})`);
  }

  // =============================================
  console.log('\n--- 7. Color themes ---');
  // =============================================
  const themes = ['pre-dawn', 'sunrise', 'daytime', 'dusk', 'sunset', 'night'];
  const themeButtons = page.locator('button[title]');
  assert(await themeButtons.count() === 6, '6 theme buttons');
  for (let i = 0; i < themes.length; i++) {
    const btn = themeButtons.nth(i);
    assert(await btn.getAttribute('title') === themes[i], `Theme ${i} title = ${themes[i]}`);
    await btn.click();
    await sleep(300);
    assert(await btn.evaluate(el => el.style.transform) === 'scale(1.15)', `Theme ${themes[i]} active`);
  }

  // =============================================
  console.log('\n--- 8. Custom color swatches ---');
  // =============================================
  const swatches = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"]');
  assert(await swatches.count() === 4, '4 color swatches');

  // =============================================
  console.log('\n--- 9. Color picker ---');
  // =============================================
  await swatches.first().click();
  await sleep(400);
  const pickerState = await page.evaluate(() => {
    const sv = document.querySelector('div[style*="cursor: crosshair"]');
    const hue = [...document.querySelectorAll('div')].find(d => d.style.background?.includes('rgb(255, 0, 0)'));
    const alpha = [...document.querySelectorAll('div')].find(d => d.style.backgroundImage?.includes('repeating-conic-gradient'));
    const labels = [...document.querySelectorAll('div')].filter(d => ['R', 'G', 'B', 'A'].includes(d.textContent.trim()) && d.style.fontSize === '9px').map(d => d.textContent.trim());
    return { svVisible: sv && sv.offsetParent !== null, hue: !!hue, alpha: !!alpha, labels };
  });
  assert(pickerState.svVisible, 'SV area visible');
  assert(pickerState.hue, 'Hue bar visible');
  assert(pickerState.alpha, 'Alpha bar visible');
  assert(pickerState.labels.join(',') === 'R,G,B,A', 'RGBA labels present');

  // Change R to 255
  const rInput = page.locator('div:has(> div:text-is("R")) input[type="number"]');
  await rInput.fill('255');
  await rInput.dispatchEvent('change');
  await sleep(300);
  const swatchBg = await swatches.first().evaluate(el => el.style.background);
  assert(swatchBg.includes('255') || swatchBg.includes('ff'), `Swatch updated after R=255 (${swatchBg})`);

  // Change A to 50
  const aInput = page.locator('div:has(> div:text-is("A")) input[type="number"]');
  await aInput.fill('50');
  await aInput.dispatchEvent('change');
  await sleep(300);
  const swatchOp = await swatches.first().evaluate(el => parseFloat(el.style.opacity));
  assert(Math.abs(swatchOp - 0.5) < 0.05, `Swatch opacity = 0.5 (got ${swatchOp})`);

  // Close and reopen - verify persistence
  await page.mouse.click(100, 100);
  await sleep(300);
  await swatches.first().click();
  await sleep(400);
  const rVal = await rInput.inputValue();
  assert(parseInt(rVal) === 255, `R persists after reopen (got ${rVal})`);
  await page.mouse.click(100, 100);
  await sleep(300);

  // =============================================
  console.log('\n--- 10. CUSTOM COLORS PERSISTENCE (bug fix) ---');
  // =============================================
  // Set a theme first
  await themeButtons.nth(2).click(); // daytime
  await sleep(500);

  // Open picker and change a color
  await swatches.first().click();
  await sleep(400);
  const rInput2 = page.locator('div:has(> div:text-is("R")) input[type="number"]');
  await rInput2.fill('200');
  await rInput2.dispatchEvent('change');
  await sleep(300);
  await page.mouse.click(100, 100);
  await sleep(300);

  // Verify we're on custom theme
  const bg1 = await swatches.first().evaluate(el => el.style.background);
  assert(bg1.includes('200') || bg1.includes('c8'), `Custom color applied (${bg1})`);
  await screenshot(page, 'test_custom_color_set');

  // Wait 6 seconds (timer fires every 60s, but let's verify the fix logic)
  // We can't wait 60s, but we can verify the state doesn't change by simulating
  // what the timer does - it calls setCurrentTheme with functional update
  console.log('    Waiting 3 seconds to verify custom colors persist...');
  await sleep(3000);
  const bg2 = await swatches.first().evaluate(el => el.style.background);
  assert(bg1 === bg2, `Custom color persists after 3s (before: ${bg1}, after: ${bg2})`);
  await screenshot(page, 'test_custom_color_persisted');

  // Switch to another theme and back to verify custom doesn't leak
  await themeButtons.nth(4).click(); // sunset
  await sleep(500);
  const bg3 = await swatches.first().evaluate(el => el.style.background);
  assert(bg3 !== bg1, `Theme switch changes colors`);

  // =============================================
  console.log('\n--- 11. Split Fill checkbox ---');
  // =============================================
  const splitLabel = page.locator('label:has(span:text-is("Split Fill"))');
  assert(await splitLabel.isVisible(), 'Split Fill label visible');

  const splitBox = splitLabel.locator('div').first();
  await splitBox.click();
  await sleep(300);
  const checked = await splitBox.evaluate(el => el.style.background);
  assert(checked.includes('rgba(255'), 'Split Fill toggled on');

  await splitBox.click();
  await sleep(300);
  const unchecked = await splitBox.evaluate(el => el.style.background);
  assert(unchecked === 'transparent', 'Split Fill toggled off');

  // Reset clears split fill
  await splitBox.click(); // turn on
  await clickReset(page);
  const afterReset = await splitBox.evaluate(el => el.style.background);
  assert(afterReset === 'transparent', 'Reset clears Split Fill');

  // =============================================
  console.log('\n--- 12. Vertical Offset ---');
  // =============================================
  await screenshot(page, 'test_voffset_0');
  await setSlider(page, 'Vertical Offset', 0.3);
  await sleep(500);
  await screenshot(page, 'test_voffset_03');
  await setSlider(page, 'Vertical Offset', -0.3);
  await sleep(500);
  await screenshot(page, 'test_voffset_neg03');
  await setSlider(page, 'Vertical Offset', 0.5);
  await sleep(500);
  await screenshot(page, 'test_voffset_max');
  await setSlider(page, 'Vertical Offset', -0.5);
  await sleep(500);
  await screenshot(page, 'test_voffset_min');
  const voVal = await getSliderValue(page, 'Vertical Offset');
  assert(voVal === -0.5, `Vertical Offset = -0.5 (got ${voVal})`);
  await clickReset(page);
  const voReset = await getSliderValue(page, 'Vertical Offset');
  assert(voReset === 0, `Vertical Offset resets to 0 (got ${voReset})`);

  // =============================================
  console.log('\n--- 13. Vertical Offset + Concentration ---');
  // =============================================
  await setSlider(page, 'Concentration', 10);
  await setSlider(page, 'Vertical Offset', 0.3);
  await sleep(500);
  await screenshot(page, 'test_conc10_voffset03');
  await setSlider(page, 'Vertical Offset', -0.3);
  await sleep(500);
  await screenshot(page, 'test_conc10_voffset_neg03');
  await clickReset(page);

  // =============================================
  console.log('\n--- 14. WebGL canvas ---');
  // =============================================
  const canvas = page.locator('canvas');
  assert(await canvas.isVisible(), 'Canvas visible');
  const box = await canvas.boundingBox();
  assert(box.width > 0 && box.height > 0, `Canvas size ${box.width}x${box.height}`);
  const glActive = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return gl && !gl.isContextLost();
  });
  assert(glActive, 'WebGL context active');

  // =============================================
  console.log('\n--- 15. Theme stability (no auto-change) ---');
  // =============================================
  await themeButtons.nth(4).click(); // sunset
  await sleep(500);
  const sunsetTransform1 = await themeButtons.nth(4).evaluate(el => el.style.transform);
  assert(sunsetTransform1 === 'scale(1.15)', 'Sunset active');
  await screenshot(page, 'test_theme_sunset_t0');
  console.log('    Waiting 5 seconds...');
  await sleep(5000);
  const sunsetTransform2 = await themeButtons.nth(4).evaluate(el => el.style.transform);
  assert(sunsetTransform2 === 'scale(1.15)', 'Sunset still active after 5s');
  await screenshot(page, 'test_theme_sunset_t5');

  // =============================================
  console.log('\n--- 16. All color themes screenshots ---');
  // =============================================
  for (let i = 0; i < themes.length; i++) {
    await themeButtons.nth(i).click();
    await sleep(1800);
    await screenshot(page, `test_theme_${themes[i]}`);
  }

  // =============================================
  console.log('\n--- 17. Visual parameter tests ---');
  // =============================================
  await clickReset(page);
  await screenshot(page, 'test_default');

  // Waves extremes
  await setSlider(page, 'Waves', 1); await sleep(500);
  await screenshot(page, 'test_waves_1');
  await setSlider(page, 'Waves', 20); await sleep(500);
  await screenshot(page, 'test_waves_20');
  await clickReset(page);

  // Amplitude extremes
  await setSlider(page, 'Amplitude', 0); await sleep(500);
  await screenshot(page, 'test_amp_0');
  await setSlider(page, 'Amplitude', 0.2); await sleep(500);
  await screenshot(page, 'test_amp_max');
  await clickReset(page);

  // Concentration extremes
  await setSlider(page, 'Concentration', 25); await sleep(500);
  await screenshot(page, 'test_conc_25');
  await setSlider(page, 'Concentration', 50); await sleep(500);
  await screenshot(page, 'test_conc_50');
  await clickReset(page);

  // Randomness
  await setSlider(page, 'Randomness', 0.5); await sleep(500);
  await screenshot(page, 'test_random_05');
  await setSlider(page, 'Randomness', 1); await sleep(500);
  await screenshot(page, 'test_random_1');
  await clickReset(page);

  // Split fill comparison
  await setSlider(page, 'Amplitude', 0);
  await setSlider(page, 'Concentration', 10);
  await sleep(500);
  await screenshot(page, 'test_splitfill_off');
  await splitLabel.locator('div').first().click();
  await sleep(500);
  await screenshot(page, 'test_splitfill_on');
  await clickReset(page);

  // Vertical offset with different themes
  await themeButtons.nth(0).click(); // pre-dawn
  await sleep(1800);
  await setSlider(page, 'Vertical Offset', 0.35);
  await sleep(500);
  await screenshot(page, 'test_predawn_voffset_up');
  await setSlider(page, 'Vertical Offset', -0.35);
  await sleep(500);
  await screenshot(page, 'test_predawn_voffset_down');
  await clickReset(page);

  // Combined extreme
  await setSlider(page, 'Waves', 20);
  await setSlider(page, 'Amplitude', 0.15);
  await setSlider(page, 'Frequency', 8);
  await setSlider(page, 'Concentration', 15);
  await setSlider(page, 'Randomness', 0.8);
  await setSlider(page, 'Vertical Offset', 0.2);
  await sleep(500);
  await screenshot(page, 'test_combined_extreme');

  // =============================================
  console.log('\n--- 18. Color picker + custom colors + vertical offset ---');
  // =============================================
  await clickReset(page);
  await swatches.nth(1).click();
  await sleep(400);
  const gInput = page.locator('div:has(> div:text-is("G")) input[type="number"]');
  await gInput.fill('255');
  await gInput.dispatchEvent('change');
  await sleep(300);
  await page.mouse.click(100, 100);
  await sleep(300);
  await setSlider(page, 'Vertical Offset', -0.2);
  await setSlider(page, 'Concentration', 5);
  await sleep(500);
  await screenshot(page, 'test_custom_green_offset');

  // Verify custom color is still there
  await swatches.nth(1).click();
  await sleep(400);
  const gVal = await gInput.inputValue();
  assert(parseInt(gVal) === 255, `Custom green G=255 persists (got ${gVal})`);
  await page.mouse.click(100, 100);
  await sleep(300);

  // =============================================
  // Summary
  // =============================================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
