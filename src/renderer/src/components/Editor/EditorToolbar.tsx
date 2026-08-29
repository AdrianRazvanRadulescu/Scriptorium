import { useEffect, useState, type JSX } from 'react'
import useAppStore from '../../store/app-store'
import { useT } from '../../i18n/strings'
import { THEMES, THEME_ORDER } from '../../themes/themes'
import { findStep } from '../../journey/levels'
import type { AppConfig, Language } from '@shared/types'

function ThemePicker({ config, apply }: {
  config: AppConfig
  apply: (patch: Partial<AppConfig>) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const current = THEMES[config.theme] ?? THEMES['nocturne']

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title={current.name}
        style={{
          width: 18, height: 18, borderRadius: '50%',
          background: current.page,
          border: `2px solid ${current.accent}`,
          cursor: 'pointer', padding: 0,
          display: 'block',
        }}
      />
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
              background: 'var(--color-chrome)',
              border: '1px solid var(--color-border)',
              borderRadius: 8, padding: 8,
              display: 'grid', gridTemplateColumns: 'repeat(8, 24px)', gap: 6,
            }}
          >
            {THEME_ORDER.map(id => {
              const theme = THEMES[id]
              return (
                <button
                  key={id}
                  title={theme.name}
                  onClick={() => { apply({ theme: id }); setOpen(false) }}
                  style={{
                    width: 24, height: 24, borderRadius: 5,
                    background: theme.page,
                    border: config.theme === id
                      ? `2px solid ${theme.accent}`
                      : `1px solid ${theme.border}`,
                    cursor: 'pointer', position: 'relative', padding: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', bottom: 3, right: 3,
                    width: 6, height: 6, borderRadius: '50%',
                    background: theme.accent,
                  }} />
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function LanguageToggle({ config, apply }: {
  config: AppConfig
  apply: (patch: Partial<AppConfig>) => void
}): JSX.Element {
  const options: Language[] = ['ro', 'en']
  return (
    <div
      className='flex items-center'
      style={{ border: '1px solid var(--color-border)', borderRadius: 4, overflow: 'hidden' }}
    >
      {options.map(lang => (
        <button
          key={lang}
          onClick={() => apply({ language: lang })}
          className='text-xs px-1.5 py-0.5'
          style={{
            fontFamily: 'var(--font-ui)',
            background: config.language === lang ? 'var(--color-accent)' : 'transparent',
            color: config.language === lang ? 'var(--color-page)' : 'var(--color-dim)',
            border: 'none', cursor: 'pointer',
          }}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

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
    config, setConfig,
    selectedNodeId, currentProject, folderView, rightPanel,
    setFolderView, setRightPanel, toggleBinder, binderOpen,
    setCompileDialogOpen,
  } = useAppStore()

  const selectedNode = selectedNodeId && currentProject
    ? currentProject.nodes[selectedNodeId]
    : null

  const isFolder = selectedNode?.type === 'folder' || (!selectedNode && currentProject !== null)

  const language: Language = config?.language ?? 'ro'
  const step = selectedNode?.journeyStepId ? findStep(selectedNode.journeyStepId) : undefined
  const sceneTitle = step ? step.title[language] : selectedNode?.title

  // Esc leaves fullscreen — unless a modal is open (Esc closes the modal there).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('[data-modal]')) return
      if (document.fullscreenElement) document.exitFullscreen()
      window.api.exitFullscreen().catch(() => {})
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleFullscreen = () => {
    window.api.toggleFullscreen().catch(() => {})
  }

  const apply = (patch: Partial<AppConfig>) => {
    if (config === null) return
    setConfig({ ...config, ...patch })
    window.api.setConfig(patch).catch(() => {})
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
            {sceneTitle}
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
        <Btn label={t('fullscreen')} active={false} onClick={toggleFullscreen} title='F11 / Esc' />
        <Btn label={t('binder')} active={binderOpen} onClick={toggleBinder} />
        {config !== null && (
          <div className='flex items-center gap-2 pl-2'>
            <ThemePicker config={config} apply={apply} />
            <LanguageToggle config={config} apply={apply} />
          </div>
        )}
      </div>
    </div>
  )
}
