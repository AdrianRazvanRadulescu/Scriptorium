import type {
  AppConfig,
  CompileOptions,
  IntegrityReport,
  LoadedProject,
  ProjectFile,
  ProjectSummary,
  SearchHit,
  SearchQuery,
  SnapshotInfo,
  TrashEntry
} from './types'

// The typed API surface exposed to the renderer via contextBridge.
// Every method returns a Promise — IPC is always async.
export interface ScriptoriumAPI {
  // ── Config ──────────────────────────────────────────────────────────────────
  getConfig(): Promise<AppConfig>
  setConfig(patch: Partial<AppConfig>): Promise<void>

  // ── Library ──────────────────────────────────────────────────────────────────
  validateLibraryRoot(path: string): Promise<{ ok: boolean; error?: string }>
  pickDirectory(): Promise<string | null>
  listProjects(): Promise<ProjectSummary[]>

  // ── Projects ─────────────────────────────────────────────────────────────────
  openProject(projectDir: string): Promise<LoadedProject>
  createProject(title: string): Promise<LoadedProject>
  saveProjectTree(projectDir: string, project: ProjectFile): Promise<void>
  deleteProject(projectDir: string): Promise<void> // moves to .trash/

  // ── Scenes ───────────────────────────────────────────────────────────────────
  readScene(projectDir: string, sceneFile: string): Promise<string>
  // Atomic write: temp → fsync → rename.
  writeScene(projectDir: string, sceneFile: string, content: string): Promise<void>
  createSceneFile(projectDir: string, nodeId: string, title: string): Promise<string>

  // ── Snapshots ────────────────────────────────────────────────────────────────
  listSnapshots(projectDir: string, nodeId: string): Promise<SnapshotInfo[]>
  createSnapshot(projectDir: string, nodeId: string, content: string): Promise<SnapshotInfo>
  readSnapshot(projectDir: string, nodeId: string, filename: string): Promise<string>
  restoreSnapshot(
    projectDir: string,
    nodeId: string,
    sceneFile: string,
    snapshotFilename: string
  ): Promise<void>

  // ── Trash ────────────────────────────────────────────────────────────────────
  listTrash(libraryRoot: string): Promise<TrashEntry[]>
  restoreFromTrash(libraryRoot: string, name: string): Promise<void>

  // ── Search ───────────────────────────────────────────────────────────────────
  search(query: SearchQuery): Promise<SearchHit[]>
  rebuildSearchIndex(libraryRoot: string): Promise<void>

  // ── Compile ──────────────────────────────────────────────────────────────────
  compileProject(options: CompileOptions): Promise<{ outputPath: string }>

  // ── Integrity ────────────────────────────────────────────────────────────────
  checkIntegrity(projectDir: string): Promise<IntegrityReport>

  // ── Crash journal ────────────────────────────────────────────────────────────
  readCrashJournal(nodeId: string): Promise<string | null>
  clearCrashJournal(nodeId: string): Promise<void>
  writeCrashJournal(nodeId: string, content: string): Promise<void>

  // ── Shell helpers ────────────────────────────────────────────────────────────
  showItemInFolder(path: string): Promise<void>

  // ── Event bus (renderer subscribes to main-pushed events) ───────────────────
  on(channel: IpcPushChannel, listener: (...args: unknown[]) => void): void
  off(channel: IpcPushChannel, listener: (...args: unknown[]) => void): void

  // ── Quit handshake ─────────────────────────────────────────────────────────
  // Called by EditorPane after triggerSave() completes during app:quitting.
  // Tells the main process it is safe to destroy the window.
  notifySaveDone(): void
}

// Channels on which main pushes events to renderer
export type IpcPushChannel =
  | 'backup:status' // { ok: boolean; message: string }
  | 'drive:status' // { available: boolean; libraryRoot: string }
  | 'crash:recovery' // { nodeId: string; journalContent: string; diskContent: string }
  | 'file:changed' // { nodeId: string; projectDir: string }
  | 'app:quitting' // no payload — signal to flush pending saves before exit

declare global {
  interface Window {
    api: ScriptoriumAPI
  }
}
