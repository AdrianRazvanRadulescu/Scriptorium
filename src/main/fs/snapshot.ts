import fs from 'node:fs/promises'
import path from 'node:path'
import { writeFileAtomic } from './atomic-write'
import { readScene, writeScene } from './scene-file'
import { countWords } from './word-count'
import type { SnapshotInfo } from '@shared/types'

// Converts the on-disk timestamp format (2026-08-09T14-32-11) back to ISO 8601.
function parseTimestampFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.md$/, '')
  const iso = withoutExt.replace(/T(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3') + 'Z'
  return iso
}

export async function createSnapshot(
  projectDir: string,
  nodeId: string,
  content: string,
): Promise<SnapshotInfo> {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const dir = path.join(projectDir, 'snapshots', nodeId)
  await fs.mkdir(dir, { recursive: true })
  const filename = ts + '.md'
  await writeFileAtomic(path.join(dir, filename), content)
  return {
    nodeId,
    filename,
    timestamp: new Date().toISOString(),
    wordCount: countWords(content),
  }
}

export async function listSnapshots(
  projectDir: string,
  nodeId: string,
): Promise<SnapshotInfo[]> {
  const snapshotDir = path.join(projectDir, 'snapshots', nodeId)

  let entries: string[]
  try {
    entries = await fs.readdir(snapshotDir)
  } catch {
    return []
  }

  const mdFiles = entries.filter(name => name.endsWith('.md'))

  const snapshots = await Promise.all(
    mdFiles.map(async (filename): Promise<SnapshotInfo> => {
      const content = await fs.readFile(path.join(snapshotDir, filename), 'utf-8')
      return {
        nodeId,
        filename,
        timestamp: parseTimestampFromFilename(filename),
        wordCount: countWords(content),
      }
    }),
  )

  return snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export async function readSnapshot(
  projectDir: string,
  nodeId: string,
  filename: string,
): Promise<string> {
  return fs.readFile(path.join(projectDir, 'snapshots', nodeId, filename), 'utf-8')
}

export async function restoreSnapshot(
  projectDir: string,
  nodeId: string,
  sceneFile: string,
  snapshotFilename: string,
): Promise<void> {
  const currentContent = await readScene(projectDir, sceneFile)
  await createSnapshot(projectDir, nodeId, currentContent)
  const snapshotContent = await readSnapshot(projectDir, nodeId, snapshotFilename)
  await writeScene(projectDir, sceneFile, snapshotContent)
}
