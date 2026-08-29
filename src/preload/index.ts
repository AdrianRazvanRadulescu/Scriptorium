import { contextBridge, ipcRenderer } from 'electron'
import type { ScriptoriumAPI, IpcPushChannel } from '@shared/ipc-contract'

type Listener = (...args: unknown[]) => void
type IpcWrapper = Parameters<typeof ipcRenderer.on>[1]

// Maps each caller-supplied listener to the wrapper we registered with ipcRenderer,
// so off() can remove the exact function that on() added.
const wrappers = new WeakMap<Listener, IpcWrapper>()

const api: ScriptoriumAPI = {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (patch) => ipcRenderer.invoke('config:set', patch),

  validateLibraryRoot: (p) => ipcRenderer.invoke('library:validate', p),
  pickDirectory: () => ipcRenderer.invoke('library:pick'),
  listProjects: () => ipcRenderer.invoke('projects:list'),

  openProject: (dir) => ipcRenderer.invoke('project:open', dir),
  createProject: (title) => ipcRenderer.invoke('project:create', title),
  saveProjectTree: (dir, project) => ipcRenderer.invoke('project:save-tree', dir, project),
  deleteProject: (dir) => ipcRenderer.invoke('project:delete', dir),

  readScene: (dir, file) => ipcRenderer.invoke('scene:read', dir, file),
  writeScene: (dir, file, content) => ipcRenderer.invoke('scene:write', dir, file, content),
  createSceneFile: (dir, id, title) => ipcRenderer.invoke('scene:create', dir, id, title),

  listSnapshots: (dir, nodeId) => ipcRenderer.invoke('snapshot:list', dir, nodeId),
  createSnapshot: (dir, nodeId, content) =>
    ipcRenderer.invoke('snapshot:create', dir, nodeId, content),
  readSnapshot: (dir, nodeId, filename) =>
    ipcRenderer.invoke('snapshot:read', dir, nodeId, filename),
  restoreSnapshot: (dir, nodeId, sceneFile, snapshotFilename) =>
    ipcRenderer.invoke('snapshot:restore', dir, nodeId, sceneFile, snapshotFilename),

  listTrash: (root) => ipcRenderer.invoke('trash:list', root),
  restoreFromTrash: (root, name) => ipcRenderer.invoke('trash:restore', root, name),

  search: (query) => ipcRenderer.invoke('search:query', query),
  rebuildSearchIndex: (root) => ipcRenderer.invoke('search:rebuild', root),

  compileProject: (opts) => ipcRenderer.invoke('compile:run', opts),
  checkIntegrity: (dir) => ipcRenderer.invoke('integrity:check', dir),

  readCrashJournal: (id) => ipcRenderer.invoke('journal:read', id),
  clearCrashJournal: (id) => ipcRenderer.invoke('journal:clear', id),
  writeCrashJournal: (id, content) => ipcRenderer.invoke('journal:write', id, content),

  showItemInFolder: (p) => ipcRenderer.invoke('shell:show-item', p),

  getTodayWords: () => ipcRenderer.invoke('stats:today-words'),
  getAllDailyWords: () => ipcRenderer.invoke('stats:all-words'),

  getJourneyState: () => ipcRenderer.invoke('journey:get'),
  setJourneyLevel: (levelId, done) => ipcRenderer.invoke('journey:set-level', levelId, done),

  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  exitFullscreen: () => ipcRenderer.invoke('window:exit-fullscreen'),

  on: (channel: IpcPushChannel, fn: Listener): void => {
    const wrapper: IpcWrapper = (_ev, ...args) => fn(...(args as unknown[]))
    wrappers.set(fn, wrapper)
    ipcRenderer.on(channel, wrapper)
  },

  off: (channel: IpcPushChannel, fn: Listener): void => {
    const wrapper = wrappers.get(fn)
    if (wrapper) ipcRenderer.removeListener(channel, wrapper)
  },

  // One-way signal — no reply expected, so ipcRenderer.send not .invoke.
  // This avoids ipcMain.handle trying to reply to a destroyed webContents.
  notifySaveDone: (): void => ipcRenderer.send('renderer:save-done'),
}

contextBridge.exposeInMainWorld('api', api)
