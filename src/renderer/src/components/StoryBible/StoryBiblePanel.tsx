import { useState, useEffect, useRef } from 'react'
import useAppStore from '../../store/app-store'

const BIBLE_FILE = 'notes/bible.json'

type Tab = 'characters' | 'places' | 'notes'

interface BibleEntry {
  id: string
  name: string
  body: string
}

interface BibleData {
  characters: BibleEntry[]
  places: BibleEntry[]
  notes: BibleEntry[]
}

const EMPTY_BIBLE: BibleData = { characters: [], places: [], notes: [] }

const TABS: Array<{ key: Tab; label: string; newLabel: string }> = [
  { key: 'characters', label: 'Characters', newLabel: 'New character' },
  { key: 'places', label: 'Places', newLabel: 'New place' },
  { key: 'notes', label: 'Notes', newLabel: 'New note' },
]

export default function StoryBiblePanel() {
  const { currentProject } = useAppStore()
  const [data, setData] = useState<BibleData>(EMPTY_BIBLE)
  const [activeTab, setActiveTab] = useState<Tab>('characters')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (currentProject === null) {
      setData(EMPTY_BIBLE)
      setSelectedId(null)
      return
    }
    window.api
      .readScene(currentProject.projectDir, BIBLE_FILE)
      .then((raw) => setData(JSON.parse(raw) as BibleData))
      .catch(() => setData(EMPTY_BIBLE))
  }, [currentProject])

  const scheduleSave = (next: BibleData) => {
    if (currentProject === null) return
    if (saveTimer.current !== null) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      window.api
        .writeScene(currentProject.projectDir, BIBLE_FILE, JSON.stringify(next, null, 2))
        .catch(() => {})
    }, 800)
  }

  const entries = data[activeTab]
  const selectedEntry =
    selectedId !== null ? (entries.find((e) => e.id === selectedId) ?? null) : null

  const updateEntry = (updated: BibleEntry) => {
    const next = {
      ...data,
      [activeTab]: data[activeTab].map((e) => (e.id === updated.id ? updated : e)),
    }
    setData(next)
    scheduleSave(next)
  }

  const addEntry = () => {
    const entry: BibleEntry = { id: crypto.randomUUID(), name: 'Untitled', body: '' }
    const next = { ...data, [activeTab]: [...data[activeTab], entry] }
    setData(next)
    setSelectedId(entry.id)
    scheduleSave(next)
  }

  const findMentions = () => {
    if (selectedEntry === null || currentProject === null) return
    window.api
      .search({ text: selectedEntry.name, projectId: currentProject.meta.id })
      .catch(() => {})
  }

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    setSelectedId(null)
  }

  const activeTabDef = TABS.find((t) => t.key === activeTab)!

  return (
    <aside
      className='flex flex-col h-full shrink-0 border-l'
      style={{
        width: '380px',
        background: 'var(--color-chrome)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className='flex border-b' style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className='flex-1 text-xs font-ui py-2 border-b-2'
            style={{
              borderBottomColor: activeTab === key ? 'var(--color-accent)' : 'transparent',
              color: activeTab === key ? 'var(--color-prose)' : 'var(--color-dim)',
            }}
            onClick={() => switchTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className='flex flex-1 overflow-hidden'>
        <div
          className='flex flex-col border-r'
          style={{ width: '140px', borderColor: 'var(--color-border)' }}
        >
          <div className='flex-1 overflow-y-auto'>
            {entries.map((entry) => (
              <button
                key={entry.id}
                className='w-full text-left px-3 py-2 text-xs font-ui truncate border-b'
                style={{
                  borderColor: 'var(--color-border)',
                  background:
                    selectedId === entry.id ? 'var(--color-selection)' : 'transparent',
                  color: selectedId === entry.id ? 'var(--color-prose)' : 'var(--color-dim)',
                }}
                onClick={() => setSelectedId(entry.id)}
              >
                {entry.name || 'Untitled'}
              </button>
            ))}
          </div>

          <div className='p-2 border-t' style={{ borderColor: 'var(--color-border)' }}>
            <button
              className='w-full text-xs font-ui py-1 rounded border'
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-dim)' }}
              onClick={addEntry}
            >
              {activeTabDef.newLabel}
            </button>
          </div>
        </div>

        <div className='flex flex-col flex-1 overflow-hidden'>
          {selectedEntry === null ? (
            <p className='m-auto text-xs font-ui' style={{ color: 'var(--color-dim)' }}>
              Select an entry
            </p>
          ) : (
            <>
              <div
                className='flex items-center gap-2 p-2 border-b'
                style={{ borderColor: 'var(--color-border)' }}
              >
                <input
                  className='flex-1 text-sm font-prose bg-transparent outline-none'
                  style={{ color: 'var(--color-prose)' }}
                  value={selectedEntry.name}
                  onChange={(e) => updateEntry({ ...selectedEntry, name: e.target.value })}
                  placeholder='Name'
                />
                <button
                  className='shrink-0 text-xs font-ui'
                  style={{ color: 'var(--color-dim)' }}
                  onClick={findMentions}
                >
                  Find mentions
                </button>
              </div>
              <textarea
                className='flex-1 p-3 text-sm font-prose bg-transparent resize-none outline-none'
                style={{ color: 'var(--color-prose)' }}
                value={selectedEntry.body}
                onChange={(e) => updateEntry({ ...selectedEntry, body: e.target.value })}
                placeholder='Notes...'
              />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
