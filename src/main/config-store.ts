import { app } from 'electron'
import { writeFileAtomic } from './fs/atomic-write'
import type { AppConfig } from '@shared/types'
import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_CONFIG: AppConfig = {
  libraryRoot: 'D:\\Scriptorium',
  backupRoot: 'C:\\Scriptorium-Backups',
  theme: 'nocturne',
  font: 'literata',
  fontSize: 18,
  lineHeight: 1.7,
  measure: 65,
  smartTypography: true,
  focusMode: false,
  typewriterScrolling: true,
  lastOpenProjectId: null,
}

function configPath(): string {
  return path.join(app.getPath('userData'), 'config.json')
}

export async function readConfig(): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(configPath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    // Spread ensures keys added in future versions get their defaults automatically.
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...DEFAULT_CONFIG }
    }
    throw err
  }
}

export async function writeConfig(config: AppConfig): Promise<void> {
  await fs.mkdir(path.dirname(configPath()), { recursive: true })
  await writeFileAtomic(configPath(), JSON.stringify(config, null, 2))
}

export async function patchConfig(patch: Partial<AppConfig>): Promise<AppConfig> {
  const current = await readConfig()
  const merged = { ...current, ...patch }
  await writeConfig(merged)
  return merged
}
