import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import useAppStore from './store/app-store'
import ThemeProvider from './themes/ThemeProvider'
import BinderPanel from './components/Binder/BinderPanel'
import EditorPane from './components/Editor/EditorPane'
import CorkboardView from './components/Corkboard/CorkboardView'
import OutlineView from './components/Outline/OutlineView'
import LibraryErrorScreen from './components/LibraryErrorScreen'
import CrashRecoveryModal from './components/CrashRecoveryModal'
import StatusBar from './components/StatusBar'
import SearchPanel from './components/Search/SearchPanel'
import SnapshotsPanel from './components/Snapshots/SnapshotsPanel'
import StoryBiblePanel from './components/StoryBible/StoryBiblePanel'
import CompileDialog from './components/Compile/CompileDialog'
import SettingsPanel from './components/Settings/SettingsPanel'
import EditorToolbar from './components/Editor/EditorToolbar'
import type { ProjectSummary } from '@shared/types'

export default function App(): JSX.Element {
  const {
    config,
    libraryError,
    binderOpen,
    rightPanel,
    compileDialogOpen,
    selectedNodeId,
    currentProject,
    folderView,
    setConfig,
    setProjects,
    setLibraryError,
    setCurrentProject,
    setSelectedNodeId,
    setCompileDialogOpen,
    setPendingCrashRecovery,
  } = useAppStore()

  useEffect(() => {
    // Load config first, then projects. If a lastOpenProjectId is stored,
    // auto-reopen that project so the user lands in their work immediately.
    const init = async () => {
      const cfg = await window.api.getConfig()
      setConfig(cfg)
      const projects = await window.api.listProjects()
      setProjects(projects)
      if (cfg.lastOpenProjectId !== null) {
        const summary = projects.find(p => p.id === cfg.lastOpenProjectId)
        if (summary !== undefined) {
          try {
            const project = await window.api.openProject(summary.dir)
            setCurrentProject(project)
            setSelectedNodeId(project.meta.rootNodeId)
          } catch {
            // Project directory moved or deleted — clear the stale reference
            window.api.setConfig({ lastOpenProjectId: null }).catch(() => {})
          }
        }
      }
    }
    void init()

    const onDriveStatus = (data: { available: boolean; libraryRoot: string }) => {
      if (!data.available) setLibraryError('Library root unavailable: ' + data.libraryRoot)
    }
    const onCrashRecovery = (data: {
      nodeId: string
      journalContent: string
      diskContent: string
    }) => setPendingCrashRecovery(data)

    // Bridge the IPC push event to a DOM CustomEvent so EditorPane can listen.
    // EditorPane calls notifySaveDone() after triggerSave() completes.
    // If no scene is open, EditorPane is not mounted — signal done immediately
    // so the app doesn't wait 3 seconds for the fallback timeout.
    const onQuitting = () => {
      window.dispatchEvent(new CustomEvent('app:quitting'))
      const { selectedNodeId, currentProject } = useAppStore.getState()
      const selectedNode = selectedNodeId && currentProject
        ? currentProject.nodes[selectedNodeId]
        : null
      if (!selectedNode || selectedNode.type !== 'scene') {
        window.api.notifySaveDone()
      }
    }

    window.api.on('drive:status', onDriveStatus as (...args: unknown[]) => void)
    window.api.on('crash:recovery', onCrashRecovery as (...args: unknown[]) => void)
    window.api.on('app:quitting', onQuitting)

    return () => {
      window.api.off('drive:status', onDriveStatus as (...args: unknown[]) => void)
      window.api.off('crash:recovery', onCrashRecovery as (...args: unknown[]) => void)
      window.api.off('app:quitting', onQuitting)
    }
  }, [setConfig, setProjects, setLibraryError, setCurrentProject, setSelectedNodeId, setPendingCrashRecovery])

  if (libraryError) {
    const retryLibrary = () =>
      window.api
        .validateLibraryRoot(config?.libraryRoot ?? '')
        .then(r => { if (r.ok) setLibraryError(null) })

    return (
      <ThemeProvider>
        <LibraryErrorScreen error={libraryError} onRetry={retryLibrary} />
      </ThemeProvider>
    )
  }

  const selectedNode =
    selectedNodeId && currentProject ? currentProject.nodes[selectedNodeId] : null
  const showEditor = selectedNode?.type === 'scene'
  const showFolder =
    selectedNode?.type === 'folder' || (!selectedNode && currentProject !== null)

  return (
    <ThemeProvider>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: 'var(--color-page)', color: 'var(--color-prose)' }}
      >
        {binderOpen && <BinderPanel />}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <EditorToolbar />
          <div className="flex-1 overflow-hidden">
            {showEditor && <EditorPane />}
            {showFolder && folderView === 'corkboard' && <CorkboardView />}
            {showFolder && folderView === 'outline' && <OutlineView />}
            {!selectedNode && !currentProject && <WelcomeScreen />}
          </div>
          <StatusBar />
        </main>
        {rightPanel === 'search' && <SearchPanel />}
        {rightPanel === 'snapshots' && <SnapshotsPanel />}
        {rightPanel === 'bible' && <StoryBiblePanel />}
        {rightPanel === 'settings' && <SettingsPanel />}
      </div>
      {compileDialogOpen && <CompileDialog onClose={() => setCompileDialogOpen(false)} />}
      <CrashRecoveryModal />
    </ThemeProvider>
  )
}

