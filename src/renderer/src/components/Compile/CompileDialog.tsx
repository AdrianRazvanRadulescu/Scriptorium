import type { JSX } from 'react'
import { useState } from 'react'
import useAppStore from '../../store/app-store'
import type { CompileOptions } from '@shared/types'

interface Props { onClose: () => void }

export default function CompileDialog({ onClose }: Props): JSX.Element {
  const { currentProject } = useAppStore()
  const [format, setFormat] = useState<CompileOptions['format']>('docx')
  const [headingStyle, setHeadingStyle] = useState<CompileOptions['headingStyle']>('arabic')
  const [sceneSeparator, setSceneSeparator] = useState('* * *')
  const [includeTitlePage, setIncludeTitlePage] = useState(true)
  const [includePartTitlePages, setIncludePartTitlePages] = useState(false)
  const [outputPath, setOutputPath] = useState('')
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (currentProject === null) return
    setExporting(true)
    setError('')
    try {
      const result = await window.api.compileProject({
        rootNodeId: currentProject.meta.rootNodeId,
        projectDir: currentProject.projectDir,
        format,
        headingStyle,
        includePartTitlePages,
        sceneSeparator,
        includeTitlePage,
        title: currentProject.meta.title,
        author: currentProject.meta.author,
      })
      setOutputPath(result.outputPath)
    } catch (e) {
      setError(String(e))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className='rounded-lg p-6 flex flex-col gap-4'
        style={{ background: 'var(--color-chrome)', border: '1px solid var(--color-border)', width: 420 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className='text-sm font-medium' style={{ color: 'var(--color-prose)' }}>
          Export / Compile
        </h3>
        <div className='flex flex-col gap-3 text-xs' style={{ color: 'var(--color-dim)' }}>
          <label>
            Format
            <div className='flex gap-2 mt-1'>
              {(['md', 'docx', 'pdf'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className='px-3 py-1 rounded'
                  style={{
                    background: format === f ? 'var(--color-accent)' : 'var(--color-page)',
                    color: format === f ? 'var(--color-page)' : 'var(--color-prose)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </label>
          <label>
            Chapter headings
            <select
              value={headingStyle}
              onChange={e => setHeadingStyle(e.target.value as CompileOptions['headingStyle'])}
              className='ml-2 text-xs px-2 py-0.5 rounded'
              style={{ background: 'var(--color-page)', color: 'var(--color-prose)', border: '1px solid var(--color-border)' }}
            >
              <option value='none'>None</option>
              <option value='arabic'>Arabic (1, 2, 3)</option>
              <option value='roman'>Roman (I, II, III)</option>
              <option value='spelled'>Spelled (One, Two)</option>
            </select>
          </label>
          <label>
            Scene separator
            <input
              value={sceneSeparator}
              onChange={e => setSceneSeparator(e.target.value)}
              className='ml-2 text-xs px-2 py-0.5 rounded w-24'
              style={{ background: 'var(--color-page)', color: 'var(--color-prose)', border: '1px solid var(--color-border)' }}
            />
          </label>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={includeTitlePage}
              onChange={e => setIncludeTitlePage(e.target.checked)}
            />
            Include title page
          </label>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={includePartTitlePages}
              onChange={e => setIncludePartTitlePages(e.target.checked)}
            />
            Include part title pages
          </label>
        </div>
        {error && <p className='text-xs' style={{ color: '#C0504D' }}>{error}</p>}
        {outputPath && <p className='text-xs' style={{ color: 'var(--color-accent)' }}>Saved to {outputPath}</p>}
        <div className='flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-4 py-1.5 rounded text-xs'
            style={{ background: 'var(--color-page)', color: 'var(--color-prose)', border: '1px solid var(--color-border)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => void handleExport()}
            disabled={exporting}
            className='px-4 py-1.5 rounded text-xs'
            style={{ background: 'var(--color-accent)', color: 'var(--color-page)' }}
          >
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}
