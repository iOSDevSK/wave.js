import { chromium } from '@playwright/test';

const URL = 'http://localhost:5173';
const errors = [];
const warnings = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (msg) => {
  const t = msg.type();
  if (t === 'error') errors.push(msg.text());
  if (t === 'warning') warnings.push(msg.text());
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Screenshot: default state
await page.screenshot({ path: 'screenshots/perf-default.png' });

// Probe canvas size vs css size — should reflect pixelRatio=1 (not 2)
const sizes = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  if (!c) return null;
  const r = c.getBoundingClientRect();
  return { canvasW: c.width, canvasH: c.height, cssW: r.width, cssH: r.height, dpr: window.devicePixelRatio };
});
console.log('canvas/css sizes:', sizes);

// Probe FPS by counting RAF ticks over 1s
const fps = await page.evaluate(() => new Promise((resolve) => {
  let count = 0;
  const start = performance.now();
  const tick = () => {
    count++;
    if (performance.now() - start >= 1000) return resolve(count);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}));
console.log('RAF ticks per second (browser):', fps);

// Toggle Glass and Liquid Metal to ensure shader recompile works
await page.evaluate(() => {
  const labels = [...document.querySelectorAll('label span')].filter(s => ['Glass', 'Liquid Metal'].includes(s.textContent));
  labels.forEach(span => {
    const box = span.previousElementSibling;
    if (box) box.click();
  });
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/perf-glass-lm.png' });

// Switch renderer to canvas2d then back
await page.selectOption('select', 'canvas2d');
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/perf-canvas2d.png' });
await page.selectOption('select', 'webgl2');
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/perf-webgl2-back.png' });

console.log('--- errors ---');
errors.forEach(e => console.log(e));
console.log('--- warnings ---');
warnings.forEach(w => console.log(w));

await browser.close();
if (errors.length) { console.log('FAILED:', errors.length, 'errors'); process.exit(1); }
console.log('OK');