function WelcomeScreen(): JSX.Element {
  const { projects, setCurrentProject, setSelectedNodeId } = useAppStore()
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [error, setError] = useState('')

  const openProject = async (summary: ProjectSummary) => {
    const project = await window.api.openProject(summary.dir)
    setCurrentProject(project)
    setSelectedNodeId(project.meta.rootNodeId)
    window.api.setConfig({ lastOpenProjectId: project.meta.id }).catch(() => {})
  }

  const createProject = async () => {
    const title = newTitle.trim()
    if (!title) return
    setCreating(true)
    setError('')
    try {
      const project = await window.api.createProject(title)
      setCurrentProject(project)
      setSelectedNodeId(project.meta.rootNodeId)
      setNewTitle('')
      setShowInput(false)
      window.api.setConfig({ lastOpenProjectId: project.meta.id }).catch(() => {})
    } catch (e) {
      setError(String(e))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-6"
      style={{ color: 'var(--color-dim)' }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-prose)',
          fontSize: '2rem',
          fontWeight: 400,
          color: 'var(--color-prose)',
          letterSpacing: '-0.02em',
        }}
      >
        Scriptorium
      </h1>

      {projects.length > 0 && (
        <ul className="space-y-1 text-center">
          {projects.map(p => (
            <li key={p.id}>
              <button
                onClick={() => openProject(p)}
                className="text-sm hover:underline"
                style={{ color: 'var(--color-prose)', fontFamily: 'var(--font-prose)' }}
              >
                {p.title}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!showInput && (
        <button
          onClick={() => setShowInput(true)}
          className="px-5 py-2 rounded text-sm"
          style={{ background: 'var(--color-accent)', color: 'var(--color-page)' }}
        >
          New project
        </button>
      )}

      {showInput && (
        <div className="flex flex-col items-center gap-2">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') createProject()
              if (e.key === 'Escape') { setShowInput(false); setNewTitle('') }
            }}
            placeholder="Project title"
            className="px-3 py-1.5 rounded text-sm outline-none"
            style={{
              background: 'var(--color-chrome)',
              color: 'var(--color-prose)',
              border: '1px solid var(--color-border)',
              minWidth: 220,
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={createProject}
              disabled={creating || !newTitle.trim()}
              className="px-4 py-1.5 rounded text-sm"
              style={{ background: 'var(--color-accent)', color: 'var(--color-page)' }}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowInput(false); setNewTitle(''); setError('') }}
              className="px-4 py-1.5 rounded text-sm"
              style={{ background: 'var(--color-chrome)', color: 'var(--color-dim)', border: '1px solid var(--color-border)' }}
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-xs" style={{ color: '#C0504D' }}>{error}</p>}
        </div>
      )}

      {projects.length === 0 && !showInput && (
        <p className="text-sm text-center" style={{ color: 'var(--color-dim)', maxWidth: 280 }}>
          Create your first project to begin.
        </p>
      )}
    </div>
  )
}
