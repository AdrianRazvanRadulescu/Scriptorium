import { create } from 'zustand'
import type { AppConfig, LoadedProject, ProjectNode, ProjectSummary } from '@shared/types'

interface PendingCrashRecovery {
  nodeId: string
  journalContent: string
  diskContent: string
}

interface AppStore {
  config: AppConfig | null
  projects: ProjectSummary[]
  libraryError: string | null
  currentProject: LoadedProject | null
  selectedNodeId: string | null
  folderView: 'corkboard' | 'outline'
  isDirty: boolean
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error'
  binderOpen: boolean
  rightPanel: 'none' | 'search' | 'snapshots' | 'bible' | 'settings' | 'journey'
  compileDialogOpen: boolean
  pendingCrashRecovery: PendingCrashRecovery | null

  setConfig(config: AppConfig): void
  setProjects(p: ProjectSummary[]): void
  setLibraryError(e: string | null): void
  setCurrentProject(p: LoadedProject | null): void
  setSelectedNodeId(id: string | null): void
  setFolderView(v: 'corkboard' | 'outline'): void
  setDirty(d: boolean): void
  setSaveStatus(s: 'saved' | 'saving' | 'unsaved' | 'error'): void
  updateProjectNodes(nodes: Record<string, ProjectNode>): void
  toggleBinder(): void
  setRightPanel(p: 'none' | 'search' | 'snapshots' | 'bible' | 'settings' | 'journey'): void
  setCompileDialogOpen(open: boolean): void
  setPendingCrashRecovery(d: PendingCrashRecovery | null): void
}

const useAppStore = create<AppStore>((set) => ({
  config: null,
  projects: [],
  libraryError: null,
  currentProject: null,
  selectedNodeId: null,
  folderView: 'corkboard',
  isDirty: false,
  saveStatus: 'saved',
  binderOpen: true,
  rightPanel: 'none',
  compileDialogOpen: false,
  pendingCrashRecovery: null,

  setConfig: (config) => set((state) => ({ ...state, config })),

  setProjects: (projects) => set((state) => ({ ...state, projects })),

  setLibraryError: (libraryError) => set((state) => ({ ...state, libraryError })),

  setCurrentProject: (currentProject) =>
    set((state) => ({ ...state, currentProject, selectedNodeId: null })),

  setSelectedNodeId: (selectedNodeId) => set((state) => ({ ...state, selectedNodeId })),

  setFolderView: (folderView) => set((state) => ({ ...state, folderView })),

  setDirty: (isDirty) => set((state) => ({ ...state, isDirty })),

  setSaveStatus: (saveStatus) => set((state) => ({ ...state, saveStatus })),

  updateProjectNodes: (nodes) =>
    set((state) => {
      if (state.currentProject === null) return state
      return {
        ...state,
        currentProject: { ...state.currentProject, nodes },
      }
    }),

  toggleBinder: () => set((state) => ({ ...state, binderOpen: !state.binderOpen })),

  setRightPanel: (rightPanel) => set((state) => ({ ...state, rightPanel })),

  setCompileDialogOpen: (compileDialogOpen) => set((state) => ({ ...state, compileDialogOpen })),

  setPendingCrashRecovery: (pendingCrashRecovery) =>
    set((state) => ({ ...state, pendingCrashRecovery })),
}))

export default useAppStore
