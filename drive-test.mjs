// Comprehensive Scriptorium UI test driver.
// Run: node drive-test.mjs
// Saves screenshots to scratchpad directory.

import { _electron as electron } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const SHOT_DIR = String.raw`C:\Users\adria\AppData\Local\Temp\claude\C--Users-adria-Desktop-Focus-Writing\b3edea27-31a6-4a51-a87c-2fe8cfa59e18\scratchpad`
const ELECTRON_BIN = path.join(__dir, 'node_modules/electron/dist/electron.exe')

let shots = 0
async function shot(page, label) {
  shots++
  const name = `${String(shots).padStart(2, '0')}-${label}.png`
  const p = path.join(SHOT_DIR, name)
  try {
    await page.screenshot({ path: p, fullPage: false, timeout: 8000 })
    console.log(`📸 ${name}`)
  } catch {
    console.log(`📸 ${name} (skipped — screenshot timeout)`)
  }
  return p
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function clickText(page, text) {
  const result = await page.evaluate(t => {
    const els = [...document.querySelectorAll('button, a, [role="button"]')]
    const el = els.find(e => e.textContent?.trim() === t)
           ?? els.find(e => e.textContent?.includes(t))
    if (!el) return 'NOT_FOUND'
    el.click()
    return 'OK: ' + el.tagName + ' "' + el.textContent?.trim().slice(0, 40) + '"'
  }, text)
  console.log(`  click-text "${text}" → ${result}`)
  return result !== 'NOT_FOUND'
}

async function pageText(page) {
  return page.evaluate(() => document.body.innerText?.slice(0, 600))
}

console.log('🚀 Launching Scriptorium...')

const app = await electron.launch({
  executablePath: ELECTRON_BIN,
  args: [__dir],
  timeout: 25_000,
})

await wait(5000)

const allWindows = app.windows()
console.log(`   ${allWindows.length} window(s)`)
const page = allWindows.find(w => !w.url().includes('devtools')) ?? await app.firstWindow()
console.log(`   URL: ${page.url()}`)

// Wait for any async initialization (auto-reopen last project) to settle
await page.waitForLoadState('domcontentloaded')
await wait(1500)

// Collect console messages for error detection
const consoleMessages = []
page.on('console', msg => {
  if (msg.type() === 'error') consoleMessages.push(msg.text())
})

// ── 1. Initial state ─────────────────────────────────────────────────────────
await shot(page, 'initial-state')
const bodyText = await pageText(page)
console.log('\n📋 Page text:\n' + bodyText.slice(0, 300))

const reactError = await page.evaluate(() => {
  const t = document.body.innerText ?? ''
  return {
    hasMaxDepth: t.includes('Maximum update depth'),
    hasTooMany: t.includes('Too many re-renders'),
    hasMinifiedError185: t.includes('#185'),
  }
})
console.log('React error check:', reactError)
if (Object.values(reactError).some(Boolean)) {
  console.error('❌ React #185 error on load!')
  process.exitCode = 1
} else {
  console.log('✅ No React #185 on initial load')
}

// ── 2. Create a project ───────────────────────────────────────────────────────
console.log('\n📁 Creating project...')
const clickedNew = await clickText(page, 'New project')
if (clickedNew) {
  await wait(400)
  await page.keyboard.type('Test Novel 2025', { delay: 30 })
  await wait(200)
  await shot(page, 'new-project-typed')
  await page.keyboard.press('Enter')
  await wait(2500)
  await shot(page, 'project-opened')
  console.log('After creation:', (await pageText(page)).slice(0, 250))
} else {
  console.log('  Could not find "New project" button — checking state:')
  console.log('  ', (await pageText(page)).slice(0, 200))
}

// ── 3. Add a scene ────────────────────────────────────────────────────────────
console.log('\n📝 Adding scene via binder...')
await clickText(page, '+ Scene')
await wait(1500)
await shot(page, 'scene-added')

// ── 4. Click into the scene ───────────────────────────────────────────────────
console.log('\n✏️  Selecting scene...')
const sceneSel = await page.evaluate(() => {
  // The binder renders scene nodes as div rows
  const spans = [...document.querySelectorAll('span')]
  const s = spans.find(el =>
    el.textContent?.trim() === 'Untitled Scene' ||
    (el.textContent?.includes('Untitled') && el.closest('div[draggable]'))
  )
  if (s) { s.click(); return 'clicked: ' + s.textContent?.trim() }
  // Fallback: click first draggable node row
  const draggable = document.querySelector('div[draggable]')
  if (draggable) { draggable.click(); return 'clicked draggable row' }
  return 'NOT_FOUND'
})
console.log('  scene click →', sceneSel)
await wait(1500)
await shot(page, 'editor-open')

// ── 5. Type in the editor ─────────────────────────────────────────────────────
console.log('\n⌨️  Typing text...')
const cm = await page.evaluate(() => {
  const el = document.querySelector('.cm-content')
  if (el) { el.focus(); el.click(); return 'CodeMirror found' }
  return 'NOT_FOUND'
})
console.log('  CodeMirror:', cm)
await wait(300)
await page.keyboard.type('Chapter One\n\nIt was a dark and stormy night. ', { delay: 15 })
await wait(300)
await page.keyboard.type('The rain fell hard on the cobblestones. ', { delay: 15 })
await wait(300)
await page.keyboard.type('She pulled her coat tighter and kept walking. ', { delay: 15 })
await wait(800)
await shot(page, 'editor-with-text')

// Check no render loop after typing
const afterTyping = await page.evaluate(() => {
  const t = document.body.innerText ?? ''
  return {
    hasMaxDepth: t.includes('Maximum update depth'),
    hasTooMany: t.includes('Too many re-renders'),
    wordCount: t.match(/(\d[\d,]*)\s+words/)?.[1] ?? 'not visible',
    saveStatus: [...document.querySelectorAll('span')].find(s =>
      ['Saved','Saving','Unsaved','Error'].some(x => s.textContent?.includes(x)))?.textContent?.trim() ?? 'not visible',
  }
})
console.log('\n📊 After typing:', JSON.stringify(afterTyping, null, 2))
if (afterTyping.hasMaxDepth || afterTyping.hasTooMany) {
  console.error('❌ React #185 appeared while typing!')
  process.exitCode = 1
} else {
  console.log('✅ No render loop while typing')
}

// ── 6. Wait for autosave ──────────────────────────────────────────────────────
console.log('\n💾 Waiting for autosave (1.5s)...')
await wait(1500)
await shot(page, 'after-autosave')

// ── 7. Simulate node edits that used to trigger the loop ─────────────────────
// Go back to root/binder and rename the scene (to simulate updateProjectNodes)
console.log('\n🔁 Testing node edit (previously triggered the loop)...')
const renameStart = await page.evaluate(() => {
  const draggable = document.querySelector('div[draggable]')
  if (draggable) {
    // Double click to start rename
    draggable.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    return 'dblclick sent'
  }
  return 'NOT_FOUND'
})
console.log('  rename start:', renameStart)
await wait(400)
// Type new name and commit
await page.keyboard.type('Chapter One - Draft')
await page.keyboard.press('Enter')
await wait(1000)
await shot(page, 'scene-renamed')

// Check no loop after rename
const afterRename = await page.evaluate(() => {
  const t = document.body.innerText ?? ''
  return {
    hasError: t.includes('Maximum update depth') || t.includes('Too many re-renders'),
    visibleText: t.slice(0, 150),
  }
})
console.log('After rename:', JSON.stringify(afterRename, null, 2))
if (afterRename.hasError) {
  console.error('❌ React error after rename!')
  process.exitCode = 1
} else {
  console.log('✅ No render loop after node rename')
}

// ── 8. Folder/Corkboard view ─────────────────────────────────────────────────
console.log('\n🗂️  Corkboard view...')
await page.evaluate(() => {
  // Click the project root in the binder header
  const header = document.querySelector('aside span[title]')
  if (header) header.click()
  // Or find a Corkboard button
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Corkboard'))
  if (btn) btn.click()
})
await wait(600)
await shot(page, 'corkboard-view')

// Click Corkboard button in toolbar
await clickText(page, 'Corkboard')
await wait(500)
await shot(page, 'corkboard-selected')

// ── 9. Outline view ───────────────────────────────────────────────────────────
console.log('\n📋 Outline view...')
await clickText(page, 'Outline')
await wait(600)
await shot(page, 'outline-view')

// ── 10. Search panel ──────────────────────────────────────────────────────────
console.log('\n🔍 Search panel...')
await clickText(page, 'Search')
await wait(500)
await shot(page, 'search-panel')
await clickText(page, 'Search')
await wait(300)

// ── 11. Snapshots panel ───────────────────────────────────────────────────────
console.log('\n📷 Snapshots panel...')
await clickText(page, 'Snapshots')
await wait(500)
await shot(page, 'snapshots-panel')
await clickText(page, 'Snapshots')
await wait(300)

// ── 12. Binder toggle ─────────────────────────────────────────────────────────
console.log('\n📂 Binder toggle...')
await clickText(page, 'Binder')
await wait(400)
await shot(page, 'binder-hidden')
await clickText(page, 'Binder')
await wait(400)

// ── Final state ───────────────────────────────────────────────────────────────
await shot(page, 'final-state')

const finalErrors = consoleMessages.filter(m =>
  m.toLowerCase().includes('error') || m.includes('#185') || m.includes('update depth')
)

console.log('\n' + '═'.repeat(60))
console.log(`📸 ${shots} screenshots saved to: ${SHOT_DIR}`)
if (finalErrors.length) {
  console.error(`❌ Console errors (${finalErrors.length}):`)
  finalErrors.forEach(e => console.error('  ', e.slice(0, 120)))
  process.exitCode = 1
} else {
  console.log('✅ No console errors')
}

const finalReactCheck = await page.evaluate(() => {
  const t = document.body.innerText ?? ''
  return t.includes('Maximum update depth') || t.includes('Too many re-renders') || t.includes('#185')
})
if (finalReactCheck) {
  console.error('❌ FINAL CHECK FAIL: React error still in DOM')
  process.exitCode = 1
} else {
  console.log('✅ FINAL CHECK PASS: No React errors in DOM')
}

await wait(300)
await app.close()
console.log('✅ App closed cleanly.')
process.exit(process.exitCode ?? 0)
