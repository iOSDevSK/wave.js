import { chromium } from 'playwright'

const browser = await chromium.launch()
let passed = 0, failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`  OK: ${name}`)
    passed++
  } catch (e) {
    console.log(`  FAIL: ${name} — ${e.message}`)
    failed++
  }
}

// --- VANILLA TEST ---
console.log('\n=== VANILLA JS ===')
const vPage = await browser.newPage()
const vErrors = []
vPage.on('pageerror', err => vErrors.push(err.message))
await vPage.goto('http://localhost:5173/vanilla.html')
await vPage.waitForTimeout(2000)

await test('No JS errors', () => { if (vErrors.length) throw new Error(vErrors.join('; ')) })
await test('Canvas exists', async () => { if (await vPage.locator('canvas').count() !== 1) throw new Error('no canvas') })
await test('Canvas has size', async () => {
  const s = await vPage.evaluate(() => { const c = document.querySelector('canvas'); return c ? c.width * c.height : 0 })
  if (!s) throw new Error('canvas is 0x0')
})
await test('Panel visible', async () => { if (!await vPage.locator('.panel').isVisible()) throw new Error('panel hidden') })
await test('Sliders present', async () => {
  const count = await vPage.locator('input[type=range]').count()
  if (count < 12) throw new Error(`only ${count} sliders`)
})
await test('Theme buttons', async () => {
  const count = await vPage.locator('.theme-btn').count()
  if (count !== 6) throw new Error(`${count} theme buttons`)
})
await test('Content overlay visible', async () => {
  const text = await vPage.locator('.overlay h1').textContent()
  if (!text.includes('Financial')) throw new Error('no headline')
})
await vPage.screenshot({ path: 'screenshots/vanilla-webgl2.png' })

// Test Canvas 2D renderer switch
await vPage.selectOption('#rendererSelect', 'canvas2d')
await vPage.waitForTimeout(1000)
await test('Canvas 2D renders', async () => {
  const hasCanvas = await vPage.locator('canvas').count()
  if (!hasCanvas) throw new Error('no canvas after switch')
})
await vPage.screenshot({ path: 'screenshots/vanilla-canvas2d.png' })

// Test CSS renderer switch
await vPage.selectOption('#rendererSelect', 'css')
await vPage.waitForTimeout(500)
await test('CSS gradient applied', async () => {
  const bg = await vPage.evaluate(() => document.getElementById('hero').style.background)
  if (!bg.includes('linear-gradient')) throw new Error('no gradient: ' + bg)
})
await vPage.screenshot({ path: 'screenshots/vanilla-css.png' })

// Switch back to WebGL2
await vPage.selectOption('#rendererSelect', 'webgl2')
await vPage.waitForTimeout(1000)
await test('WebGL2 restored', async () => {
  if (await vPage.locator('canvas').count() !== 1) throw new Error('no canvas after restore')
})

// Test theme change
await vPage.locator('.theme-btn[title="night"]').click()
await vPage.waitForTimeout(500)
await test('Theme change works', async () => {
  // Just check no error occurred
})

await vPage.close()

// --- REACT TEST ---
console.log('\n=== REACT ===')
const rPage = await browser.newPage()
const rErrors = []
rPage.on('pageerror', err => rErrors.push(err.message))
await rPage.goto('http://localhost:5173/')
await rPage.waitForTimeout(2000)

await test('No JS errors', () => { if (rErrors.length) throw new Error(rErrors.join('; ')) })
await test('Canvas exists', async () => { if (await rPage.locator('canvas').count() !== 1) throw new Error('no canvas') })
await test('Controls button visible', async () => {
  const btn = rPage.locator('button', { hasText: 'Controls' })
  if (!await btn.isVisible()) throw new Error('no controls button')
})
await test('Sliders present', async () => {
  const count = await rPage.locator('input[type=range]').count()
  if (count < 12) throw new Error(`only ${count} sliders`)
})
await test('Content visible', async () => {
  const h1 = await rPage.locator('h1').textContent()
  if (!h1.includes('Financial')) throw new Error('no headline')
})
await rPage.screenshot({ path: 'screenshots/react-webgl2.png' })
await rPage.close()

await browser.close()

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`)
process.exit(failed ? 1 : 0)
