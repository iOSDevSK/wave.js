import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('pageerror', err => errors.push(err.message))
await page.goto('http://localhost:5173/vanilla.html')
await page.waitForTimeout(2000)

let passed = 0, failed = 0
async function test(name, fn) {
  try { await fn(); console.log(`  OK: ${name}`); passed++ }
  catch (e) { console.log(`  FAIL: ${name} — ${e.message}`); failed++ }
}

// Test 'none' mode
await page.selectOption('#rendererSelect', 'none')
await page.waitForTimeout(500)
await test('None mode — no canvas', async () => {
  const count = await page.locator('canvas').count()
  if (count > 0) throw new Error('canvas still exists')
})
await test('None mode — solid background', async () => {
  const bg = await page.evaluate(() => document.getElementById('hero').style.background)
  if (!bg.startsWith('#') && !bg.startsWith('rgb')) throw new Error('no solid bg: ' + bg)
})
await page.screenshot({ path: 'screenshots/renderer-none.png' })

// Test CSS mode
await page.selectOption('#rendererSelect', 'css')
await page.waitForTimeout(500)
await test('CSS mode — gradient', async () => {
  const bg = await page.evaluate(() => document.getElementById('hero').style.background)
  if (!bg.includes('linear-gradient')) throw new Error('no gradient: ' + bg)
})
await page.screenshot({ path: 'screenshots/renderer-css.png' })

// Test Canvas 2D mode
await page.selectOption('#rendererSelect', 'canvas2d')
await page.waitForTimeout(1000)
await test('Canvas2D mode — canvas exists', async () => {
  if (await page.locator('canvas').count() !== 1) throw new Error('no canvas')
})
await page.screenshot({ path: 'screenshots/renderer-canvas2d.png' })

// Test WebGL2 mode
await page.selectOption('#rendererSelect', 'webgl2')
await page.waitForTimeout(1000)
await test('WebGL2 mode — canvas exists', async () => {
  if (await page.locator('canvas').count() !== 1) throw new Error('no canvas')
})
await page.screenshot({ path: 'screenshots/renderer-webgl2.png' })

// Theme change in none mode
await page.selectOption('#rendererSelect', 'none')
await page.waitForTimeout(300)
await page.locator('.theme-btn[title="sunset"]').click()
await page.waitForTimeout(300)
await test('None mode — theme change updates bg', async () => {
  const bg = await page.evaluate(() => document.getElementById('hero').style.background)
  if (!bg) throw new Error('no bg after theme change')
})

await test('No JS errors', () => { if (errors.length) throw new Error(errors.join('; ')) })

await browser.close()
console.log(`\n=== ${passed} passed, ${failed} failed ===`)
process.exit(failed ? 1 : 0)
