import { chromium } from '@playwright/test';

const URL = 'http://localhost:5173';
const errors = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return c ? { w: c.width, h: c.height, dpr: window.devicePixelRatio } : null;
});
console.log('canvas:', info);

await page.screenshot({ path: 'screenshots/website-default.png' });

console.log('errors:', errors);
await browser.close();
if (errors.length) process.exit(1);
console.log('OK');
