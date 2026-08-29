import { app } from 'electron'
import { writeFileAtomic } from './fs/atomic-write'
import type { AppConfig } from '@shared/types'
import fs from 'node:fs/promises'
import path from 'node:path'

// Computed lazily: app.getPath() is only valid once the app is ready, and
// readConfig() is never called before that.
function defaultConfig(): AppConfig {
  return {
    libraryRoot: path.join(app.getPath('documents'), 'Scriptorium'),
    backupRoot: path.join(app.getPath('home'), 'Scriptorium-Backups'),
    theme: 'nocturne',
    font: 'literata',
    fontSize: 18,
    lineHeight: 1.7,
    measure: 65,
    smartTypography: true,
    focusMode: false,
    typewriterScrolling: true,
    lastOpenProjectId: null,
    language: 'ro',
  }
}

function configPath(): string {
  return path.join(app.getPath('userData'), 'config.json')
}

export async function readConfig(): Promise<AppConfig> {
  let raw: string
  try {
    raw = await fs.readFile(configPath(), 'utf-8')
  } catch {
    return defaultConfig()
  }

  // External editors can save this file with a UTF-8 BOM, which JSON.parse rejects.
  // A config we cannot parse must not kill startup — the window would never appear.
  try {
    const parsed = JSON.parse(raw.replace(/^﻿/, '')) as Partial<AppConfig>
    // Spread ensures keys added in future versions get their defaults automatically.
    return { ...defaultConfig(), ...parsed }
  } catch {
    return defaultConfig()
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
