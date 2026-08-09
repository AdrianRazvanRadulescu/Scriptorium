import { create } from 'zustand'

interface EditorStore {
  content: string
  sceneWordCount: number
  sessionWordsAtOpen: number
  projectWordCount: number
  autosaveTimer: ReturnType<typeof setTimeout> | null

  setContent(c: string): void
  setSceneWordCount(n: number): void
  setProjectWordCount(n: number): void
  setAutosaveTimer(t: ReturnType<typeof setTimeout> | null): void
}

const useEditorStore = create<EditorStore>((set) => ({
  content: '',
  sceneWordCount: 0,
  sessionWordsAtOpen: 0,
  projectWordCount: 0,
  autosaveTimer: null,

  setContent: (content) => set((state) => ({ ...state, content })),

  setSceneWordCount: (sceneWordCount) => set((state) => ({ ...state, sceneWordCount })),

  setProjectWordCount: (projectWordCount) => set((state) => ({ ...state, projectWordCount })),

  setAutosaveTimer: (autosaveTimer) => set((state) => ({ ...state, autosaveTimer })),
}))

export default useEditorStore
