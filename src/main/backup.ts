import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const BACKUP_MARKER_FILE = '.scriptorium-last-backup'
const BACKUP_NAME_PREFIX = 'scriptorium-backup-'
const BACKUPS_TO_KEEP = 14
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export async function shouldRunBackup(backupRoot: string): Promise<boolean> {
  const marker = path.join(backupRoot, BACKUP_MARKER_FILE)
  try {
    const raw = await fs.readFile(marker, 'utf-8')
    const lastBackupAt = new Date(raw.trim()).getTime()
    return Date.now() - lastBackupAt > TWENTY_FOUR_HOURS_MS
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return true
    }
    throw err
  }
}

export async function runBackup(libraryRoot: string, backupRoot: string): Promise<void> {
  await fs.mkdir(backupRoot, { recursive: true })

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const dest = path.join(backupRoot, `${BACKUP_NAME_PREFIX}${ts}.zip`)

  // Compress-Archive requires a single -Command string; separate args don't work for cmdlets.
  await execFileAsync('powershell.exe', [
    '-NonInteractive',
    '-Command',
    `Compress-Archive -Path '${libraryRoot}\\*' -DestinationPath '${dest}'`,
  ])

  await fs.writeFile(path.join(backupRoot, BACKUP_MARKER_FILE), new Date().toISOString())

  await pruneOldBackups(backupRoot)
}

export async function pruneOldBackups(backupRoot: string): Promise<void> {
  const entries = await fs.readdir(backupRoot)

  const backupZips = entries
    .filter(name => name.startsWith(BACKUP_NAME_PREFIX) && name.endsWith('.zip'))
    .sort() // lexicographic sort matches chronological order given our timestamp format

  const deleteCount = Math.max(0, backupZips.length - BACKUPS_TO_KEEP)
  const filesToDelete = backupZips.slice(0, deleteCount)

  for (const filename of filesToDelete) {
    await fs.unlink(path.join(backupRoot, filename))
  }
}
