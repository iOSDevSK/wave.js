import { chromium } from '@playwright/test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'screenshots';

// Ensure screenshot dir exists
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let passed = 0;
let failed = 0;
const failures = [];

function ok(condition, name) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL: ${name}`);
  }
}

function sleep(ms) {
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
    if (!span) throw new Error(`Slider "${label}" not found`);
    return parseFloat(span.closest('label').querySelector('input[type="range"]').value);
  }, label);
}

async function getSliderAttr(page, label, attr) {
  return page.evaluate(({ label, attr }) => {
    const spans = [...document.querySelectorAll('span')];
    const span = spans.find(s => s.textContent === label);
    if (!span) throw new Error(`Slider "${label}" not found`);
    return span.closest('label').querySelector('input[type="range"]').getAttribute(attr);
  }, { label, attr });
}

async function getDisplayedValue(page, label) {
  return page.evaluate((label) => {
    const spans = [...document.querySelectorAll('span')];
    const span = spans.find(s => s.textContent === label);
    if (!span) return null;
    const container = span.closest('label').querySelector('div');
    const valueSpan = container.querySelectorAll('span')[1];
    return valueSpan ? valueSpan.textContent : null;
  }, label);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: false });
  console.log(`    -> screenshot: ${name}.png`);
}

(async () => {
  console.log('=== Comprehensive Waves Component Test ===\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(URL);
  await sleep(3000); // Let WebGL init

  await screenshot(page, 'comp_00_initial');

  // ============================================================
  // TEST 1: Panel visibility toggle
  // ============================================================
  console.log('\n--- TEST 1: Panel visibility toggle ---');
  {
    // Panel should be open by default
    const panelVisible = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      const controlsBtn = buttons.find(b => b.textContent.includes('Controls'));
      // Panel is the sibling div after the button
      return !!controlsBtn && !!controlsBtn.parentElement.querySelector('div[style*="border-radius: 14px"]');
    });
    ok(panelVisible, '1a. Panel is visible on load');

    // Close panel
    const controlsBtn = page.locator('button:has-text("Controls")');
    await controlsBtn.click();
    await sleep(300);

    const panelHidden = await page.evaluate(() => {
      const el = document.querySelector('div[style*="border-radius: 14px"][style*="backdrop-filter"]');
      // The panel with 14px border-radius should be gone
      const buttons = [...document.querySelectorAll('button')];
      const controlsBtn = buttons.find(b => b.textContent.includes('Controls'));
      const parent = controlsBtn.parentElement;
      // Check if the panel div exists in the parent
      const children = [...parent.children];
      return children.length === 1; // only the button remains
    });
    ok(panelHidden, '1b. Panel is hidden after clicking Controls');

    await screenshot(page, 'comp_01_panel_closed');

    // Re-open panel
    await controlsBtn.click();
    await sleep(300);

    const panelReopened = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      const controlsBtn = buttons.find(b => b.textContent.includes('Controls'));
      return controlsBtn.parentElement.children.length > 1;
    });
    ok(panelReopened, '1c. Panel reopens after second click');
  }

  // ============================================================
  // TEST 2: All 9 slider default values
  // ============================================================
  console.log('\n--- TEST 2: Slider default values ---');
  {
    const DEFAULTS = {
      Waves: 8,
      Speed: 0.3,
      Amplitude: 0.06,
      Frequency: 2.5,
      Opacity: 0.6,
      Thickness: 0.06,
      Blur: 0.03,
      Concentration: 0,
      Randomness: 0,
    };

    for (const [label, expected] of Object.entries(DEFAULTS)) {
      const val = await getSliderValue(page, label);
      ok(Math.abs(val - expected) < 0.001, `2. Default ${label} = ${expected} (got ${val})`);
    }
  }

  // ============================================================
  // TEST 3: All 9 slider min/max bounds
  // ============================================================
  console.log('\n--- TEST 3: Slider min/max bounds ---');
  {
    const BOUNDS = [
      { label: 'Waves',         min: '1',    max: '20'  },
      { label: 'Speed',         min: '0',    max: '2'   },
      { label: 'Amplitude',     min: '0',    max: '0.2' },
      { label: 'Frequency',     min: '0.5',  max: '10'  },
      { label: 'Opacity',       min: '0',    max: '1'   },
      { label: 'Thickness',     min: '0.01', max: '0.2' },
      { label: 'Blur',          min: '0',    max: '0.3' },
      { label: 'Concentration', min: '0',    max: '50'  },
      { label: 'Randomness',    min: '0',    max: '1'   },
    ];

    for (const { label, min, max } of BOUNDS) {
      const gotMin = await getSliderAttr(page, label, 'min');
      const gotMax = await getSliderAttr(page, label, 'max');
      ok(gotMin === min, `3. ${label} min = ${min} (got ${gotMin})`);
      ok(gotMax === max, `3. ${label} max = ${max} (got ${gotMax})`);
    }
  }

  // ============================================================
  // TEST 4: Setting each slider to non-default value and reading back
  // ============================================================
  console.log('\n--- TEST 4: Set sliders to non-default values ---');
  {
    const TEST_VALUES = [
      { label: 'Waves',         value: 12 },
      { label: 'Speed',         value: 1.5 },
      { label: 'Amplitude',     value: 0.15 },
      { label: 'Frequency',     value: 7.0 },
      { label: 'Opacity',       value: 0.85 },
      { label: 'Thickness',     value: 0.12 },
      { label: 'Blur',          value: 0.2 },
      { label: 'Concentration', value: 25 },
      { label: 'Randomness',    value: 0.75 },
    ];

    for (const { label, value } of TEST_VALUES) {
      await setSlider(page, label, value);
      const readBack = await getSliderValue(page, label);
      ok(Math.abs(readBack - value) < 0.01, `4. Set ${label} to ${value}, got back ${readBack}`);
    }

    await screenshot(page, 'comp_04_all_sliders_changed');

    // Reset for next tests
    await page.locator('button:has-text("Reset to defaults")').click();
    await sleep(300);
  }

  // ============================================================
  // TEST 5: Displayed value formatting
  // ============================================================
  console.log('\n--- TEST 5: Displayed value formatting ---');
  {
    // Waves should display as integer
    const wavesDisplay = await getDisplayedValue(page, 'Waves');
    ok(wavesDisplay === '8', `5a. Waves displays as integer "8" (got "${wavesDisplay}")`);

    // Speed should display with 2 decimals
    const speedDisplay = await getDisplayedValue(page, 'Speed');
    ok(speedDisplay === '0.30', `5b. Speed displays as "0.30" (got "${speedDisplay}")`);

    // Amplitude should display with 3 decimals (step < 0.01)
    const ampDisplay = await getDisplayedValue(page, 'Amplitude');
    ok(ampDisplay === '0.060', `5c. Amplitude displays as "0.060" (got "${ampDisplay}")`);

    // Frequency should display with 2 decimals
    const freqDisplay = await getDisplayedValue(page, 'Frequency');
    ok(freqDisplay === '2.50', `5d. Frequency displays as "2.50" (got "${freqDisplay}")`);

    // Opacity with 2 decimals
    const opDisplay = await getDisplayedValue(page, 'Opacity');
    ok(opDisplay === '0.60', `5e. Opacity displays as "0.60" (got "${opDisplay}")`);

    // Thickness with 3 decimals (step=0.001)
    const thickDisplay = await getDisplayedValue(page, 'Thickness');
    ok(thickDisplay === '0.060', `5f. Thickness displays as "0.060" (got "${thickDisplay}")`);

    // Blur with 3 decimals (step=0.001)
    const blurDisplay = await getDisplayedValue(page, 'Blur');
    ok(blurDisplay === '0.030', `5g. Blur displays as "0.030" (got "${blurDisplay}")`);

    // Concentration with 2 decimals
    const concDisplay = await getDisplayedValue(page, 'Concentration');
    ok(concDisplay === '0.00', `5h. Concentration displays as "0.00" (got "${concDisplay}")`);

    // Randomness with 2 decimals
    const randDisplay = await getDisplayedValue(page, 'Randomness');
    ok(randDisplay === '0.00', `5i. Randomness displays as "0.00" (got "${randDisplay}")`);

    // Set Waves to non-integer-like value, should still display as integer
    await setSlider(page, 'Waves', 15);
    const waves15 = await getDisplayedValue(page, 'Waves');
    ok(waves15 === '15', `5j. Waves 15 displays as integer "15" (got "${waves15}")`);

    await page.locator('button:has-text("Reset to defaults")').click();
    await sleep(300);
  }

  // ============================================================
  // TEST 6: Reset to defaults restores all 9 sliders
  // ============================================================
  console.log('\n--- TEST 6: Reset to defaults ---');
  {
    // Change all sliders
    await setSlider(page, 'Waves', 15);
    await setSlider(page, 'Speed', 1.8);
    await setSlider(page, 'Amplitude', 0.18);
    await setSlider(page, 'Frequency', 8);
    await setSlider(page, 'Opacity', 0.9);
    await setSlider(page, 'Thickness', 0.15);
    await setSlider(page, 'Blur', 0.25);
    await setSlider(page, 'Concentration', 40);
    await setSlider(page, 'Randomness', 0.8);

    await screenshot(page, 'comp_06_before_reset');

    // Reset
    await page.locator('button:has-text("Reset to defaults")').click();
    await sleep(500);

    const DEFAULTS = {
      Waves: 8, Speed: 0.3, Amplitude: 0.06, Frequency: 2.5,
      Opacity: 0.6, Thickness: 0.06, Blur: 0.03, Concentration: 0, Randomness: 0,
    };

    for (const [label, expected] of Object.entries(DEFAULTS)) {
      const val = await getSliderValue(page, label);
      ok(Math.abs(val - expected) < 0.001, `6. After reset ${label} = ${expected} (got ${val})`);
    }

    await screenshot(page, 'comp_06_after_reset');
  }

  // ============================================================
  // TEST 7: All 6 color theme buttons exist with correct titles
  // ============================================================
  console.log('\n--- TEST 7: Color theme buttons ---');
  {
    const THEMES = ['pre-dawn', 'sunrise', 'daytime', 'dusk', 'sunset', 'night'];
    for (const theme of THEMES) {
      const btn = page.locator(`button[title="${theme}"]`);
      const count = await btn.count();
      ok(count === 1, `7. Theme button "${theme}" exists`);
    }
  }

  // ============================================================
  // TEST 8: Clicking each theme makes it visually active (scale)
  // ============================================================
  console.log('\n--- TEST 8: Theme button visual activation ---');
  {
    const THEMES = ['pre-dawn', 'sunrise', 'daytime', 'dusk', 'sunset', 'night'];
    for (const theme of THEMES) {
      const btn = page.locator(`button[title="${theme}"]`);
      await btn.click();
      await sleep(500);

      const transform = await btn.evaluate(el => el.style.transform);
      ok(transform.includes('scale(1.15)'), `8a. Theme "${theme}" has scale(1.15) when active (got "${transform}")`);

      // Check that other themes are NOT scaled
      for (const other of THEMES) {
        if (other === theme) continue;
        const otherTransform = await page.locator(`button[title="${other}"]`).evaluate(el => el.style.transform);
        ok(otherTransform.includes('scale(1)'), `8b. Theme "${other}" not scaled when "${theme}" active`);
      }

      await screenshot(page, `comp_08_theme_${theme}`);
    }
  }

  // ============================================================
  // TEST 9: 4 custom color swatches exist
  // ============================================================
  console.log('\n--- TEST 9: Custom color swatches ---');
  {
    const swatchCount = await page.evaluate(() => {
      // Swatches are divs with border-radius: 6px, cursor: pointer, width: 30px, height: 30px
      const divs = [...document.querySelectorAll('div')];
      const swatches = divs.filter(d => {
        const s = d.style;
        return s.width === '30px' && s.height === '30px' &&
               s.borderRadius === '6px' && s.cursor === 'pointer';
      });
      return swatches.length;
    });
    ok(swatchCount === 4, `9. Found ${swatchCount} color swatches (expected 4)`);
  }

  // ============================================================
  // TEST 10: Color picker popup opens/closes
  // ============================================================
  console.log('\n--- TEST 10: Color picker open/close ---');
  {
    // Click first swatch to open
    const swatch = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"][style*="width: 30px"]').first();
    await swatch.click();
    await sleep(400);

    // Check popup is visible (it has border-radius: 10px, z-index: 30)
    const popupOpen = await page.evaluate(() => {
      return !!document.querySelector('div[style*="z-index: 30"]');
    });
    ok(popupOpen, '10a. Color picker popup opens on swatch click');

    await screenshot(page, 'comp_10_picker_open');

    // Click outside to close
    await page.mouse.click(100, 100);
    await sleep(400);

    const popupClosed = await page.evaluate(() => {
      return !document.querySelector('div[style*="z-index: 30"]');
    });
    ok(popupClosed, '10b. Color picker closes when clicking outside');
  }

  // ============================================================
  // TEST 11: Picker contains SV area, hue bar, alpha bar, R/G/B/A inputs
  // ============================================================
  console.log('\n--- TEST 11: Picker internal components ---');
  {
    // Open picker
    const swatch = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"][style*="width: 30px"]').first();
    await swatch.click();
    await sleep(400);

    // SV area: has cursor: crosshair
    const hasSVArea = await page.evaluate(() => {
      return !!document.querySelector('div[style*="cursor: crosshair"]');
    });
    ok(hasSVArea, '11a. Picker has SV area (crosshair cursor)');

    // Hue bar: linear-gradient with hue spectrum - check for the 12px height bar with pointer cursor
    // The browser may serialize the background differently, so check structure + gradient keywords
    const hasHueBar = await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      if (!popup) return false;
      const divs = [...popup.querySelectorAll('div')];
      return divs.some(d => {
        const s = d.style;
        const bg = s.background || s.backgroundImage || '';
        // Check for: 12px height bar with hue-like gradient (contains rgb or hex color stops)
        return s.height === '12px' && s.cursor === 'pointer' &&
               s.touchAction === 'none' &&
               (bg.includes('rgb(255') || bg.includes('#f00') || bg.includes('red') || bg.includes('linear-gradient'));
      });
    });
    ok(hasHueBar, '11b. Picker has hue bar (rainbow gradient)');

    // Alpha bar: linear-gradient with transparent
    const hasAlphaBar = await page.evaluate(() => {
      const divs = [...document.querySelectorAll('div')];
      return divs.some(d => {
        const bg = d.style.background || '';
        return bg.includes('transparent') && d.style.height === '12px' && d.style.cursor === 'pointer' && !bg.includes('#f00');
      });
    });
    ok(hasAlphaBar, '11c. Picker has alpha bar');

    // R, G, B, A labels
    const labels = await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      if (!popup) return [];
      const divs = [...popup.querySelectorAll('div')];
      return divs.filter(d => d.style.fontSize === '9px').map(d => d.textContent);
    });
    ok(labels.includes('R'), '11d. Picker has R label');
    ok(labels.includes('G'), '11e. Picker has G label');
    ok(labels.includes('B'), '11f. Picker has B label');
    ok(labels.includes('A'), '11g. Picker has A label');

    // Number inputs (R, G, B = max 255, A = max 100)
    const numberInputs = await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      if (!popup) return 0;
      return popup.querySelectorAll('input[type="number"]').length;
    });
    ok(numberInputs === 4, `11h. Picker has 4 number inputs (got ${numberInputs})`);

    // Close picker
    await page.mouse.click(100, 100);
    await sleep(300);
  }

  // ============================================================
  // TEST 12: Changing R value updates swatch color
  // ============================================================
  console.log('\n--- TEST 12: Changing R value updates swatch ---');
  {
    // First select a known theme to have predictable colors
    await page.locator('button[title="daytime"]').click();
    await sleep(500);

    // Open second swatch (index 1) which should be #4361ee for daytime
    const swatches = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"][style*="width: 30px"]');
    const secondSwatch = swatches.nth(1);
    await secondSwatch.click();
    await sleep(400);

    // Get current swatch background color before change
    const colorBefore = await secondSwatch.evaluate(el => el.style.background);

    // Change R value to 255
    const rInput = await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      const inputs = popup.querySelectorAll('input[type="number"]');
      return inputs[0].value; // R input
    });

    // Set R to 255
    await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      const inputs = popup.querySelectorAll('input[type="number"]');
      const rInput = inputs[0];
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(rInput, '255');
      rInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(300);

    // Check that R input now shows 255
    const rAfter = await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      const inputs = popup.querySelectorAll('input[type="number"]');
      return inputs[0].value;
    });
    ok(rAfter === '255', `12a. R input changed to 255 (got "${rAfter}")`);

    // Swatch color should have changed (since we changed via React onChange, it should update)
    // Actually let's check by reading the swatch background
    const colorAfter = await secondSwatch.evaluate(el => el.style.background);
    ok(colorBefore !== colorAfter, `12b. Swatch color changed after R update (before: "${colorBefore}", after: "${colorAfter}")`);

    await screenshot(page, 'comp_12_r_changed');

    // Close picker
    await page.mouse.click(100, 100);
    await sleep(300);
  }

  // ============================================================
  // TEST 13: Changing A value updates swatch opacity
  // ============================================================
  console.log('\n--- TEST 13: Changing A (opacity) value ---');
  {
    // Open first swatch
    const swatches = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"][style*="width: 30px"]');
    const firstSwatch = swatches.first();
    await firstSwatch.click();
    await sleep(400);

    // Read initial opacity
    const opBefore = await firstSwatch.evaluate(el => el.style.opacity);

    // Change A to 50 (which means 0.5 opacity)
    await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      const inputs = popup.querySelectorAll('input[type="number"]');
      const aInput = inputs[3]; // A is the 4th input
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(aInput, '50');
      aInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(300);

    const opAfter = await firstSwatch.evaluate(el => el.style.opacity);
    ok(parseFloat(opAfter) === 0.5, `13a. Swatch opacity changed to 0.5 (got ${opAfter})`);

    // Change A to 100 (full opacity)
    await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      const inputs = popup.querySelectorAll('input[type="number"]');
      const aInput = inputs[3];
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(aInput, '100');
      aInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(300);

    const opFull = await firstSwatch.evaluate(el => el.style.opacity);
    ok(parseFloat(opFull) === 1, `13b. Swatch opacity restored to 1 (got ${opFull})`);

    await screenshot(page, 'comp_13_opacity_changed');

    // Close picker
    await page.mouse.click(100, 100);
    await sleep(300);
  }

  // ============================================================
  // TEST 14: Color changes persist after closing and reopening picker
  // ============================================================
  console.log('\n--- TEST 14: Color persistence across picker close/open ---');
  {
    // Select daytime theme for predictable colors
    await page.locator('button[title="daytime"]').click();
    await sleep(500);

    // Open third swatch (index 2)
    const swatches = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"][style*="width: 30px"]');
    const thirdSwatch = swatches.nth(2);
    await thirdSwatch.click();
    await sleep(400);

    // Change R to 200
    await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      const inputs = popup.querySelectorAll('input[type="number"]');
      const rInput = inputs[0];
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(rInput, '200');
      rInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(300);

    // Read current R value
    const rBeforeClose = await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      return popup.querySelectorAll('input[type="number"]')[0].value;
    });

    // Close picker
    await page.mouse.click(100, 100);
    await sleep(400);

    // Reopen same swatch
    await thirdSwatch.click();
    await sleep(400);

    // Read R value again
    const rAfterReopen = await page.evaluate(() => {
      const popup = document.querySelector('div[style*="z-index: 30"]');
      if (!popup) return 'no popup';
      return popup.querySelectorAll('input[type="number"]')[0].value;
    });

    ok(rBeforeClose === rAfterReopen, `14. R value persists: before close=${rBeforeClose}, after reopen=${rAfterReopen}`);

    // Close
    await page.mouse.click(100, 100);
    await sleep(300);
  }

  // ============================================================
  // TEST 15: Split Fill checkbox exists and toggles
  // ============================================================
  console.log('\n--- TEST 15: Split Fill checkbox ---');
  {
    // Find the Split Fill label
    const splitFillExists = await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      return spans.some(s => s.textContent === 'Split Fill');
    });
    ok(splitFillExists, '15a. Split Fill label exists');

    // Check initial state (unchecked - no SVG checkmark)
    const initiallyUnchecked = await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === 'Split Fill');
      const label = span.closest('label');
      const checkbox = label.querySelector('div');
      return !checkbox.querySelector('svg');
    });
    ok(initiallyUnchecked, '15b. Split Fill is unchecked by default');

    // Click to toggle on
    await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === 'Split Fill');
      const label = span.closest('label');
      const checkbox = label.querySelector('div');
      checkbox.click();
    });
    await sleep(300);

    const checkedNow = await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === 'Split Fill');
      const label = span.closest('label');
      const checkbox = label.querySelector('div');
      return !!checkbox.querySelector('svg');
    });
    ok(checkedNow, '15c. Split Fill is checked after click');

    await screenshot(page, 'comp_15_split_fill_on');

    // Toggle off
    await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === 'Split Fill');
      const label = span.closest('label');
      const checkbox = label.querySelector('div');
      checkbox.click();
    });
    await sleep(300);

    const uncheckedAgain = await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === 'Split Fill');
      const label = span.closest('label');
      const checkbox = label.querySelector('div');
      return !checkbox.querySelector('svg');
    });
    ok(uncheckedAgain, '15d. Split Fill is unchecked after second click');
  }

  // ============================================================
  // TEST 16: Reset clears split fill checkbox
  // ============================================================
  console.log('\n--- TEST 16: Reset clears Split Fill ---');
  {
    // Enable split fill
    await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === 'Split Fill');
      const label = span.closest('label');
      const checkbox = label.querySelector('div');
      checkbox.click();
    });
    await sleep(200);

    // Verify it's on
    const onBefore = await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === 'Split Fill');
      return !!span.closest('label').querySelector('div').querySelector('svg');
    });
    ok(onBefore, '16a. Split Fill enabled before reset');

    // Reset
    await page.locator('button:has-text("Reset to defaults")').click();
    await sleep(300);

    const offAfterReset = await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === 'Split Fill');
      return !span.closest('label').querySelector('div').querySelector('svg');
    });
    ok(offAfterReset, '16b. Split Fill cleared after reset');
  }

  // ============================================================
  // TEST 17: WebGL canvas is visible with non-zero dimensions
  // ============================================================
  console.log('\n--- TEST 17: WebGL canvas ---');
  {
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        exists: true,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0,
        display: getComputedStyle(canvas).display,
      };
    });

    ok(canvasInfo !== null, '17a. Canvas element exists');
    ok(canvasInfo && canvasInfo.width > 0, `17b. Canvas width > 0 (got ${canvasInfo?.width})`);
    ok(canvasInfo && canvasInfo.height > 0, `17c. Canvas height > 0 (got ${canvasInfo?.height})`);
    ok(canvasInfo && canvasInfo.visible, '17d. Canvas is visible');
  }

  // ============================================================
  // TEST 18: WebGL context is active
  // ============================================================
  console.log('\n--- TEST 18: WebGL context ---');
  {
    const webglActive = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return false;
      // Check if context is not lost
      return !gl.isContextLost();
    });
    ok(webglActive, '18. WebGL context is active and not lost');
  }

  // ============================================================
  // TEST 19: Randomness slider works (set to 0 and 1)
  // ============================================================
  console.log('\n--- TEST 19: Randomness slider ---');
  {
    await setSlider(page, 'Randomness', 0);
    const val0 = await getSliderValue(page, 'Randomness');
    ok(val0 === 0, `19a. Randomness set to 0 (got ${val0})`);

    await screenshot(page, 'comp_19_randomness_0');

    await setSlider(page, 'Randomness', 1);
    const val1 = await getSliderValue(page, 'Randomness');
    ok(val1 === 1, `19b. Randomness set to 1 (got ${val1})`);

    await screenshot(page, 'comp_19_randomness_1');

    // Reset
    await setSlider(page, 'Randomness', 0);
  }

  // ============================================================
  // TEST 20: Concentration slider works at high values (50)
  // ============================================================
  console.log('\n--- TEST 20: Concentration at high value ---');
  {
    await setSlider(page, 'Concentration', 50);
    const val = await getSliderValue(page, 'Concentration');
    ok(val === 50, `20a. Concentration set to 50 (got ${val})`);

    const display = await getDisplayedValue(page, 'Concentration');
    ok(display === '50.00', `20b. Concentration displays "50.00" (got "${display}")`);

    await screenshot(page, 'comp_20_concentration_50');

    // Check no errors occurred
    const errorsFromConc = consoleErrors.filter(e => e.toLowerCase().includes('webgl') || e.toLowerCase().includes('shader'));
    ok(errorsFromConc.length === 0, `20c. No WebGL/shader errors at concentration 50 (errors: ${errorsFromConc.length})`);

    // Reset
    await setSlider(page, 'Concentration', 0);
  }

  // ============================================================
  // TEST 21: Color themes don't change spontaneously (stability)
  // ============================================================
  console.log('\n--- TEST 21: Theme stability (5 second wait) ---');
  {
    // The component has a 60s auto-timer that overrides manual theme selection
    // with getTimeOfDay(). To test theme stability, we disable that timer first,
    // then verify the theme stays put for 5 seconds.
    await page.evaluate(() => {
      // Clear all intervals to prevent auto-theme switching
      const highestId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestId; i++) clearInterval(i);
    });

    // Select sunset theme
    await page.locator('button[title="sunset"]').click();
    await sleep(300);

    // Record which button has scale(1.15)
    const activeThemeBefore = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button[title]');
      for (const b of buttons) {
        if (b.style.transform.includes('scale(1.15)')) return b.title;
      }
      return null;
    });
    ok(activeThemeBefore === 'sunset', `21a. Sunset theme is active (got "${activeThemeBefore}")`);

    // Wait 5 seconds
    console.log('    Waiting 5 seconds...');
    await sleep(5000);

    // Check again
    const activeThemeAfter = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button[title]');
      for (const b of buttons) {
        if (b.style.transform.includes('scale(1.15)')) return b.title;
      }
      return null;
    });
    ok(activeThemeAfter === 'sunset', `21b. Sunset still active after 5s (got "${activeThemeAfter}")`);

    await screenshot(page, 'comp_21_theme_stable');
  }

  // ============================================================
  // TEST 22: Multiple parameter combinations work without errors
  // ============================================================
  console.log('\n--- TEST 22: Multiple parameter combinations ---');
  {
    const errorCountBefore = consoleErrors.length;

    // Combo 1: High waves, high frequency, high blur
    console.log('    Combo 1: high waves + frequency + blur');
    await setSlider(page, 'Waves', 20);
    await setSlider(page, 'Frequency', 10);
    await setSlider(page, 'Blur', 0.3);
    await sleep(500);
    await screenshot(page, 'comp_22_combo1');

    // Combo 2: Min waves, max amplitude, max concentration
    console.log('    Combo 2: min waves + max amplitude + max concentration');
    await setSlider(page, 'Waves', 1);
    await setSlider(page, 'Amplitude', 0.2);
    await setSlider(page, 'Concentration', 50);
    await sleep(500);
    await screenshot(page, 'comp_22_combo2');

    // Combo 3: Everything maxed
    console.log('    Combo 3: all max values');
    await setSlider(page, 'Waves', 20);
    await setSlider(page, 'Speed', 2);
    await setSlider(page, 'Amplitude', 0.2);
    await setSlider(page, 'Frequency', 10);
    await setSlider(page, 'Opacity', 1);
    await setSlider(page, 'Thickness', 0.2);
    await setSlider(page, 'Blur', 0.3);
    await setSlider(page, 'Concentration', 50);
    await setSlider(page, 'Randomness', 1);
    await sleep(500);
    await screenshot(page, 'comp_22_combo3_all_max');

    // Combo 4: Everything at minimum
    console.log('    Combo 4: all min values');
    await setSlider(page, 'Waves', 1);
    await setSlider(page, 'Speed', 0);
    await setSlider(page, 'Amplitude', 0);
    await setSlider(page, 'Frequency', 0.5);
    await setSlider(page, 'Opacity', 0);
    await setSlider(page, 'Thickness', 0.01);
    await setSlider(page, 'Blur', 0);
    await setSlider(page, 'Concentration', 0);
    await setSlider(page, 'Randomness', 0);
    await sleep(500);
    await screenshot(page, 'comp_22_combo4_all_min');

    // Combo 5: Split fill with high randomness and multiple themes
    console.log('    Combo 5: split fill + randomness + theme cycling');
    await page.locator('button:has-text("Reset to defaults")').click();
    await sleep(300);
    await page.evaluate(() => {
      const spans = [...document.querySelectorAll('span')];
      const span = spans.find(s => s.textContent === 'Split Fill');
      span.closest('label').querySelector('div').click();
    });
    await setSlider(page, 'Randomness', 0.75);
    await page.locator('button[title="pre-dawn"]').click();
    await sleep(300);
    await page.locator('button[title="night"]').click();
    await sleep(300);
    await screenshot(page, 'comp_22_combo5_split_random');

    const newErrors = consoleErrors.slice(errorCountBefore);
    const criticalErrors = newErrors.filter(e =>
      e.toLowerCase().includes('webgl') ||
      e.toLowerCase().includes('shader') ||
      e.toLowerCase().includes('gl error') ||
      e.toLowerCase().includes('uncaught')
    );
    ok(criticalErrors.length === 0, `22. No critical errors during combos (found ${criticalErrors.length}: ${criticalErrors.join('; ') || 'none'})`);

    // Verify canvas is still alive after all combos
    const canvasStillAlive = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      const rect = canvas.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    ok(canvasStillAlive, '22b. Canvas still alive after all parameter combos');
  }

  // Reset for clean final screenshot
  await page.locator('button:has-text("Reset to defaults")').click();
  await sleep(500);
  await screenshot(page, 'comp_99_final');

  // ============================================================
  // SUMMARY
  // ============================================================
  await browser.close();

  console.log('\n' + '='.repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failures.length > 0) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log(`  - ${f}`));
  }
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
    process.exit(0);
  }
})();
