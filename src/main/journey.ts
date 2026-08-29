import { app } from 'electron'
import { writeFileAtomic } from './fs/atomic-write'
import type { JourneyState } from '@shared/types'
import fs from 'node:fs/promises'
import path from 'node:path'

function journeyPath(): string {
  return path.join(app.getPath('userData'), 'journey.json')
}

export async function getJourneyState(): Promise<JourneyState> {
  try {
    const raw = await fs.readFile(journeyPath(), 'utf-8')
    return JSON.parse(raw) as JourneyState
  } catch {
    return { completed: {} }
  }
}

export async function setJourneyLevel(levelId: string, done: boolean): Promise<JourneyState> {
  const state = await getJourneyState()
  if (done) {
    state.completed[levelId] = new Date().toISOString()
  } else {
    delete state.completed[levelId]
  }
  await writeFileAtomic(journeyPath(), JSON.stringify(state, null, 2))
  return state
}
