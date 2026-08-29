import { app } from 'electron'
import { writeFileAtomic } from './fs/atomic-write'
import fs from 'node:fs/promises'
import path from 'node:path'

type DailyWords = Record<string, number>

function statsPath(): string {
  return path.join(app.getPath('userData'), 'daily-words.json')
}

function todayKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

async function readStats(): Promise<DailyWords> {
  try {
    const raw = await fs.readFile(statsPath(), 'utf-8')
    return JSON.parse(raw) as DailyWords
  } catch {
    return {}
  }
}

export async function recordWordDelta(delta: number): Promise<void> {
  if (delta === 0) return
  const stats = await readStats()
  const key = todayKey()
  stats[key] = Math.max(0, (stats[key] ?? 0) + delta)
  await writeFileAtomic(statsPath(), JSON.stringify(stats, null, 2))
}

export async function getTodayWords(): Promise<number> {
  const stats = await readStats()
  return stats[todayKey()] ?? 0
}

export async function getAllDailyWords(): Promise<DailyWords> {
  return readStats()
}

export async function getTotalWords(): Promise<number> {
  const stats = await readStats()
  return Object.values(stats).reduce((sum, n) => sum + n, 0)
}
