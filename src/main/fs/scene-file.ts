import fs from 'node:fs/promises'
import path from 'node:path'
import { writeFileAtomic } from './atomic-write'

const WINDOWS_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
])

export function slugifyForFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[<>:"/\\|?*]/g, '-') // replace Windows-illegal chars with hyphens
    .replace(/[^a-z0-9]+/g, '-')   // everything else non-alphanumeric becomes a hyphen
    .replace(/^-+|-+$/g, '')        // trim leading/trailing hyphens
    .slice(0, 40)
    .replace(/-+$/, '')             // slice might strand a trailing hyphen

  if (WINDOWS_RESERVED_NAMES.has(slug.toUpperCase())) {
    return slug + '-file'
  }

  return slug
}

export async function readScene(projectDir: string, sceneFile: string): Promise<string> {
  return fs.readFile(path.join(projectDir, sceneFile), 'utf-8')
}

export async function writeScene(
  projectDir: string,
  sceneFile: string,
  content: string,
): Promise<void> {
  await writeFileAtomic(path.join(projectDir, sceneFile), content)
}

export async function createSceneFile(
  projectDir: string,
  nodeId: string,
  title: string,
): Promise<string> {
  const slug = slugifyForFilename(title)
  const relative = 'scenes/' + nodeId + '-' + slug + '.md'
  await writeFileAtomic(path.join(projectDir, relative), '')
  return relative
}
