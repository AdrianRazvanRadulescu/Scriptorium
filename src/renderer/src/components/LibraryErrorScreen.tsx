import type { JSX } from 'react'

interface Props {
  error: string
  onRetry: () => void
}

export default function LibraryErrorScreen({ error, onRetry }: Props): JSX.Element {
  const handlePickFolder = async () => {
    const dir = await window.api.pickDirectory()
    if (dir === null) return
    await window.api.setConfig({ libraryRoot: dir })
    onRetry()
  }

  return (
    <div
      className='flex flex-col items-center justify-center h-screen gap-6 px-8 text-center'
      style={{ background: 'var(--color-page)', color: 'var(--color-prose)' }}
    >
      <div className='flex flex-col items-center gap-3 max-w-md'>
        <h1 className='text-lg font-prose' style={{ color: 'var(--color-prose)' }}>
          Cannot open your writing library
        </h1>
        <p className='text-sm font-ui leading-relaxed' style={{ color: 'var(--color-dim)' }}>
          {error}
        </p>
      </div>
      <div className='flex items-center gap-3'>
        <button
          className='px-4 py-2 text-sm font-ui rounded'
          style={{ background: 'var(--color-accent)', color: 'var(--color-page)' }}
          onClick={onRetry}
        >
          Retry
        </button>
        <button
          className='px-4 py-2 text-sm font-ui rounded border'
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-prose)' }}
          onClick={() => void handlePickFolder()}
        >
          Pick a different folder
        </button>
      </div>
    </div>
  )
}
