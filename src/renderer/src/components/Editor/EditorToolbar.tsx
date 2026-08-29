import { useEffect, type JSX } from 'react'
import useAppStore from '../../store/app-store'
import { useT } from '../../i18n/strings'

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
  const t = useT()
  const {
    selectedNodeId, currentProject, folderView, rightPanel,
    setFolderView, setRightPanel, toggleBinder, binderOpen,
    setCompileDialogOpen,
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
              label={t('corkboard')}
              active={folderView === 'corkboard'}
              onClick={() => setFolderView('corkboard')}
            />
            <Btn
              label={t('outline')}
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
          label={t('journey')}
          active={rightPanel === 'journey'}
          onClick={() => setRightPanel(rightPanel === 'journey' ? 'none' : 'journey')}
        />
        <Btn
          label={t('search')}
          active={rightPanel === 'search'}
          onClick={() => setRightPanel(rightPanel === 'search' ? 'none' : 'search')}
        />
        <Btn
          label={t('snapshots')}
          active={rightPanel === 'snapshots'}
          onClick={() => setRightPanel(rightPanel === 'snapshots' ? 'none' : 'snapshots')}
        />
        <Btn
          label={t('bible')}
          active={rightPanel === 'bible'}
          onClick={() => setRightPanel(rightPanel === 'bible' ? 'none' : 'bible')}
        />
        {currentProject !== null && (
          <Btn
            label={t('compile')}
            active={false}
            onClick={() => setCompileDialogOpen(true)}
          />
        )}
        <Btn label={t('fullscreen')} active={false} onClick={toggleFullscreen} title='F11' />
        <Btn label={t('binder')} active={binderOpen} onClick={toggleBinder} />
      </div>
    </div>
  )
}
