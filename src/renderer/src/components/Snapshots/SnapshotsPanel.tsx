import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import useAppStore from '../../store/app-store'
import useEditorStore from '../../store/editor-store'
import type { SnapshotInfo } from '@shared/types'

type DiffLine = { text: string; type: 'same' | 'added' | 'removed' }

function diff(a: string, b: string): DiffLine[] {
  const aLines = a.split('\n').slice(0, 80)
  const bLines = b.split('\n').slice(0, 80)
  const result: DiffLine[] = []
  const maxLen = Math.max(aLines.length, bLines.length)
  for (let i = 0; i < maxLen; i++) {
    const al = aLines[i], bl = bLines[i]
    if (al === bl) result.push({ text: al ?? '', type: 'same' })
    else {
      if (al !== undefined) result.push({ text: al, type: 'removed' })
      if (bl !== undefined) result.push({ text: bl, type: 'added' })
    }
  }
  return result
}

const DIFF_BG: Record<DiffLine['type'], string> = {
  same: 'transparent',
  added: 'rgba(0,160,60,0.12)',
  removed: 'rgba(180,40,40,0.12)',
}

const DIFF_PREFIX: Record<DiffLine['type'], string> = {
  same: '  ',
  added: '+ ',
  removed: '- ',
}

export default function SnapshotsPanel(): JSX.Element {
  const { currentProject, selectedNodeId } = useAppStore()
  const { setContent } = useEditorStore()
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([])
  const [expandedFilename, setExpandedFilename] = useState<string | null>(null)
  const [diffs, setDiffs] = useState<Record<string, DiffLine[]>>({})
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null)

  const selectedNode =
    selectedNodeId !== null && currentProject !== null
      ? currentProject.nodes[selectedNodeId]
      : null

  useEffect(() => {
    if (currentProject === null || selectedNodeId === null) { setSnapshots([]); return }
    window.api
      .listSnapshots(currentProject.projectDir, selectedNodeId)
      .then(list => setSnapshots([...list].sort((a, b) => b.timestamp.localeCompare(a.timestamp))))
      .catch(() => {})
  }, [selectedNodeId, currentProject])

  const handleNewSnapshot = async () => {
    if (currentProject === null || selectedNodeId === null) return
    const content = useEditorStore.getState().content
    await window.api.createSnapshot(currentProject.projectDir, selectedNodeId, content)
    const updated = await window.api.listSnapshots(currentProject.projectDir, selectedNodeId)
    setSnapshots([...updated].sort((a, b) => b.timestamp.localeCompare(a.timestamp)))
  }

  const handleView = async (snapshot: SnapshotInfo) => {
    if (expandedFilename === snapshot.filename) { setExpandedFilename(null); return }
    if (currentProject === null) return
    const snapshotContent = await window.api.readSnapshot(
      currentProject.projectDir, snapshot.nodeId, snapshot.filename
    )
    const currentContent = useEditorStore.getState().content
    setDiffs(prev => ({ ...prev, [snapshot.filename]: diff(snapshotContent, currentContent) }))
    setExpandedFilename(snapshot.filename)
  }

  const handleRestore = async (snapshot: SnapshotInfo) => {
    if (currentProject === null) return
    const node = currentProject.nodes[snapshot.nodeId]
    if (node === undefined || node.sceneFile === null) return
    await window.api.restoreSnapshot(
      currentProject.projectDir, snapshot.nodeId, node.sceneFile, snapshot.filename
    )
    const newContent = await window.api.readScene(currentProject.projectDir, node.sceneFile)
    setContent(newContent)
    setRestoreMessage('Restored. Previous version saved.')
    setTimeout(() => setRestoreMessage(null), 3000)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  return (
    <aside
      className='flex flex-col h-full shrink-0 border-l'
      style={{
        width: '300px',
        background: 'var(--color-chrome)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className='px-4 py-3 border-b' style={{ borderColor: 'var(--color-border)' }}>
        <div className='flex items-center justify-between gap-2'>
          <div className='min-w-0'>
            <h2 className='text-xs font-ui uppercase tracking-wider text-dim'>Snapshots</h2>
            {selectedNode !== null && (
              <p className='text-sm font-prose text-prose truncate mt-0.5'>{selectedNode.title}</p>
            )}
          </div>
          <button
            className='shrink-0 text-xs font-ui px-2 py-1 rounded border'
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-dim)' }}
            onClick={() => void handleNewSnapshot()}
          >
            New snapshot
          </button>
        </div>
        {restoreMessage !== null && (
          <p className='mt-2 text-xs font-ui' style={{ color: 'var(--color-accent)' }}>
            {restoreMessage}
          </p>
        )}
      </div>
      <div className='flex-1 overflow-y-auto'>
        {snapshots.length === 0 && (
          <p className='px-4 py-8 text-xs font-ui text-center text-dim leading-relaxed'>
            No snapshots yet. The first edit of each day creates one automatically.
          </p>
        )}
        {snapshots.map(snapshot => {
          const lines = diffs[snapshot.filename]
          const isExpanded = expandedFilename === snapshot.filename
          return (
            <div
              key={snapshot.filename}
              className='border-b'
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className='flex items-center gap-2 px-3 py-2'>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-ui text-prose'>{formatDate(snapshot.timestamp)}</p>
                  <p className='text-xs font-ui text-dim'>
                    {snapshot.wordCount.toLocaleString()} words
                  </p>
                </div>
                <button
                  className='text-xs font-ui text-dim hover:text-prose shrink-0'
                  onClick={() => void handleView(snapshot)}
                >
                  {isExpanded ? 'Hide' : 'View'}
                </button>
                <button
                  className='text-xs font-ui text-dim hover:text-prose shrink-0'
                  onClick={() => void handleRestore(snapshot)}
                >
                  Restore
                </button>
              </div>
              {isExpanded && lines !== undefined && (
                <div
                  className='border-t overflow-x-auto'
                  style={{
                    borderColor: 'var(--color-border)',
                    maxHeight: '320px',
                    overflowY: 'auto',
                  }}
                >
                  {lines.slice(0, 80).map((line, idx) => (
                    <div
                      key={idx}
                      className='px-2 py-px text-xs font-mono whitespace-pre'
                      style={{
                        background: DIFF_BG[line.type],
                        color: line.type === 'same' ? 'var(--color-dim)' : 'var(--color-prose)',
                      }}
                    >
                      {DIFF_PREFIX[line.type]}{line.text || ' '}
                    </div>
                  ))}
                  {lines.length > 80 && (
                    <p className='px-2 py-1 text-xs font-ui' style={{ color: 'var(--color-dim)' }}>
                      ...
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
