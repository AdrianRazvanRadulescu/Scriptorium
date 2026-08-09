import type { JSX } from 'react'
import useAppStore from '../../store/app-store'

export default function EditorToolbar(): JSX.Element {
  const {
    selectedNodeId, currentProject, folderView, rightPanel,
    setFolderView, setRightPanel, toggleBinder, binderOpen,
  } = useAppStore()

  const selectedNode = selectedNodeId && currentProject
    ? currentProject.nodes[selectedNodeId]
    : null

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div
      className='flex items-center justify-between px-3 flex-shrink-0'
      style={{
        height: 36,
        background: 'var(--color-chrome)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className='flex items-center gap-2'>
        <button
          onClick={toggleBinder}
          title='Toggle Binder'
          className='text-xs px-2 py-0.5 rounded'
          style={{ color: binderOpen ? 'var(--color-prose)' : 'var(--color-dim)' }}
        >
          ☰
        </button>
        {selectedNode?.type === 'folder' && (
          <>
            <button
              onClick={() => setFolderView('corkboard')}
              className='text-xs px-2 py-0.5 rounded'
              style={{ color: folderView === 'corkboard' ? 'var(--color-prose)' : 'var(--color-dim)' }}
            >
              Corkboard
            </button>
            <button
              onClick={() => setFolderView('outline')}
              className='text-xs px-2 py-0.5 rounded'
              style={{ color: folderView === 'outline' ? 'var(--color-prose)' : 'var(--color-dim)' }}
            >
              Outline
            </button>
          </>
        )}
        {selectedNode?.type === 'scene' && (
          <span className='text-xs' style={{ color: 'var(--color-dim)' }}>
            {selectedNode.title}
          </span>
        )}
      </div>
      <div className='flex items-center gap-1'>
        <button
          onClick={() => setRightPanel(rightPanel === 'search' ? 'none' : 'search')}
          className='text-xs px-2 py-0.5 rounded'
          style={{ color: rightPanel === 'search' ? 'var(--color-prose)' : 'var(--color-dim)' }}
          title='Search'
        >
          🔍
        </button>
        <button
          onClick={() => setRightPanel(rightPanel === 'snapshots' ? 'none' : 'snapshots')}
          className='text-xs px-2 py-0.5 rounded'
          style={{ color: rightPanel === 'snapshots' ? 'var(--color-prose)' : 'var(--color-dim)' }}
          title='Snapshots'
        >
          ◷
        </button>
        <button
          onClick={toggleFullscreen}
          className='text-xs px-2 py-0.5 rounded'
          style={{ color: 'var(--color-dim)' }}
          title='Fullscreen (F11)'
        >
          ⛶
        </button>
      </div>
    </div>
  )
}
