import { chromium } from '@playwright/test';

const URL = 'http://localhost:5174';
let passed = 0, failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

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
    const input = span.closest('label').querySelector('input[type="range"]');
    return parseFloat(input.value);
  }, label);
}

async function getDisplayedValue(page, label) {
  return page.evaluate((label) => {
    const spans = [...document.querySelectorAll('span')];
    const span = spans.find(s => s.textContent === label);
    if (!span) return null;
    const valueSpan = span.parentElement.querySelector('span[style*="monospace"]');
    return valueSpan ? valueSpan.textContent.trim() : null;
  }, label);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL);
  await sleep(2000);

  // =============================================
  console.log('\n--- 1. Panel visibility ---');
  // =============================================
  const panelVisible = await page.locator('text=Waves').first().isVisible();
  assert(panelVisible, 'Control panel is visible on load');

  const controlsBtn = page.locator('button:has-text("Controls")');
  await controlsBtn.click();
  await sleep(300);
  const panelHidden = !(await page.locator('text=Waves').first().isVisible());
  assert(panelHidden, 'Panel hides when Controls clicked');

  await controlsBtn.click();
  await sleep(300);
  const panelBack = await page.locator('text=Waves').first().isVisible();
  assert(panelBack, 'Panel shows again when Controls clicked');

  // =============================================
  console.log('\n--- 2. Default values ---');
  // =============================================
  const defaults = {
    Waves: 8, Speed: 0.3, Amplitude: 0.06, Frequency: 2.5,
    Opacity: 0.6, Thickness: 0.06, Blur: 0.03, Concentration: 0,
  };
  for (const [label, expected] of Object.entries(defaults)) {
    const val = await getSliderValue(page, label);
    assert(Math.abs(val - expected) < 0.001, `Default ${label} = ${expected} (got ${val})`);
  }

  // =============================================
  console.log('\n--- 3. Slider value changes ---');
  // =============================================
  const tests = [
    { label: 'Waves', value: 12, min: 1, max: 20 },
    { label: 'Speed', value: 1.5, min: 0, max: 2 },
    { label: 'Amplitude', value: 0.15, min: 0, max: 0.2 },
    { label: 'Frequency', value: 7, min: 0.5, max: 10 },
    { label: 'Opacity', value: 0.8, min: 0, max: 1 },
    { label: 'Thickness', value: 0.12, min: 0.01, max: 0.2 },
    { label: 'Blur', value: 0.2, min: 0, max: 0.3 },
    { label: 'Concentration', value: 5, min: 0, max: 10 },
  ];
  for (const t of tests) {
    await setSlider(page, t.label, t.value);
    const val = await getSliderValue(page, t.label);
    assert(Math.abs(val - t.value) < 0.01, `${t.label} set to ${t.value} (got ${val})`);
  }

  // =============================================
  console.log('\n--- 4. Slider min/max bounds ---');
  // =============================================
  for (const t of tests) {
    const { min, max } = await page.evaluate((label) => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === label);
      const input = span.closest('label').querySelector('input[type="range"]');
      return { min: parseFloat(input.min), max: parseFloat(input.max) };
    }, t.label);
    assert(min === t.min, `${t.label} min = ${t.min} (got ${min})`);
    assert(max === t.max, `${t.label} max = ${t.max} (got ${max})`);
  }

  // =============================================
  console.log('\n--- 5. Displayed value updates ---');
  // =============================================
  await setSlider(page, 'Waves', 5);
  const wavesDisplay = await getDisplayedValue(page, 'Waves');
  assert(wavesDisplay === '5', `Waves display shows "5" (got "${wavesDisplay}")`);

  await setSlider(page, 'Speed', 1.25);
  const speedDisplay = await getDisplayedValue(page, 'Speed');
  assert(speedDisplay === '1.25', `Speed display shows "1.25" (got "${speedDisplay}")`);

  await setSlider(page, 'Amplitude', 0.123);
  const ampDisplay = await getDisplayedValue(page, 'Amplitude');
  assert(ampDisplay === '0.123', `Amplitude display shows "0.123" (got "${ampDisplay}")`);

  // =============================================
  console.log('\n--- 6. Reset to defaults ---');
  // =============================================
  // Set non-default values first
  await setSlider(page, 'Waves', 15);
  await setSlider(page, 'Speed', 1.8);
  await setSlider(page, 'Concentration', 8);

  await page.locator('button:has-text("Reset to defaults")').click();
  await sleep(500);

  for (const [label, expected] of Object.entries(defaults)) {
    const val = await getSliderValue(page, label);
    assert(Math.abs(val - expected) < 0.001, `After reset: ${label} = ${expected} (got ${val})`);
  }

  // =============================================
  console.log('\n--- 7. Color themes ---');
  // =============================================
  const themes = ['pre-dawn', 'sunrise', 'daytime', 'dusk', 'sunset', 'night'];
  const themeButtons = page.locator('button[title]');
  const themeCount = await themeButtons.count();
  assert(themeCount === 6, `6 theme buttons exist (got ${themeCount})`);

  for (let i = 0; i < themes.length; i++) {
    const btn = themeButtons.nth(i);
    const title = await btn.getAttribute('title');
    assert(title === themes[i], `Theme button ${i} title = "${themes[i]}" (got "${title}")`);

    await btn.click();
    await sleep(300);
    // Check the button has active border (scale transform)
    const transform = await btn.evaluate(el => el.style.transform);
    assert(transform === 'scale(1.15)', `Theme "${themes[i]}" is visually active`);
  }

  // =============================================
  console.log('\n--- 8. Custom color swatches ---');
  // =============================================
  const swatches = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"]');
  const swatchCount = await swatches.count();
  assert(swatchCount === 4, `4 custom color swatches exist (got ${swatchCount})`);

  // =============================================
  console.log('\n--- 9. Color picker popup ---');
  // =============================================
  const firstSwatch = swatches.first();
  await firstSwatch.click();
  await sleep(400);

  // Check picker elements via evaluate
  const pickerState = await page.evaluate(() => {
    const svArea = document.querySelector('div[style*="cursor: crosshair"]');
    const hueBar = [...document.querySelectorAll('div')].find(d => d.style.background?.includes('rgb(255, 0, 0)'));
    const alphaBar = [...document.querySelectorAll('div')].find(d => d.style.backgroundImage?.includes('repeating-conic-gradient'));
    const labels = [...document.querySelectorAll('div')].filter(d => ['R', 'G', 'B', 'A'].includes(d.textContent.trim()) && d.style.fontSize === '9px').map(d => d.textContent.trim());
    const numberInputs = document.querySelectorAll('input[type="number"]');
    return {
      svAreaVisible: svArea && svArea.offsetParent !== null,
      hueBarExists: !!hueBar,
      alphaBarExists: !!alphaBar,
      labels,
      numberInputCount: numberInputs.length,
    };
  });

  assert(pickerState.svAreaVisible, 'SV area is visible in picker');
  assert(pickerState.hueBarExists, 'Hue bar is visible in picker');
  assert(pickerState.alphaBarExists, 'Alpha bar with checkerboard is visible');
  assert(pickerState.labels.length === 4, `RGBA labels exist (got ${pickerState.labels.join(',')})`);
  assert(pickerState.labels.includes('R'), 'R label exists');
  assert(pickerState.labels.includes('G'), 'G label exists');
  assert(pickerState.labels.includes('B'), 'B label exists');
  assert(pickerState.labels.includes('A'), 'A label exists');
  assert(pickerState.numberInputCount === 4, `4 number inputs (R,G,B,A) exist (got ${pickerState.numberInputCount})`);

  // Close picker
  await page.mouse.click(100, 100);
  await sleep(300);
  const popupGone = await page.evaluate(() => !document.querySelector('div[style*="cursor: crosshair"]')?.offsetParent);
  assert(popupGone, 'Picker closes on outside click');

  // =============================================
  console.log('\n--- 10. Custom color changes persist ---');
  // =============================================
  // Set theme to sunrise first
  await themeButtons.nth(1).click();
  await sleep(500);

  // Open first swatch and change color via RGB input
  await firstSwatch.click();
  await sleep(400);

  // Change R value to 255
  const rInput = page.locator('div:has(> div:text-is("R")) input[type="number"]');
  await rInput.fill('255');
  await rInput.dispatchEvent('change');
  await sleep(300);

  // Verify the swatch updated
  const swatchBg = await firstSwatch.evaluate(el => el.style.background);
  assert(swatchBg.includes('ff') || swatchBg.includes('255'), `Swatch color updated after R=255 (bg: ${swatchBg})`);

  // Close picker and reopen - value should persist
  await page.mouse.click(100, 100);
  await sleep(300);
  await firstSwatch.click();
  await sleep(400);
  const rVal = await rInput.inputValue();
  assert(parseInt(rVal) === 255, `R value persists after reopen (got ${rVal})`);
  await page.mouse.click(100, 100);
  await sleep(300);

  // =============================================
  console.log('\n--- 11. Alpha/opacity input ---');
  // =============================================
  await firstSwatch.click();
  await sleep(400);
  const aInput = page.locator('div:has(> div:text-is("A")) input[type="number"]');
  await aInput.fill('50');
  await aInput.dispatchEvent('change');
  await sleep(300);

  // Check swatch has reduced opacity
  const swatchOpacity = await firstSwatch.evaluate(el => parseFloat(el.style.opacity));
  assert(Math.abs(swatchOpacity - 0.5) < 0.05, `Swatch opacity = 0.5 after A=50 (got ${swatchOpacity})`);
  await page.mouse.click(100, 100);
  await sleep(300);

  // =============================================
  console.log('\n--- 12. WebGL canvas rendering ---');
  // =============================================
  const canvas = page.locator('canvas');
  assert(await canvas.isVisible(), 'WebGL canvas is visible');

  // Check canvas has non-zero dimensions
  const canvasBox = await canvas.boundingBox();
  assert(canvasBox.width > 0 && canvasBox.height > 0, `Canvas has size ${canvasBox.width}x${canvasBox.height}`);

  // Verify WebGL context is active (not lost)
  const glActive = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return gl && !gl.isContextLost();
  });
  assert(glActive, 'WebGL context is active (not lost)');

  // =============================================
  console.log('\n--- 13. Concentration slider range ---');
  // =============================================
  await setSlider(page, 'Concentration', 0);
  let concVal = await getSliderValue(page, 'Concentration');
  assert(concVal === 0, `Concentration min = 0 (got ${concVal})`);

  await setSlider(page, 'Concentration', 10);
  concVal = await getSliderValue(page, 'Concentration');
  assert(concVal === 10, `Concentration max = 10 (got ${concVal})`);

  // =============================================
  console.log('\n--- 14. Multiple color swatches independent ---');
  // =============================================
  // Reset to a known theme
  await themeButtons.nth(2).click(); // daytime
  await sleep(500);

  // Get colors of all 4 swatches
  const swatchColors = await page.evaluate(() => {
    const divs = [...document.querySelectorAll('div[style*="border-radius: 6px"][style*="cursor: pointer"]')];
    return divs.slice(0, 4).map(d => d.style.background);
  });
  const allDifferent = new Set(swatchColors).size === swatchColors.length;
  assert(allDifferent, `All 4 swatches have different colors`);

  // =============================================
  // Summary
  // =============================================
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(40)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
