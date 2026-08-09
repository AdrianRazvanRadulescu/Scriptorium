import { app } from 'electron'
import { writeFileAtomic } from './fs/atomic-write'
import fs from 'node:fs/promises'
import path from 'node:path'

function journalDir(): string {
  return path.join(app.getPath('userData'), 'crash-journals')
}

function journalPath(nodeId: string): string {
  return path.join(journalDir(), nodeId + '.txt')
}

export async function writeCrashJournal(nodeId: string, content: string): Promise<void> {
  await fs.mkdir(journalDir(), { recursive: true })
  await writeFileAtomic(journalPath(nodeId), content)
}

export async function readCrashJournal(nodeId: string): Promise<string | null> {
  try {
    return await fs.readFile(journalPath(nodeId), 'utf-8')
  } catch {
    return null
  }
}

export async function clearCrashJournal(nodeId: string): Promise<void> {
  try {
    await fs.unlink(journalPath(nodeId))
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
  }
}
