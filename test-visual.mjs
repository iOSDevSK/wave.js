import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';

const URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'screenshots';
const screenshots = [];

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
  await sleep(600);
}

async function screenshot(page, name) {
  const path = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  screenshots.push(name + '.png');
  console.log(`  -> ${name}.png`);
}

async function resetDefaults(page) {
  const resetBtn = page.locator('button', { hasText: 'Reset to defaults' });
  await resetBtn.click();
  await sleep(600);
}

async function clickTheme(page, index) {
  // Theme buttons are the circular ones with title attribute inside "Color Theme" section
  const themeButtons = page.locator('button[title]');
  await themeButtons.nth(index).click();
  await sleep(1800);
}

async function toggleSplitFill(page) {
  // Click the Split Fill checkbox area
  const splitFillLabel = page.locator('span', { hasText: 'Split Fill' });
  const container = splitFillLabel.locator('..');
  const checkbox = container.locator('div').first();
  await checkbox.click();
  await sleep(600);
}

(async () => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await sleep(2500);

  let counter = 1;
  const pad = (n) => String(n).padStart(2, '0');

  // ========================================
  // 1. DEFAULT STATE
  // ========================================
  console.log('\n=== 1. Default state ===');
  await screenshot(page, `vis_${pad(counter++)}_default`);

  // ========================================
  // 2. EACH SLIDER AT MIN AND MAX
  // ========================================
  console.log('\n=== 2. Slider min/max tests ===');

  // --- Waves: min=1, max=20 ---
  console.log('  Waves');
  await setSlider(page, 'Waves', 1);
  await screenshot(page, `vis_${pad(counter++)}_waves_min`);
  await resetDefaults(page);
  await setSlider(page, 'Waves', 20);
  await screenshot(page, `vis_${pad(counter++)}_waves_max`);
  await resetDefaults(page);

  // --- Speed: min=0, max=2 ---
  console.log('  Speed');
  await setSlider(page, 'Speed', 0);
  await sleep(500);
  await screenshot(page, `vis_${pad(counter++)}_speed_min`);
  await resetDefaults(page);
  await setSlider(page, 'Speed', 2);
  await sleep(500);
  await screenshot(page, `vis_${pad(counter++)}_speed_max`);
  await resetDefaults(page);

  // --- Amplitude: min=0, max=0.2 ---
  console.log('  Amplitude');
  await setSlider(page, 'Amplitude', 0);
  await screenshot(page, `vis_${pad(counter++)}_amplitude_min`);
  await resetDefaults(page);
  await setSlider(page, 'Amplitude', 0.2);
  await screenshot(page, `vis_${pad(counter++)}_amplitude_max`);
  await resetDefaults(page);

  // --- Frequency: min=0.5, max=10 ---
  console.log('  Frequency');
  await setSlider(page, 'Frequency', 0.5);
  await screenshot(page, `vis_${pad(counter++)}_frequency_min`);
  await resetDefaults(page);
  await setSlider(page, 'Frequency', 10);
  await screenshot(page, `vis_${pad(counter++)}_frequency_max`);
  await resetDefaults(page);

  // --- Opacity: min=0, max=1 ---
  console.log('  Opacity');
  await setSlider(page, 'Opacity', 0);
  await screenshot(page, `vis_${pad(counter++)}_opacity_min`);
  await resetDefaults(page);
  await setSlider(page, 'Opacity', 1);
  await screenshot(page, `vis_${pad(counter++)}_opacity_max`);
  await resetDefaults(page);

  // --- Thickness: min=0.01, max=0.2 ---
  console.log('  Thickness');
  await setSlider(page, 'Thickness', 0.01);
  await screenshot(page, `vis_${pad(counter++)}_thickness_min`);
  await resetDefaults(page);
  await setSlider(page, 'Thickness', 0.2);
  await screenshot(page, `vis_${pad(counter++)}_thickness_max`);
  await resetDefaults(page);

  // --- Blur: min=0, max=0.3 ---
  console.log('  Blur');
  await setSlider(page, 'Blur', 0);
  await screenshot(page, `vis_${pad(counter++)}_blur_min`);
  await resetDefaults(page);
  await setSlider(page, 'Blur', 0.3);
  await screenshot(page, `vis_${pad(counter++)}_blur_max`);
  await resetDefaults(page);

  // --- Concentration: 0, 25, 50 ---
  console.log('  Concentration');
  await setSlider(page, 'Concentration', 0);
  await screenshot(page, `vis_${pad(counter++)}_concentration_0`);
  await resetDefaults(page);
  await setSlider(page, 'Concentration', 25);
  await screenshot(page, `vis_${pad(counter++)}_concentration_25`);
  await resetDefaults(page);
  await setSlider(page, 'Concentration', 50);
  await screenshot(page, `vis_${pad(counter++)}_concentration_50`);
  await resetDefaults(page);

  // --- Randomness: 0, 0.5, 1 ---
  console.log('  Randomness');
  await setSlider(page, 'Randomness', 0);
  await screenshot(page, `vis_${pad(counter++)}_randomness_0`);
  await resetDefaults(page);
  await setSlider(page, 'Randomness', 0.5);
  await screenshot(page, `vis_${pad(counter++)}_randomness_05`);
  await resetDefaults(page);
  await setSlider(page, 'Randomness', 1);
  await screenshot(page, `vis_${pad(counter++)}_randomness_1`);
  await resetDefaults(page);

  // ========================================
  // 3. ALL 6 COLOR THEMES
  // ========================================
  console.log('\n=== 3. Color themes ===');
  const themeNames = ['pre-dawn', 'sunrise', 'daytime', 'dusk', 'sunset', 'night'];
  for (let i = 0; i < themeNames.length; i++) {
    console.log(`  Theme: ${themeNames[i]}`);
    await clickTheme(page, i);
    await screenshot(page, `vis_${pad(counter++)}_theme_${themeNames[i]}`);
  }
  // Reset to a known theme
  await clickTheme(page, 0); // pre-dawn
  await resetDefaults(page);

  // ========================================
  // 4. SPLIT FILL ON VS OFF
  // ========================================
  console.log('\n=== 4. Split Fill on vs off ===');
  // Set amplitude 0 and concentration 10 for clarity
  await setSlider(page, 'Amplitude', 0);
  await setSlider(page, 'Concentration', 10);
  await sleep(400);
  await screenshot(page, `vis_${pad(counter++)}_splitfill_off`);

  // Turn on Split Fill
  await toggleSplitFill(page);
  await sleep(400);
  await screenshot(page, `vis_${pad(counter++)}_splitfill_on`);

  // Reset
  await resetDefaults(page);

  // ========================================
  // 5. COLOR PICKER OPEN
  // ========================================
  console.log('\n=== 5. Color picker open ===');
  // Click the first color swatch (the div with border-radius: 6px and cursor: pointer)
  const swatches = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"]');
  await swatches.first().click();
  await sleep(500);
  await screenshot(page, `vis_${pad(counter++)}_color_picker_open`);
  // Close picker by clicking elsewhere
  await page.mouse.click(400, 400);
  await sleep(300);

  // ========================================
  // 6. COMBINED SCENARIOS
  // ========================================
  console.log('\n=== 6. Combined scenarios ===');

  // 6a. High waves + high concentration + high randomness
  console.log('  6a. High waves + high concentration + high randomness');
  await resetDefaults(page);
  await setSlider(page, 'Waves', 20);
  await setSlider(page, 'Concentration', 50);
  await setSlider(page, 'Randomness', 1);
  await sleep(400);
  await screenshot(page, `vis_${pad(counter++)}_combo_highwaves_highconc_highrandom`);

  // 6b. Low waves + high amplitude + low frequency
  console.log('  6b. Low waves + high amplitude + low frequency');
  await resetDefaults(page);
  await setSlider(page, 'Waves', 1);
  await setSlider(page, 'Amplitude', 0.2);
  await setSlider(page, 'Frequency', 0.5);
  await sleep(400);
  await screenshot(page, `vis_${pad(counter++)}_combo_lowwaves_highamp_lowfreq`);

  // 6c. High blur + high thickness + high opacity
  console.log('  6c. High blur + high thickness + high opacity');
  await resetDefaults(page);
  await setSlider(page, 'Blur', 0.3);
  await setSlider(page, 'Thickness', 0.2);
  await setSlider(page, 'Opacity', 1);
  await sleep(400);
  await screenshot(page, `vis_${pad(counter++)}_combo_highblur_highthick_highopacity`);

  // Reset
  await resetDefaults(page);

  // ========================================
  // 7. THEME STABILITY
  // ========================================
  console.log('\n=== 7. Theme stability (sunset) ===');
  // Select sunset theme (index 4)
  await clickTheme(page, 4);
  await screenshot(page, `vis_${pad(counter++)}_theme_sunset_t0`);
  console.log('  Waiting 5 seconds for stability check...');
  await sleep(5000);
  await screenshot(page, `vis_${pad(counter++)}_theme_sunset_t5`);

  // ========================================
  // DONE
  // ========================================
  await browser.close();

  console.log('\n==========================================');
  console.log(`  TOTAL SCREENSHOTS: ${screenshots.length}`);
  console.log('==========================================');
  console.log('\nAll screenshots:');
  screenshots.forEach((s, i) => {
    console.log(`  ${String(i + 1).padStart(2, ' ')}. ${s}`);
  });
  console.log(`\nAll saved to ${SCREENSHOT_DIR}/`);
})();
