import type { JSX } from 'react'
import { useEffect } from 'react'
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
import EditorToolbar from './components/Editor/EditorToolbar'

function App(): JSX.Element {
  const {
    config,
    libraryError,
    binderOpen,
    rightPanel,
    selectedNodeId,
    currentProject,
    folderView,
    setConfig,
    setProjects,
    setLibraryError,
    setPendingCrashRecovery,
  } = useAppStore()

  useEffect(() => {
    window.api.getConfig().then(setConfig)
    window.api.listProjects().then(setProjects)

    const onDriveStatus = (data: { available: boolean; libraryRoot: string }) => {
      if (!data.available) setLibraryError('Library root unavailable: ' + data.libraryRoot)
    }

    const onCrashRecovery = (data: {
      nodeId: string
      journalContent: string
      diskContent: string
    }) => {
      setPendingCrashRecovery(data)
    }

    window.api.on('drive:status', onDriveStatus as (...args: unknown[]) => void)
    window.api.on('crash:recovery', onCrashRecovery as (...args: unknown[]) => void)

    return () => {
      window.api.off('drive:status', onDriveStatus as (...args: unknown[]) => void)
      window.api.off('crash:recovery', onCrashRecovery as (...args: unknown[]) => void)
    }
  }, [setConfig, setProjects, setLibraryError, setPendingCrashRecovery])

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

  const selectedNode = selectedNodeId && currentProject
    ? currentProject.nodes[selectedNodeId]
    : null

  const showEditor = selectedNode?.type === 'scene'
  const showFolder = selectedNode?.type === 'folder' || (!selectedNode && currentProject !== null)

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
      </div>
      <CrashRecoveryModal />
    </ThemeProvider>
  )
}

function WelcomeScreen(): JSX.Element {
  const { projects, setCurrentProject, setSelectedNodeId } = useAppStore()

  const openProject = async (dir: string) => {
    const project = await window.api.openProject(dir)
    setCurrentProject(project)
    setSelectedNodeId(project.meta.rootNodeId)
  }

  const createProject = async () => {
    const title = prompt('Project title:')
    if (!title) return
    const project = await window.api.createProject(title)
    setCurrentProject(project)
    setSelectedNodeId(project.meta.rootNodeId)
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-8"
      style={{ color: 'var(--color-dim)' }}
    >
      <h1
        style={{ fontFamily: 'var(--font-prose)', fontSize: '2rem', color: 'var(--color-prose)' }}
      >
        Scriptorium
      </h1>
      {projects.length === 0 ? (
        <p>No projects yet. Create one to begin.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map(p => (
            <li key={p.id}>
              <button
                onClick={() => openProject(p.dir)}
                className="text-left hover:underline"
                style={{ color: 'var(--color-prose)' }}
              >
                {p.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={createProject}
        className="px-4 py-2 rounded"
        style={{ background: 'var(--color-accent)', color: 'var(--color-page)' }}
      >
        New Project
      </button>
    </div>
  )
}

export default App
