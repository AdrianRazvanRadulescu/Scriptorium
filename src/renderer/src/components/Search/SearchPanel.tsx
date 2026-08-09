import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import useAppStore from '../../store/app-store'
import type { SearchHit, NodeStatus } from '@shared/types'

const STATUS_OPTIONS: Array<{ value: NodeStatus | ''; label: string }> = [
  { value: '', label: 'Any status' },
  { value: 'idea', label: 'Idea' },
  { value: 'draft', label: 'Draft' },
  { value: 'revised', label: 'Revised' },
  { value: 'done', label: 'Done' },
]

type ContextProps = { context: string; matchStart: number; matchLength: number }

function HighlightedContext({ context, matchStart, matchLength }: ContextProps): JSX.Element {
  const before = context.slice(0, matchStart)
  const match = context.slice(matchStart, matchStart + matchLength)
  const after = context.slice(matchStart + matchLength)
  return (
    <span style={{ color: 'var(--color-dim)' }}>
      {before}
      <strong style={{ color: 'var(--color-prose)', fontWeight: 600 }}>{match}</strong>
      {after}
    </span>
  )
}

export default function SearchPanel(): JSX.Element {
  const { config, projects, currentProject, setCurrentProject, setSelectedNodeId } = useAppStore()

  const [query, setQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<NodeStatus | ''>('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current)

    if (query.trim().length === 0) {
      setResults([])
      setIsLoading(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      setIsLoading(true)
      setError(null)

      const searchQuery = {
        text: query.trim(),
        ...(projectFilter !== '' ? { projectId: projectFilter } : {}),
        ...(statusFilter !== '' ? { status: statusFilter as NodeStatus } : {}),
      }

      window.api
        .search(searchQuery)
        .then((hits) => {
          setResults(hits)
          setIsLoading(false)
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Search failed')
          setIsLoading(false)
        })
    }, 300)

    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    }
  }, [query, projectFilter, statusFilter])

  const handleHitClick = async (hit: SearchHit) => {
    if (currentProject?.meta.id !== hit.projectId) {
      const project = await window.api.openProject(hit.projectDir)
      setCurrentProject(project)
    }
    setSelectedNodeId(hit.nodeId)
  }

  const handleRebuildIndex = () => {
    if (config === null) return
    window.api.rebuildSearchIndex(config.libraryRoot).catch(() => {})
  }

  const showEmptyPrompt = !isLoading && error === null && query.trim().length === 0
  const showNoResults =
    !isLoading && error === null && query.trim().length > 0 && results.length === 0

  return (
    <aside
      className='flex flex-col h-full shrink-0'
      style={{
        width: '300px',
        background: 'var(--color-chrome)',
        borderLeft: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
    >
      <div className='p-3' style={{ borderBottom: '1px solid var(--color-border)' }}>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search your writing...'
          className='w-full px-2 py-1.5 text-sm font-ui rounded border outline-none bg-transparent'
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-prose)' }}
          autoFocus
        />
        <div className='flex gap-2 mt-2'>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className='flex-1 text-xs font-ui px-1.5 py-1 rounded border'
            style={{
              background: 'var(--color-page)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-dim)',
            }}
          >
            <option value=''>All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as NodeStatus | '')}
            className='flex-1 text-xs font-ui px-1.5 py-1 rounded border'
            style={{
              background: 'var(--color-page)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-dim)',
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {isLoading && (
          <p className='p-3 text-xs font-ui' style={{ color: 'var(--color-dim)' }}>Searching...</p>
        )}

        {error !== null && (
          <p className='p-3 text-xs font-ui' style={{ color: 'var(--color-accent)' }}>{error}</p>
        )}

        {showEmptyPrompt && (
          <p className='p-4 text-xs font-ui text-center' style={{ color: 'var(--color-dim)' }}>
            Type to search across all your writing
          </p>
        )}

        {showNoResults && (
          <p className='p-3 text-xs font-ui' style={{ color: 'var(--color-dim)' }}>No results</p>
        )}

        {results.map((hit, i) => {
          const projectName =
            projects.find((p) => p.id === hit.projectId)?.title ?? hit.projectId
          return (
            <div
              key={i}
              onClick={() => void handleHitClick(hit)}
              className='p-3 cursor-pointer'
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div
                className='text-xs font-prose font-medium mb-1'
                style={{ color: 'var(--color-prose)' }}
              >
                {hit.nodeTitle}
              </div>
              <div className='text-xs font-prose mb-1'>
                <HighlightedContext
                  context={hit.context}
                  matchStart={hit.matchStart}
                  matchLength={hit.matchLength}
                />
              </div>
              <div className='text-xs font-ui' style={{ color: 'var(--color-dim)', opacity: 0.7 }}>
                {projectName}
              </div>
            </div>
          )
        })}
      </div>

      <div className='p-3' style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleRebuildIndex}
          className='text-xs font-ui hover:underline'
          style={{ color: 'var(--color-dim)' }}
        >
          Rebuild index
        </button>
      </div>
    </aside>
  )
}
