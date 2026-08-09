import type { JSX } from 'react'
import { useEffect, useRef, useCallback } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import useAppStore from '../../store/app-store'
import useEditorStore from '../../store/editor-store'
import { createEditorExtensions } from './codemirror-setup'

function countWords(text: string): number {
  const cleaned = text.replace(/[*_#~]/g, '').replace(/—/g, ' ').replace(/\.{3,}|…/g, ' ')
  return Math.max(0, cleaned.trim().split(/\s+/).filter((w) => w.length > 0).length)
}

export default function EditorPane(): JSX.Element | null {
  const config = useAppStore((s) => s.config)
  const currentProject = useAppStore((s) => s.currentProject)
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)

  const containerRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)

  // Both callbacks use getState() so they never capture stale closure values.
  // This lets the editor be created once without extensions going out of date.
  const triggerSave = useCallback(async () => {
    const { currentProject: proj, selectedNodeId: nodeId, setSaveStatus, setDirty } =
      useAppStore.getState()
    if (!proj || !nodeId) return
    const node = proj.nodes[nodeId]
    if (!node?.sceneFile) return
    const content = useEditorStore.getState().content
    setSaveStatus('saving')
    try {
      await window.api.writeScene(proj.projectDir, node.sceneFile, content)
      await window.api.writeCrashJournal(nodeId, content)
      setSaveStatus('saved')
      setDirty(false)
    } catch {
      setSaveStatus('error')
    }
  }, [])

  const handleUpdate = useCallback((content: string) => {
    useEditorStore.getState().setContent(content)
    useEditorStore.getState().setSceneWordCount(countWords(content))
    useAppStore.getState().setDirty(true)
    useAppStore.getState().setSaveStatus('unsaved')
    const prevTimer = useEditorStore.getState().autosaveTimer
    if (prevTimer !== null) clearTimeout(prevTimer)
    const timer = setTimeout(triggerSave, 800)
    useEditorStore.getState().setAutosaveTimer(timer)
  }, [triggerSave])

  // Create CodeMirror once; recreate only when extension-level options change.
  // focusMode is purely CSS — it does not require recreating the editor.
  useEffect(() => {
    if (!containerRef.current || !config) return
    const startContent =
      editorViewRef.current?.state.doc.toString() ?? useEditorStore.getState().content

    editorViewRef.current?.destroy()

    const view = new EditorView({
      state: EditorState.create({
        doc: startContent,
        extensions: createEditorExtensions({
          onUpdate: handleUpdate,
          onSave: () => { void triggerSave() },
          smartTypography: config.smartTypography,
          focusMode: config.focusMode,
          typewriterScrolling: config.typewriterScrolling,
        }),
      }),
      parent: containerRef.current,
    })
    editorViewRef.current = view

    return () => {
      view.destroy()
      editorViewRef.current = null
    }
    // Intentional: depend only on the two options that change CodeMirror extensions.
    // config.focusMode, fontSize, theme etc. are handled by CSS vars or a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.smartTypography, config?.typewriterScrolling, handleUpdate, triggerSave])

  // Load scene content whenever the user selects a different scene.
  useEffect(() => {
    if (!currentProject || !selectedNodeId) return
    const node = currentProject.nodes[selectedNodeId]
    if (node?.type !== 'scene' || !node.sceneFile) return
    const { projectDir } = currentProject
    const sceneFile = node.sceneFile

    const load = async () => {
      const diskContent = await window.api.readScene(projectDir, sceneFile)
      const journal = await window.api.readCrashJournal(selectedNodeId)

      // If the crash journal differs from disk, let the user decide which to keep.
      if (journal !== null && journal !== diskContent) {
        useAppStore.getState().setPendingCrashRecovery({
          nodeId: selectedNodeId,
          journalContent: journal,
          diskContent,
        })
      }

      const wordCount = countWords(diskContent)
      useEditorStore.getState().setContent(diskContent)
      useEditorStore.getState().setSceneWordCount(wordCount)
      // Baseline for "words written this session" shown in the status bar
      useEditorStore.setState({ sessionWordsAtOpen: wordCount })

      const view = editorViewRef.current
      if (!view) return
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: diskContent },
        selection: { anchor: 0 },
      })
    }

    void load()
  }, [selectedNodeId, currentProject])

  // focusMode dims non-active lines via CSS; no editor recreation needed.
  useEffect(() => {
    if (!containerRef.current || !config) return
    containerRef.current.classList.toggle('focus-mode', config.focusMode)
  }, [config?.focusMode, config])

  // Best-effort save before the Electron main process quits.
  useEffect(() => {
    const handleQuitting = () => { void triggerSave() }
    window.addEventListener('app:quitting', handleQuitting)
    return () => window.removeEventListener('app:quitting', handleQuitting)
  }, [triggerSave])

  // Flush the autosave timer on unmount so we don't fire into a dead component.
  useEffect(() => {
    return () => {
      const timer = useEditorStore.getState().autosaveTimer
      if (timer !== null) clearTimeout(timer)
    }
  }, [])

  const selectedNode =
    selectedNodeId && currentProject ? currentProject.nodes[selectedNodeId] : null

  if (!selectedNode || selectedNode.type !== 'scene') return null

  return (
    <div
      className='flex-1 flex justify-center overflow-y-auto'
      style={{ background: 'var(--color-page)' }}
    >
      <div
        ref={containerRef}
        className='w-full py-16 px-4'
        style={{ maxWidth: 'var(--measure-prose)' }}
      />
    </div>
  )
}
