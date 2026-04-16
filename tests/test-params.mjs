import { chromium } from '@playwright/test';

const URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'screenshots';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function setSlider(page, label, value) {
  await page.evaluate(({ label, value }) => {
    const spans = [...document.querySelectorAll('span')];
    const span = spans.find(s => s.textContent === label);
    if (!span) throw new Error(`Slider "${label}" not found`);
    const input = span.closest('label').querySelector('input[type="range"]');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { label, value });
  await sleep(800);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: false });
  console.log(`  -> ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL);
  await sleep(2000);

  // 1. Default state
  console.log('1. Default state');
  await screenshot(page, '01_default');

  // 2. Test wave count
  console.log('2. Waves');
  await setSlider(page, 'Waves', 3);
  await screenshot(page, '02_waves_3');
  await setSlider(page, 'Waves', 15);
  await screenshot(page, '03_waves_15');
  await setSlider(page, 'Waves', 8);

  // 3. Test speed
  console.log('3. Speed');
  await setSlider(page, 'Speed', 1.5);
  await sleep(1000);
  await screenshot(page, '04_speed_high');
  await setSlider(page, 'Speed', 0.3);

  // 4. Test amplitude
  console.log('4. Amplitude');
  await setSlider(page, 'Amplitude', 0.18);
  await screenshot(page, '05_amplitude_high');
  await setSlider(page, 'Amplitude', 0.01);
  await screenshot(page, '06_amplitude_low');
  await setSlider(page, 'Amplitude', 0.06);

  // 5. Test frequency
  console.log('5. Frequency');
  await setSlider(page, 'Frequency', 9);
  await screenshot(page, '07_frequency_high');
  await setSlider(page, 'Frequency', 1);
  await screenshot(page, '08_frequency_low');
  await setSlider(page, 'Frequency', 2.5);

  // 6. Test opacity
  console.log('6. Opacity');
  await setSlider(page, 'Opacity', 1);
  await screenshot(page, '09_opacity_full');
  await setSlider(page, 'Opacity', 0.15);
  await screenshot(page, '10_opacity_low');
  await setSlider(page, 'Opacity', 0.6);

  // 7. Test thickness
  console.log('7. Thickness');
  await setSlider(page, 'Thickness', 0.18);
  await screenshot(page, '11_thickness_high');
  await setSlider(page, 'Thickness', 0.02);
  await screenshot(page, '12_thickness_low');
  await setSlider(page, 'Thickness', 0.06);

  // 8. Test blur
  console.log('8. Blur');
  await setSlider(page, 'Blur', 0.25);
  await screenshot(page, '13_blur_high');
  await setSlider(page, 'Blur', 0);
  await screenshot(page, '14_blur_none');
  await setSlider(page, 'Blur', 0.03);

  // 9. Test concentration
  console.log('9. Concentration');
  await setSlider(page, 'Concentration', 3);
  await screenshot(page, '15_concentration_3');
  await setSlider(page, 'Concentration', 7);
  await screenshot(page, '16_concentration_7');
  await setSlider(page, 'Concentration', 10);
  await screenshot(page, '17_concentration_max');
  await setSlider(page, 'Concentration', 0);

  // 10. Test color themes
  console.log('10. Color themes');
  const themes = ['pre-dawn', 'sunrise', 'daytime', 'dusk', 'sunset', 'night'];
  const themeButtons = page.locator('button[title]');
  for (let i = 0; i < themes.length; i++) {
    await themeButtons.nth(i).click();
    await sleep(1800);
    await screenshot(page, `18_theme_${themes[i]}`);
  }

  // 11. Test custom color picker
  console.log('11. Custom color picker');
  const firstSwatch = page.locator('div[style*="border-radius: 6px"][style*="cursor: pointer"]').first();
  await firstSwatch.click();
  await sleep(500);
  await screenshot(page, '19_color_picker_open');
  await page.mouse.click(400, 400);
  await sleep(300);

  // 12. Combined params - extreme settings
  console.log('12. Combined extreme');
  await setSlider(page, 'Waves', 20);
  await setSlider(page, 'Amplitude', 0.15);
  await setSlider(page, 'Frequency', 8);
  await setSlider(page, 'Concentration', 5);
  await screenshot(page, '20_combined_extreme');

  await browser.close();
  console.log('\nDone! All screenshots saved to screenshots/');
})();
