import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { writeFileAtomic } from '../../src/main/fs/atomic-write'
import { writeScene, readScene } from '../../src/main/fs/scene-file'
import { countWords } from '../../src/main/fs/word-count'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scriptorium-test-'))
  await fs.mkdir(path.join(tmpDir, 'scenes'), { recursive: true })
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('atomic write', () => {
  it('writes correct content', async () => {
    const target = path.join(tmpDir, 'test.txt')
    await writeFileAtomic(target, 'hello world')
    const content = await fs.readFile(target, 'utf-8')
    expect(content).toBe('hello world')
  })

  it('preserves original on rename failure', async () => {
    const target = path.join(tmpDir, 'original.txt')
    await writeFileAtomic(target, 'original content')

    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('rename failed'))

    await expect(writeFileAtomic(target, 'new content')).rejects.toThrow()

    // Original file must still be intact
    const content = await fs.readFile(target, 'utf-8')
    expect(content).toBe('original content')

    vi.restoreAllMocks()
  })

  it('leaves no temp files on failure', async () => {
    const target = path.join(tmpDir, 'nofail.txt')
    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('fail'))

    try { await writeFileAtomic(target, 'content') } catch { /* expected */ }

    const files = await fs.readdir(tmpDir)
    const tmpFiles = files.filter(f => f.includes('.tmp.'))
    expect(tmpFiles.length).toBe(0)

    vi.restoreAllMocks()
  })
})

describe('scene file safety', () => {
  it('writes and reads scene content', async () => {
    await writeScene(tmpDir, 'scenes/test.md', 'prose content here')
    const content = await readScene(tmpDir, 'scenes/test.md')
    expect(content).toBe('prose content here')
  })

  it('never writes inline to the target path', async () => {
    // The implementation uses fs.open + fd.writeFile, so we spy on fs.open
    // to verify that every open call uses a .tmp. path and never the direct target.
    const openedPaths: string[] = []
    const originalOpen = fs.open.bind(fs)
    vi.spyOn(fs, 'open').mockImplementation(async (p: unknown, ...rest) => {
      openedPaths.push(String(p))
      return originalOpen(p as Parameters<typeof fs.open>[0], ...rest as Parameters<typeof fs.open>[1][])
    })

    await writeScene(tmpDir, 'scenes/test.md', 'content')

    const scenePath = path.join(tmpDir, 'scenes', 'test.md')
    const directWrite = openedPaths.find(c => c === scenePath)
    expect(directWrite).toBeUndefined() // must not open the target path directly

    const tempWrite = openedPaths.find(c => c.includes('.tmp.'))
    expect(tempWrite).toBeDefined() // must open a .tmp. intermediate path

    vi.restoreAllMocks()
  })
})

describe('static: no unlink on scenes/', () => {
  it('trash.ts does not call unlink on scene files', async () => {
    const trashSource = await fs.readFile(
      path.join(process.cwd(), 'src', 'main', 'fs', 'trash.ts'),
      'utf-8',
    )
    // Any unlink call in trash.ts must NOT reference scenes/ paths.
    // The only unlink should be on zip files (backup pruning).
    // Skip comment lines — they may explain what NOT to do.
    const unlinkLines = trashSource
      .split('\n')
      .filter(line => !line.trim().startsWith('//') && line.includes('unlink'))
    for (const line of unlinkLines) {
      expect(line).not.toMatch(/scenes\//)
    }
  })
})

describe('word count performance', () => {
  it('counts 6000-word document in under 50ms', () => {
    const words = Array.from({ length: 6000 }, (_, i) => `word${i}`)
    const text = words.join(' ')

    const start = performance.now()
    const count = countWords(text)
    const elapsed = performance.now() - start

    expect(count).toBe(6000)
    expect(elapsed).toBeLessThan(50)
  })
})
