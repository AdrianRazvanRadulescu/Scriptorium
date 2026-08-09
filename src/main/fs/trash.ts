import fs from 'node:fs/promises'
import path from 'node:path'
import type { TrashEntry } from '@shared/types'

// IMPORTANT: this file must NEVER call unlink on anything under scenes/.
// It only ever moves entire project directories via fs.rename.

export async function moveToTrash(projectDir: string, libraryRoot: string): Promise<void> {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const trashDir = path.join(libraryRoot, '.trash')
  await fs.mkdir(trashDir, { recursive: true })
  const name = path.basename(projectDir) + '--trashed-' + ts
  await fs.rename(projectDir, path.join(trashDir, name))
}

export async function listTrash(libraryRoot: string): Promise<TrashEntry[]> {
  const trashDir = path.join(libraryRoot, '.trash')

  let entries: string[]
  try {
    entries = await fs.readdir(trashDir)
  } catch {
    return []
  }

  const trashEntries = entries
    .filter(name => name.includes('--trashed-'))
    .map((name): TrashEntry => {
      const match = name.match(/--trashed-(.+)$/)
      const rawTs = match ? match[1] : ''
      // Convert 2026-08-09T14-32-11 → 2026-08-09T14:32:11Z
      const trashedAt = rawTs.replace(/T(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3') + 'Z'
      return { name, trashedAt }
    })

  return trashEntries.sort((a, b) => b.trashedAt.localeCompare(a.trashedAt))
}

export async function restoreFromTrash(libraryRoot: string, name: string): Promise<void> {
  const projectsDir = path.join(libraryRoot, 'projects')
  await fs.mkdir(projectsDir, { recursive: true })
  const originalName = name.replace(/--trashed-.*$/, '')
  await fs.rename(path.join(libraryRoot, '.trash', name), path.join(projectsDir, originalName))
}
