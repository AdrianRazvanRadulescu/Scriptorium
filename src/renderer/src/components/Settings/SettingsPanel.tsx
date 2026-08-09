import type { JSX } from 'react'
import useAppStore from '../../store/app-store'
import type { AppConfig } from '@shared/types'
import { THEMES, THEME_ORDER } from '../../themes/themes'

const FONTS: Array<{ id: string; label: string }> = [
  { id: 'literata', label: 'Literata' },
  { id: 'eb-garamond', label: 'EB Garamond' },
  { id: 'crimson-pro', label: 'Crimson Pro' },
  { id: 'spectral', label: 'Spectral' },
  { id: 'newsreader', label: 'Newsreader' },
  { id: 'vollkorn', label: 'Vollkorn' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono' },
]

function Row({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className='flex items-center justify-between py-3' style={{ borderBottom: '1px solid var(--color-border)' }}>
      <span className='text-xs' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
        {label}
      </span>
      <div className='flex items-center gap-2'>{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <button
      onClick={() => onChange(!checked)}
      className='rounded-full transition-colors'
      style={{
        width: 36, height: 20, padding: 2,
        background: checked ? 'var(--color-accent)' : 'var(--color-border)',
        border: 'none', cursor: 'pointer', position: 'relative',
      }}
    >
      <span style={{
        display: 'block', width: 16, height: 16, borderRadius: '50%',
        background: 'var(--color-prose)',
        transform: checked ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform 150ms ease',
      }} />
    </button>
  )
}

export default function SettingsPanel(): JSX.Element {
  const config = useAppStore(s => s.config)
  const setConfig = useAppStore(s => s.setConfig)

  if (config === null) return <aside style={{ width: 300 }} />

  const apply = (patch: Partial<AppConfig>) => {
    const next = { ...config, ...patch }
    setConfig(next)
    window.api.setConfig(patch).catch(() => {})
  }

  return (
    <aside
      className='flex flex-col h-full shrink-0 border-l overflow-y-auto'
      style={{
        width: '300px',
        background: 'var(--color-chrome)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className='px-4 py-3 border-b' style={{ borderColor: 'var(--color-border)' }}>
        <h2 className='text-xs font-ui uppercase tracking-wider' style={{ color: 'var(--color-dim)' }}>
          Settings
        </h2>
      </div>

      <div className='px-4 py-2'>
        <p className='text-xs pt-2 pb-1' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', opacity: 0.6 }}>
          THEME
        </p>
        <div className='flex flex-wrap gap-2 pb-3'>
          {THEME_ORDER.map(id => {
            const theme = THEMES[id]
            return (
              <button
                key={id}
                title={theme.name}
                onClick={() => apply({ theme: id })}
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: theme.page,
                  border: config.theme === id
                    ? `2px solid ${theme.accent}`
                    : `2px solid ${theme.border}`,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span style={{
                  position: 'absolute', bottom: 4, right: 4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: theme.accent,
                }} />
              </button>
            )
          })}
        </div>

        <Row label='Font'>
          <select
            value={config.font}
            onChange={e => apply({ font: e.target.value })}
            className='text-xs px-2 py-1 rounded'
            style={{
              background: 'var(--color-page)',
              color: 'var(--color-prose)',
              border: '1px solid var(--color-border)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {FONTS.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </Row>

        <Row label={`Font size — ${config.fontSize}px`}>
          <input
            type='range' min={15} max={24} step={1}
            value={config.fontSize}
            onChange={e => apply({ fontSize: Number(e.target.value) })}
            style={{ width: 100, accentColor: 'var(--color-accent)' }}
          />
        </Row>

        <Row label={`Line height — ${config.lineHeight.toFixed(1)}`}>
          <input
            type='range' min={1.4} max={2.0} step={0.1}
            value={config.lineHeight}
            onChange={e => apply({ lineHeight: Number(e.target.value) })}
            style={{ width: 100, accentColor: 'var(--color-accent)' }}
          />
        </Row>

        <Row label={`Line width — ${config.measure}ch`}>
          <input
            type='range' min={50} max={140} step={5}
            value={config.measure}
            onChange={e => apply({ measure: Number(e.target.value) })}
            style={{ width: 100, accentColor: 'var(--color-accent)' }}
          />
        </Row>

        <p className='text-xs pt-4 pb-1' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', opacity: 0.6 }}>
          EDITOR
        </p>

        <Row label='Smart typography'>
          <Toggle
            checked={config.smartTypography}
            onChange={v => apply({ smartTypography: v })}
          />
        </Row>

        <Row label='Typewriter scrolling'>
          <Toggle
            checked={config.typewriterScrolling}
            onChange={v => apply({ typewriterScrolling: v })}
          />
        </Row>

        <Row label='Focus mode'>
          <Toggle
            checked={config.focusMode}
            onChange={v => apply({ focusMode: v })}
          />
        </Row>

        <p className='text-xs pt-4 pb-1' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', opacity: 0.6 }}>
          LIBRARY
        </p>

        <div className='py-2'>
          <p className='text-xs mb-1' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
            Projects folder
          </p>
          <div className='flex gap-2 items-center'>
            <span
              className='text-xs flex-1 truncate'
              style={{ color: 'var(--color-prose)', fontFamily: 'var(--font-ui)' }}
              title={config.libraryRoot}
            >
              {config.libraryRoot}
            </span>
            <button
              onClick={async () => {
                const dir = await window.api.pickDirectory()
                if (dir !== null) apply({ libraryRoot: dir })
              }}
              className='text-xs px-2 py-1 rounded shrink-0'
              style={{
                background: 'var(--color-page)',
                color: 'var(--color-dim)',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
              }}
            >
              Change…
            </button>
          </div>
        </div>

        <div className='py-2'>
          <p className='text-xs mb-1' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
            Backups folder
          </p>
          <div className='flex gap-2 items-center'>
            <span
              className='text-xs flex-1 truncate'
              style={{ color: 'var(--color-prose)', fontFamily: 'var(--font-ui)' }}
              title={config.backupRoot}
            >
              {config.backupRoot}
            </span>
            <button
              onClick={async () => {
                const dir = await window.api.pickDirectory()
                if (dir !== null) apply({ backupRoot: dir })
              }}
              className='text-xs px-2 py-1 rounded shrink-0'
              style={{
                background: 'var(--color-page)',
                color: 'var(--color-dim)',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
              }}
            >
              Change…
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
