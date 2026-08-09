import type { JSX } from 'react'
import useAppStore from '../store/app-store'
import useEditorStore from '../store/editor-store'

export default function CrashRecoveryModal(): JSX.Element | null {
  const { pendingCrashRecovery, setPendingCrashRecovery } = useAppStore()
  const { setContent } = useEditorStore()

  if (pendingCrashRecovery === null) return null

  const { nodeId, journalContent, diskContent } = pendingCrashRecovery

  const resolveWith = (content: string) => {
    setContent(content)
    window.api.clearCrashJournal(nodeId).catch(() => {})
    setPendingCrashRecovery(null)
  }

  return (
    <div
      className='fixed inset-0 flex items-center justify-center z-50'
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div
        className='flex flex-col gap-5 rounded p-6'
        style={{
          width: '800px',
          maxWidth: 'calc(100vw - 48px)',
          background: 'var(--color-chrome)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div>
          <h2 className='text-base font-prose' style={{ color: 'var(--color-prose)' }}>
            Unsaved changes found
          </h2>
          <p className='text-sm font-ui mt-1' style={{ color: 'var(--color-dim)' }}>
            The app closed before saving. Choose which version to keep.
          </p>
        </div>
        <div className='flex gap-4'>
          <div className='flex-1 flex flex-col gap-2'>
            <p
              className='text-xs font-ui uppercase tracking-wider'
              style={{ color: 'var(--color-dim)' }}
            >
              From last session (unsaved)
            </p>
            <pre
              className='text-xs font-prose leading-relaxed rounded p-3'
              style={{
                background: 'var(--color-page)',
                color: 'var(--color-prose)',
                border: '1px solid var(--color-border)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '240px',
                overflowY: 'auto',
              }}
            >
              {journalContent.slice(0, 600)}{journalContent.length > 600 ? '…' : ''}
            </pre>
          </div>
          <div className='flex-1 flex flex-col gap-2'>
            <p
              className='text-xs font-ui uppercase tracking-wider'
              style={{ color: 'var(--color-dim)' }}
            >
              Last saved to disk
            </p>
            <pre
              className='text-xs font-prose leading-relaxed rounded p-3'
              style={{
                background: 'var(--color-page)',
                color: 'var(--color-prose)',
                border: '1px solid var(--color-border)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '240px',
                overflowY: 'auto',
              }}
            >
              {diskContent.slice(0, 600)}{diskContent.length > 600 ? '…' : ''}
            </pre>
          </div>
        </div>
        <div className='flex items-center gap-3 justify-end'>
          <button
            className='px-4 py-2 text-sm font-ui rounded border'
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-prose)' }}
            onClick={() => resolveWith(diskContent)}
          >
            Keep saved version
          </button>
          <button
            className='px-4 py-2 text-sm font-ui rounded'
            style={{ background: 'var(--color-accent)', color: 'var(--color-page)' }}
            onClick={() => resolveWith(journalContent)}
          >
            Keep journal version
          </button>
        </div>
      </div>
    </div>
  )
}
