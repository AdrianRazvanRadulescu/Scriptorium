import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import useAppStore from '../store/app-store'
import useEditorStore from '../store/editor-store'
import { useT } from '../i18n/strings'
import type { StringKey } from '../i18n/strings'

const SAVE_DOT_COLOR: Record<string, string> = {
  saved: 'var(--color-dim)',
  saving: 'var(--color-dim)',
  unsaved: 'var(--color-accent)',
  error: '#C0504D',
}

export default function StatusBar(): JSX.Element {
  const t = useT()
  const saveStatus = useAppStore(s => s.saveStatus)
  const selectedNodeId = useAppStore(s => s.selectedNodeId)
  const currentProject = useAppStore(s => s.currentProject)
  const rightPanel = useAppStore(s => s.rightPanel)
  const setRightPanel = useAppStore(s => s.setRightPanel)
  const { sceneWordCount, sessionWordsAtOpen, projectWordCount } = useEditorStore()
  const [todayWords, setTodayWords] = useState(0)

  // Refresh the daily counter on mount and after every completed save.
  useEffect(() => {
    if (saveStatus === 'saved') {
      window.api.getTodayWords().then(setTodayWords).catch(() => {})
    }
  }, [saveStatus])

  const selectedNode = selectedNodeId && currentProject
    ? currentProject.nodes[selectedNodeId] : null
  const sessionCount = Math.max(0, sceneWordCount - sessionWordsAtOpen)

  const saveText =
    saveStatus === 'error' ? t('errorSaving')
    : saveStatus === 'saving' ? t('saving')
    : saveStatus === 'unsaved' ? t('unsaved')
    : t('saved')

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
        <span>{sceneWordCount.toLocaleString()} {t('words')}</span>
        {sessionCount > 0 && <span>+{sessionCount.toLocaleString()} {t('thisSession')}</span>}
        {todayWords > 0 && <span>{todayWords.toLocaleString()} {t('today')}</span>}
        {projectWordCount > 0 && <span>{projectWordCount.toLocaleString()} {t('total')}</span>}
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
            {t(`status_${selectedNode.status}` as StringKey)}
          </span>
        )}
      </div>

      <div className='flex items-center gap-3'>
        <span>{saveText}</span>
        <span
          className={`w-2 h-2 rounded-full${saveStatus === 'saving' ? ' animate-pulse' : ''}`}
          style={{
            background: SAVE_DOT_COLOR[saveStatus] ?? 'transparent',
            opacity: saveStatus === 'saved' ? 0.3 : 1,
            transition: 'opacity 400ms ease',
          }}
        />
        <button
          onClick={() => setRightPanel(rightPanel === 'settings' ? 'none' : 'settings')}
          title='Settings'
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: rightPanel === 'settings' ? 'var(--color-prose)' : 'var(--color-dim)',
            fontSize: 14, lineHeight: 1,
          }}
        >
          ⚙
        </button>
      </div>
    </div>
  )
}
