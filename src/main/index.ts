import { app, BrowserWindow, nativeTheme } from 'electron'
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
let db: Database.Database | null = null

async function initDatabase(libraryRoot: string): Promise<Database.Database> {
  const indexDir = path.join(libraryRoot, '.index')
  await fs.mkdir(indexDir, { recursive: true })
  return openIndex(libraryRoot)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#12110F',
    titleBarStyle: 'hidden',
    frame: process.platform !== 'win32',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox:false is required for better-sqlite3 native module to load
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow!.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.scriptorium.app')

  const config = await readConfig()

  // Force dark OS chrome so window decorations match our near-black canvas.
  nativeTheme.themeSource = 'dark'

  try {
    db = await initDatabase(config.libraryRoot)
    registerIpcHandlers(db)
  } catch {
    // Library missing or unreadable — handlers will surface the error to the renderer.
    registerIpcHandlers(null as unknown as Database.Database)
  }

  createWindow()

  const validation = await validateLibraryRoot(config.libraryRoot)
  if (!validation.ok && mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow!.webContents.send('drive:status', {
        available: false,
        libraryRoot: config.libraryRoot,
      })
    })
  }

  // Background backup — non-blocking, failures are warnings not errors
  shouldRunBackup(config.backupRoot).then(needed => {
    if (needed) runBackup(config.libraryRoot, config.backupRoot).catch(console.warn)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  // Signal renderer to flush any pending scene saves before process exits.
  mainWindow?.webContents.send('app:quitting')
})
