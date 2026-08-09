import { writeFileAtomic } from './atomic-write'
import { slugifyForFilename } from './scene-file'
import { v4 as uuid } from 'uuid'
import type { ProjectFile, LoadedProject, ProjectSummary, IntegrityReport } from '@shared/types'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function readProjectFile(projectDir: string): Promise<ProjectFile> {
  const filePath = path.join(projectDir, 'project.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  const parsed = JSON.parse(raw) as ProjectFile
  if (parsed.version !== 1) {
    throw new Error(`Unsupported project version: ${String(parsed.version)}`)
  }
  return parsed
}

export async function writeProjectFile(projectDir: string, project: ProjectFile): Promise<void> {
  await writeFileAtomic(path.join(projectDir, 'project.json'), JSON.stringify(project, null, 2))
}

export async function createProject(libraryRoot: string, title: string): Promise<LoadedProject> {
  const slug = slugifyForFilename(title)
  const shortId = uuid().slice(0, 8)
  const projectDir = path.join(libraryRoot, 'projects', `${slug}-${shortId}`)

  await fs.mkdir(path.join(projectDir, 'scenes'), { recursive: true })
  await fs.mkdir(path.join(projectDir, 'notes'), { recursive: true })
  await fs.mkdir(path.join(projectDir, 'snapshots'), { recursive: true })

  const now = new Date().toISOString()
  const projectId = uuid()
  const rootId = uuid()

  const rootNode = {
    id: rootId,
    type: 'folder' as const,
    title,
    children: [] as string[],
    parentId: null,
    status: 'draft' as const,
    color: 'none' as const,
    pov: '',
    synopsis: '',
    wordTarget: null,
    sceneFile: null,
    createdAt: now,
    updatedAt: now,
  }

  const projectFile: ProjectFile = {
    meta: {
      id: projectId,
      title,
      rootNodeId: rootId,
      wordTarget: null,
      sessionTarget: null,
      author: '',
      createdAt: now,
      updatedAt: now,
    },
    nodes: { [rootId]: rootNode },
    version: 1,
  }

  await writeProjectFile(projectDir, projectFile)

  return {
    projectDir,
    meta: projectFile.meta,
    nodes: projectFile.nodes,
  }
}

export async function listProjects(libraryRoot: string): Promise<ProjectSummary[]> {
  const projectsDir = path.join(libraryRoot, 'projects')

  let entries: string[]
  try {
    entries = await fs.readdir(projectsDir)
  } catch {
    return []
  }

  const summaries: ProjectSummary[] = []

  for (const entry of entries) {
    try {
      const projectDir = path.join(projectsDir, entry)
      const stat = await fs.stat(projectDir)
      if (!stat.isDirectory()) continue
      const project = await readProjectFile(projectDir)
      summaries.push({
        id: project.meta.id,
        title: project.meta.title,
        dir: projectDir,
        updatedAt: project.meta.updatedAt,
      })
    } catch {
      // silently skip dirs without a valid project.json
    }
  }

  return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function validateLibraryRoot(
  libraryPath: string
): Promise<{ ok: boolean; error?: string; syncWarning?: string }> {
  try {
    await fs.access(libraryPath)
  } catch {
    return { ok: false, error: `Library root not found: ${libraryPath}` }
  }

  const probeFile = path.join(libraryPath, '.scriptorium-write-probe')
  try {
    await fs.writeFile(probeFile, '')
    await fs.unlink(probeFile)
  } catch {
    return { ok: false, error: `Library root is not writable: ${libraryPath}` }
  }

  const syncServices = ['OneDrive', 'Dropbox', 'Google Drive']
  const matchedService = syncServices.find(name => libraryPath.includes(name))
  if (matchedService !== undefined) {
    return {
      ok: true,
      syncWarning:
        `Library root is inside ${matchedService}. ` +
        'Real-time sync may cause file conflicts while Scriptorium is writing.',
    }
  }

  return { ok: true }
}

export async function checkIntegrity(projectDir: string): Promise<IntegrityReport> {
  const project = await readProjectFile(projectDir)

  const referencedFiles = new Set<string>()
  for (const node of Object.values(project.nodes)) {
    if (node.sceneFile !== null) {
      referencedFiles.add(node.sceneFile)
    }
  }

  const scenesDir = path.join(projectDir, 'scenes')
  let diskEntries: string[]
  try {
    diskEntries = await fs.readdir(scenesDir)
  } catch {
    diskEntries = []
  }

  const diskFiles = new Set(diskEntries.map(name => `scenes/${name}`))

  const orphanedFiles = [...diskFiles].filter(f => !referencedFiles.has(f))
  const missingFiles = [...referencedFiles].filter(f => !diskFiles.has(f))

  return { orphanedFiles, missingFiles }
}
