import { ipcMain, dialog, shell } from 'electron'
import type Database from 'better-sqlite3'
import type { AppConfig, CompileOptions, ProjectFile, SearchQuery } from '@shared/types'
import { readConfig, patchConfig } from '../config-store'
import {
  validateLibraryRoot,
  listProjects,
  readProjectFile,
  writeProjectFile,
  createProject,
  checkIntegrity,
} from '../fs/project-io'
import { readScene, writeScene, createSceneFile } from '../fs/scene-file'
import { createSnapshot, listSnapshots, readSnapshot, restoreSnapshot } from '../fs/snapshot'
import { moveToTrash, listTrash, restoreFromTrash } from '../fs/trash'
import { searchIndex, upsertDocument, rebuildIndex } from '../db/search-index'
import { writeCrashJournal, readCrashJournal, clearCrashJournal } from '../crash-journal'
import { compileProject } from '../compiler'
import { recordWordDelta, getTodayWords } from '../daily-stats'
import { countWords } from '../fs/word-count'

export function registerIpcHandlers(db: Database.Database | null): void {
  ipcMain.handle('config:get', async () => readConfig())

  ipcMain.handle('config:set', async (_e, patch: Partial<AppConfig>) => patchConfig(patch))

  ipcMain.handle('library:validate', async (_e, libraryPath: string) =>
    validateLibraryRoot(libraryPath)
  )

  ipcMain.handle('library:pick', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.filePaths[0] ?? null
  })

  ipcMain.handle('projects:list', async () => {
    const config = await readConfig()
    return listProjects(config.libraryRoot)
  })

  ipcMain.handle('project:open', async (_e, projectDir: string) => {
    const pf = await readProjectFile(projectDir)
    return { projectDir, meta: pf.meta, nodes: pf.nodes }
  })

  ipcMain.handle('project:create', async (_e, title: string) => {
    const config = await readConfig()
    return createProject(config.libraryRoot, title)
  })

  ipcMain.handle('project:save-tree', async (_e, projectDir: string, project: ProjectFile) =>
    writeProjectFile(projectDir, project)
  )

  ipcMain.handle('project:delete', async (_e, projectDir: string) => {
    const config = await readConfig()
    return moveToTrash(projectDir, config.libraryRoot)
  })

  ipcMain.handle('scene:read', async (_e, projectDir: string, sceneFile: string) =>
    readScene(projectDir, sceneFile)
  )

  ipcMain.handle(
    'scene:write',
    async (_e, projectDir: string, sceneFile: string, content: string) => {
      // Read the old version first so we can track how many words this save added.
      let oldWordCount = 0
      try {
        oldWordCount = countWords(await readScene(projectDir, sceneFile))
      } catch {
        // new scene, no file yet
      }

      await writeScene(projectDir, sceneFile, content)

      // Stats failure is non-fatal — prose is already saved
      recordWordDelta(countWords(content) - oldWordCount).catch(() => {})

      // Index update failure is non-fatal — prose is already saved
      try {
        const pf = await readProjectFile(projectDir)
        const node = Object.values(pf.nodes).find(n => n.sceneFile === sceneFile)
        if (node !== undefined && db !== null) {
          upsertDocument(db, {
            projectId: pf.meta.id,
            projectDir,
            nodeId: node.id,
            nodeTitle: node.title,
            content,
            status: node.status,
            pov: node.pov,
          })
        }
      } catch {
        // intentionally silent
      }
    }
  )

  ipcMain.handle('scene:create', async (_e, projectDir: string, nodeId: string, title: string) =>
    createSceneFile(projectDir, nodeId, title)
  )

  ipcMain.handle('snapshot:list', async (_e, projectDir: string, nodeId: string) =>
    listSnapshots(projectDir, nodeId)
  )

  ipcMain.handle(
    'snapshot:create',
    async (_e, projectDir: string, nodeId: string, content: string) =>
      createSnapshot(projectDir, nodeId, content)
  )

  ipcMain.handle(
    'snapshot:read',
    async (_e, projectDir: string, nodeId: string, filename: string) =>
      readSnapshot(projectDir, nodeId, filename)
  )

  ipcMain.handle(
    'snapshot:restore',
    async (_e, projectDir: string, nodeId: string, sceneFile: string, snapshotFilename: string) =>
      restoreSnapshot(projectDir, nodeId, sceneFile, snapshotFilename)
  )

  ipcMain.handle('trash:list', async () => {
    const config = await readConfig()
    return listTrash(config.libraryRoot)
  })

  ipcMain.handle('trash:restore', async (_e, _libraryRoot: string, name: string) => {
    const config = await readConfig()
    return restoreFromTrash(config.libraryRoot, name)
  })

  ipcMain.handle('search:query', async (_e, query: SearchQuery) =>
    db ? searchIndex(db, query) : []
  )

  ipcMain.handle('search:rebuild', async () => {
    if (!db) return
    const config = await readConfig()
    return rebuildIndex(config.libraryRoot, db)
  })

  ipcMain.handle('compile:run', async (_e, options: CompileOptions) => compileProject(options))

  ipcMain.handle('integrity:check', async (_e, projectDir: string) =>
    checkIntegrity(projectDir)
  )

  ipcMain.handle('journal:read', async (_e, nodeId: string) => readCrashJournal(nodeId))

  ipcMain.handle('journal:write', async (_e, nodeId: string, content: string) =>
    writeCrashJournal(nodeId, content)
  )

  ipcMain.handle('journal:clear', async (_e, nodeId: string) => clearCrashJournal(nodeId))

  ipcMain.handle('shell:show-item', async (_e, itemPath: string) =>
    shell.showItemInFolder(itemPath)
  )

  ipcMain.handle('stats:today-words', async () => getTodayWords())
}
