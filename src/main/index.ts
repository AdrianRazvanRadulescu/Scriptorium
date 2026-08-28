import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc/handlers'
import { readConfig } from './config-store'
import { validateLibraryRoot } from './fs/project-io'
import { shouldRunBackup, runBackup } from './backup'
import Database from 'better-sqlite3'
import { openIndex } from './db/search-index'

let mainWindow: BrowserWindow | null = null

async function initDatabase(libraryRoot: string): Promise<Database.Database> {
  const indexDir = path.join(libraryRoot, '.index')
  await fs.mkdir(indexDir, { recursive: true })
  return openIndex(libraryRoot)
}

// Send a message to the renderer, waiting for the page to be ready if needed.
function sendToRenderer(channel: string, payload: unknown): void {
  if (!mainWindow) return
  const wc = mainWindow.webContents
  if (wc.isLoading()) {
    wc.once('did-finish-load', () => wc.send(channel, payload))
  } else {
    wc.send(channel, payload)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#12110F',
    // Use native frame on all platforms — gives close/min/max buttons.
    // Custom frameless chrome can be added later once core functionality works.
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox:false is required for better-sqlite3 native module to load in preload context
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow!.show())

  // Intercept close to flush pending scene saves before destroying the window.
  //
  // WHY: ipcMain.handle() calls event.reply() internally after the handler
  // resolves. If win.destroy() races with an in-flight ipcRenderer.invoke()
  // from the renderer, event.reply() throws "Object has been destroyed" in
  // the main process — shown to the user as the JS error dialog.
  //
  // FIX: we prevent the default close, tell the renderer to save via
  // app:quitting, and wait for the renderer to call notifySaveDone() (which
  // fires AFTER the ipcRenderer.invoke calls complete). Only then we destroy
  // the window — at which point there are no in-flight IPC calls left.
  // A 3-second fallback handles the case where no scene is open (EditorPane
  // is not mounted and never calls notifySaveDone).
  mainWindow.on('close', (event) => {
    event.preventDefault()
    const win = mainWindow
    if (!win || win.isDestroyed()) return

    const destroy = () => {
      if (win && !win.isDestroyed()) win.destroy()
    }

    const fallback = setTimeout(destroy, 3000)

    ipcMain.once('renderer:save-done', () => {
      clearTimeout(fallback)
      destroy()
    })

    win.webContents.send('app:quitting')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.scriptorium.app')

  const config = await readConfig()

  nativeTheme.themeSource = 'dark'

  let db: Database.Database | null = null
  try {
    db = await initDatabase(config.libraryRoot)
  } catch {
    // Library root missing or unreadable; db stays null. Handlers guard against null db.
  }
  registerIpcHandlers(db)

  createWindow()

  // Validate library root and notify renderer. sendToRenderer() handles the timing
  // race between this check completing and the page finishing its initial load.
  validateLibraryRoot(config.libraryRoot).then(validation => {
    if (!validation.ok) {
      sendToRenderer('drive:status', { available: false, libraryRoot: config.libraryRoot })
    }
    if (validation.syncWarning) {
      sendToRenderer('drive:status', { available: true, syncWarning: validation.syncWarning, libraryRoot: config.libraryRoot })
    }
  })

  // Background backup — non-blocking, failures are logged not thrown
  shouldRunBackup(config.backupRoot).then(needed => {
    if (needed) runBackup(config.libraryRoot, config.backupRoot).catch(console.warn)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

