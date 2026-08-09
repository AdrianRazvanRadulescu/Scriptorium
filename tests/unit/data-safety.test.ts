import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { writeFileAtomic } from '../../src/main/fs/atomic-write'
import { writeScene } from '../../src/main/fs/scene-file'
import { countWords } from '../../src/main/fs/word-count'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'focus-writing-test-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('writeFileAtomic', () => {
  it('writes the expected content to disk', async () => {
    const target = path.join(tmpDir, 'out.txt')
    await writeFileAtomic(target, 'hello atomic')
    const content = await fs.readFile(target, 'utf-8')
    expect(content).toBe('hello atomic')
  })

  it('leaves original intact and removes temp files when rename fails', async () => {
    const target = path.join(tmpDir, 'original.txt')
    await fs.writeFile(target, 'original content', 'utf-8')

    const renameSpy = vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('rename failed'))

    await expect(writeFileAtomic(target, 'new content')).rejects.toThrow('rename failed')

    // Original file must be intact
    const preserved = await fs.readFile(target, 'utf-8')
    expect(preserved).toBe('original content')

    // No .tmp. files should remain after the failed write
    const remaining = await fs.readdir(tmpDir)
    const tempFiles = remaining.filter((name) => name.includes('.tmp.'))
    expect(tempFiles).toHaveLength(0)

    renameSpy.mockRestore()
  })
})

describe('writeScene', () => {
  it('never writes directly to the target path — always uses a .tmp. intermediate', async () => {
    await fs.mkdir(path.join(tmpDir, 'scenes'), { recursive: true })

    const sceneFile = 'scenes/test-scene.md'
    const targetAbsolute = path.join(tmpDir, sceneFile)

    const openSpy = vi.spyOn(fs, 'open')

    await writeScene(tmpDir, sceneFile, 'scene content')

    // Every fs.open call must use a .tmp. path, never the direct target path
    for (const call of openSpy.mock.calls) {
      const openedPath = String(call[0])
      expect(openedPath).toContain('.tmp.')
      expect(openedPath).not.toBe(targetAbsolute)
    }

    openSpy.mockRestore()
  })
})

describe('trash.ts static safety check', () => {
  it('contains no unlink calls that reference scenes/', async () => {
    const trashSrc = await fs.readFile(
      path.join(process.cwd(), 'src/main/fs/trash.ts'),
      'utf-8',
    )
    // Check that no executable code line calls unlink on a scenes/ path.
    // Skip comment lines — they may explain what NOT to do.
    const unlinkLines = trashSrc
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && line.includes('unlink'))
    for (const line of unlinkLines) {
      expect(line).not.toContain('scenes/')
    }
  })
})

describe('countWords performance', () => {
  it('counts a 6000-word string in under 50ms', () => {
    const words = Array.from({ length: 6000 }, (_, i) => `word${i}`)
    const text = words.join(' ')

    const start = performance.now()
    const count = countWords(text)
    const elapsed = performance.now() - start

    expect(count).toBe(6000)
    expect(elapsed).toBeLessThan(50)
  })
})
