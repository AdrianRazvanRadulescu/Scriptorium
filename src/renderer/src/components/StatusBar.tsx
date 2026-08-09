import type { JSX } from 'react'
import useAppStore from '../store/app-store'
import useEditorStore from '../store/editor-store'

const SAVE_DOT_COLOR: Record<string, string> = {
  saved: 'var(--color-dim)',
  saving: 'var(--color-dim)',
  unsaved: 'var(--color-accent)',
  error: '#C0504D',
}

export default function StatusBar(): JSX.Element {
  const { saveStatus, selectedNodeId, currentProject } = useAppStore(s => ({
    saveStatus: s.saveStatus,
    selectedNodeId: s.selectedNodeId,
    currentProject: s.currentProject,
  }))
  const { sceneWordCount, sessionWordsAtOpen, projectWordCount } = useEditorStore()

  const selectedNode = selectedNodeId && currentProject
    ? currentProject.nodes[selectedNodeId] : null
  const sessionCount = Math.max(0, sceneWordCount - sessionWordsAtOpen)

  const saveText =
    saveStatus === 'error' ? 'Error saving'
    : saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'unsaved' ? 'Unsaved'
    : 'Saved'

  return (
    <div
      className='flex items-center justify-between px-4'
      style={{
        height: 40,
        background: 'var(--color-chrome)',
        borderTop: '1px solid var(--color-border)',
        fontFamily: 'var(--font-ui)',
        fontSize: '11px',
        color: 'var(--color-dim)',
        flexShrink: 0,
      }}
    >
      <div className='flex items-center gap-4'>
        <span>{sceneWordCount.toLocaleString()} words</span>
        {sessionCount > 0 && <span>+{sessionCount.toLocaleString()} this session</span>}
        {projectWordCount > 0 && <span>{projectWordCount.toLocaleString()} total</span>}
      </div>

      <div>
        {selectedNode?.type === 'scene' && (
          <span style={{
            padding: '1px 7px',
            borderRadius: 3,
            border: '1px solid var(--color-dim)',
            fontSize: '10px',
            opacity: 0.7,
          }}>
            {selectedNode.status}
          </span>
        )}
      </div>

      <div className='flex items-center gap-2'>
        <span>{saveText}</span>
        <span
          className={`w-2 h-2 rounded-full${saveStatus === 'saving' ? ' animate-pulse' : ''}`}
          style={{
            background: SAVE_DOT_COLOR[saveStatus] ?? 'transparent',
            opacity: saveStatus === 'saved' ? 0.3 : 1,
            transition: 'opacity 400ms ease',
          }}
        />
      </div>
    </div>
  )
}
