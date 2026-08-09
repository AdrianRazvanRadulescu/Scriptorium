import { useEffect, type JSX } from 'react'
import useAppStore from '../../store/app-store'

function Btn({
  label,
  active,
  onClick,
  title,
}: {
  label: string
  active: boolean
  onClick: () => void
  title?: string
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      title={title}
      className='text-xs px-2 py-0.5 rounded'
      style={{
        fontFamily: 'var(--font-ui)',
        background: active ? 'var(--color-border)' : 'transparent',
        color: active ? 'var(--color-prose)' : 'var(--color-dim)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

export default function EditorToolbar(): JSX.Element {
  const {
    selectedNodeId, currentProject, folderView, rightPanel,
    setFolderView, setRightPanel, toggleBinder, binderOpen,
  } = useAppStore()

  const selectedNode = selectedNodeId && currentProject
    ? currentProject.nodes[selectedNodeId]
    : null

  const isFolder = selectedNode?.type === 'folder' || (!selectedNode && currentProject !== null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'F11') return
      e.preventDefault()
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div
      className='flex items-center justify-between px-2 flex-shrink-0'
      style={{ height: 40, background: 'var(--color-chrome)' }}
    >
      <div className='flex items-center gap-1 min-w-0 overflow-hidden'>
        {isFolder && (
          <>
            <Btn
              label='Corkboard'
              active={folderView === 'corkboard'}
              onClick={() => setFolderView('corkboard')}
            />
            <Btn
              label='Outline'
              active={folderView === 'outline'}
              onClick={() => setFolderView('outline')}
            />
          </>
        )}
        {selectedNode?.type === 'scene' && (
          <span
            className='text-xs truncate'
            style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}
          >
            {selectedNode.title}
          </span>
        )}
      </div>
      <div className='flex items-center gap-1 flex-shrink-0'>
        <Btn
          label='Search'
          active={rightPanel === 'search'}
          onClick={() => setRightPanel(rightPanel === 'search' ? 'none' : 'search')}
          title='Search'
        />
        <Btn
          label='Snapshots'
          active={rightPanel === 'snapshots'}
          onClick={() => setRightPanel(rightPanel === 'snapshots' ? 'none' : 'snapshots')}
          title='Snapshots'
        />
        <Btn label='Fullscreen' active={false} onClick={toggleFullscreen} title='Fullscreen (F11)' />
        <Btn label='Binder' active={binderOpen} onClick={toggleBinder} title='Toggle Binder' />
      </div>
    </div>
  )
}
