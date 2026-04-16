import { chromium } from '@playwright/test';

const URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'screenshots';
let passed = 0, failed = 0;

function assert(condition, name) {
  if (condition) { console.log(`  \u2713 ${name}`); passed++; }
  else { console.log(`  \u2717 ${name}`); failed++; }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function screenshot(page, name) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png` });
  console.log(`    -> ${name}.png`);
}

// Get current picker state via evaluate
async function getPickerState(page) {
  return page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type="number"]')];
    if (inputs.length < 4) return null;
    const r = parseInt(inputs[0].value);
    const g = parseInt(inputs[1].value);
    const b = parseInt(inputs[2].value);
    const a = parseInt(inputs[3].value);
    // Find alpha bar by checkerboard (unique to alpha)
    const checkerboard = document.querySelector('div[style*="repeating-conic-gradient"]');
    const alphaBar = checkerboard?.parentElement;
    const alphaGradient = alphaBar?.style.background || '';
    // Find hue bar thumb color
    const hueBarThumb = [...document.querySelectorAll('div[style*="border: 2px solid white"]')]
      .find(el => el.parentElement?.style.background?.includes('rgb(255, 0, 0)'));
    const hueThumbBg = hueBarThumb?.style.background || '';
    return { r, g, b, a, alphaGradient, hueThumbBg };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL);
  await sleep(2000);

  const swatches = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"]');

  // =============================================
  console.log('\n--- 1. Open picker and verify elements ---');
  // =============================================
  await swatches.nth(1).click();
  await sleep(400);
  const state1 = await getPickerState(page);
  assert(state1 !== null, 'Picker opened with RGBA inputs');
  assert(state1.r >= 0 && state1.r <= 255, `R valid: ${state1.r}`);
  assert(state1.g >= 0 && state1.g <= 255, `G valid: ${state1.g}`);
  assert(state1.b >= 0 && state1.b <= 255, `B valid: ${state1.b}`);
  assert(state1.alphaGradient.length > 0, 'Alpha bar has gradient');
  await screenshot(page, 'ps_01_initial');

  // =============================================
  console.log('\n--- 2. Change R input - alpha bar should update ---');
  // =============================================
  const rInput = page.locator('div:has(> div:text-is("R")) input[type="number"]');
  await rInput.fill('255');
  await rInput.dispatchEvent('change');
  await sleep(300);
  const state2 = await getPickerState(page);
  assert(state2.r === 255, `R set to 255 (got ${state2.r})`);
  // Alpha gradient should contain the new color with R=255
  const hex2 = '#' + [state2.r, state2.g, state2.b].map(v => v.toString(16).padStart(2, '0')).join('');
  assert(state2.alphaGradient.includes(hex2) || state2.alphaGradient.includes(`${state2.r}`),
    `Alpha bar reflects R=255 change`);
  await screenshot(page, 'ps_02_r255');

  // =============================================
  console.log('\n--- 3. Click hue bar at different positions ---');
  // =============================================
  const hueBar = page.locator('div[style*="linear-gradient(to right, rgb(255, 0, 0)"]').first();
  const hueBox = await hueBar.boundingBox();

  // Click at 0% (red)
  await page.mouse.click(hueBox.x + 5, hueBox.y + hueBox.height / 2);
  await sleep(300);
  const stateRed = await getPickerState(page);
  assert(stateRed.r > stateRed.g && stateRed.r > stateRed.b, `Red hue: R=${stateRed.r} > G=${stateRed.g}, B=${stateRed.b}`);
  await screenshot(page, 'ps_03_hue_red');

  // Click at 50% (cyan)
  await page.mouse.click(hueBox.x + hueBox.width * 0.5, hueBox.y + hueBox.height / 2);
  await sleep(300);
  const stateCyan = await getPickerState(page);
  assert(stateCyan.g > 100 || stateCyan.b > 100, `Cyan area: G=${stateCyan.g}, B=${stateCyan.b}`);
  await screenshot(page, 'ps_04_hue_cyan');

  // Click at 83% (magenta)
  await page.mouse.click(hueBox.x + hueBox.width * 0.83, hueBox.y + hueBox.height / 2);
  await sleep(300);
  const stateMag = await getPickerState(page);
  assert(stateMag.r > 100 || stateMag.b > 100, `Magenta area: R=${stateMag.r}, B=${stateMag.b}`);
  await screenshot(page, 'ps_05_hue_magenta');

  // =============================================
  console.log('\n--- 4. Click SV area corners ---');
  // =============================================
  const svArea = page.locator('div[style*="cursor: crosshair"]');
  const svBox = await svArea.boundingBox();

  // Top-right: high sat, high brightness = vivid color
  await page.mouse.click(svBox.x + svBox.width - 5, svBox.y + 5);
  await sleep(300);
  const stateBright = await getPickerState(page);
  const maxBright = Math.max(stateBright.r, stateBright.g, stateBright.b);
  assert(maxBright > 150, `Bright corner: max channel = ${maxBright}`);
  await screenshot(page, 'ps_06_sv_bright');

  // Bottom-left: low sat, low brightness = near black
  await page.mouse.click(svBox.x + 5, svBox.y + svBox.height - 5);
  await sleep(300);
  const stateDark = await getPickerState(page);
  assert(stateDark.r < 80 && stateDark.g < 80 && stateDark.b < 80,
    `Dark corner: R=${stateDark.r}, G=${stateDark.g}, B=${stateDark.b}`);
  await screenshot(page, 'ps_07_sv_dark');

  // Top-left: low sat, high brightness = white-ish
  await page.mouse.click(svBox.x + 5, svBox.y + 5);
  await sleep(300);
  const stateWhite = await getPickerState(page);
  assert(stateWhite.r > 180 && stateWhite.g > 180 && stateWhite.b > 180,
    `White corner: R=${stateWhite.r}, G=${stateWhite.g}, B=${stateWhite.b}`);
  await screenshot(page, 'ps_08_sv_white');

  // =============================================
  console.log('\n--- 5. Alpha bar and RGB consistency after each change ---');
  // =============================================
  // Set a known color via inputs
  await rInput.fill('100');
  await rInput.dispatchEvent('change');
  await sleep(100);
  const gInput = page.locator('div:has(> div:text-is("G")) input[type="number"]');
  await gInput.fill('200');
  await gInput.dispatchEvent('change');
  await sleep(100);
  const bInput = page.locator('div:has(> div:text-is("B")) input[type="number"]');
  await bInput.fill('50');
  await bInput.dispatchEvent('change');
  await sleep(300);

  const state5 = await getPickerState(page);
  assert(state5.r === 100 && state5.g === 200 && state5.b === 50,
    `Set RGB(100,200,50): got (${state5.r},${state5.g},${state5.b})`);
  // Alpha gradient should reflect this yellowish-green
  assert(state5.alphaGradient.includes('100') || state5.alphaGradient.includes('64'),
    'Alpha bar reflects set color');
  await screenshot(page, 'ps_09_rgb_set');

  // =============================================
  console.log('\n--- 6. All 4 swatches open correctly ---');
  // =============================================
  await page.mouse.click(100, 100);
  await sleep(300);

  for (let i = 0; i < 4; i++) {
    await swatches.nth(i).click();
    await sleep(400);
    const state = await getPickerState(page);
    assert(state !== null, `Swatch ${i} picker opens`);
    assert(state.r >= 0 && state.g >= 0 && state.b >= 0,
      `Swatch ${i}: RGB valid (${state.r},${state.g},${state.b})`);
    await screenshot(page, `ps_10_swatch${i}`);
    await page.mouse.click(100, 100);
    await sleep(300);
  }

  // =============================================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
