import type { JSX } from 'react'
import { useState } from 'react'
import useAppStore from '../../store/app-store'
import useEditorStore from '../../store/editor-store'
import type { ProjectNode, NodeStatus, ProjectFile } from '@shared/types'

const STATUS_COLORS: Record<NodeStatus, string> = {
  idea: '#888888', draft: '#E8A838', revised: '#5B9BD5', done: '#4CAF50',
}

type SortKey = 'title' | 'status' | 'words' | 'target'
type SortDir = 'asc' | 'desc'

function collectFlat(
  nodes: Record<string, ProjectNode>, nodeId: string, depth: number, collapsed: Set<string>
): Array<{ node: ProjectNode; depth: number }> {
  const node = nodes[nodeId]
  if (!node) return []
  const result: Array<{ node: ProjectNode; depth: number }> = depth > 0 ? [{ node, depth }] : []
  if (node.type === 'folder' && !collapsed.has(nodeId)) {
    for (const cid of node.children) result.push(...collectFlat(nodes, cid, depth + 1, collapsed))
  }
  return result
}

export default function OutlineView(): JSX.Element {
  const { currentProject, selectedNodeId, updateProjectNodes, setSelectedNodeId } = useAppStore()
  const { sceneWordCount } = useEditorStore()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [titleFilter, setTitleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<NodeStatus | ''>('')
  const [povFilter, setPovFilter] = useState('')

  if (!currentProject) return <div className='flex-1' />

  const rootId = selectedNodeId && currentProject.nodes[selectedNodeId]?.type === 'folder'
    ? selectedNodeId : currentProject.meta.rootNodeId

  const rows = collectFlat(currentProject.nodes, rootId, 0, collapsed)

  const filtered = rows.filter(({ node }) => {
    if (titleFilter && !node.title.toLowerCase().includes(titleFilter.toLowerCase())) return false
    if (statusFilter && node.status !== statusFilter) return false
    if (povFilter && !node.pov.toLowerCase().includes(povFilter.toLowerCase())) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = 0
    let bv: string | number = 0
    if (sortKey === 'title') { av = a.node.title; bv = b.node.title }
    else if (sortKey === 'status') { av = a.node.status; bv = b.node.status }
    else if (sortKey === 'target') { av = a.node.wordTarget ?? 0; bv = b.node.wordTarget ?? 0 }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const saveTree = async (nodes: Record<string, ProjectNode>) => {
    updateProjectNodes(nodes)
    await window.api.saveProjectTree(currentProject.projectDir, {
      meta: currentProject.meta, nodes, version: 1,
    } as ProjectFile)
  }

  const updateNode = async (nodeId: string, patch: Partial<ProjectNode>) => {
    const updated = { ...currentProject.nodes, [nodeId]: { ...currentProject.nodes[nodeId], ...patch } }
    await saveTree(updated)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const colHead = (key: SortKey, label: string): JSX.Element => (
    <th className='text-left px-3 py-1.5 cursor-pointer font-medium select-none whitespace-nowrap'
      style={{ color: sortKey === key ? 'var(--color-prose)' : 'var(--color-dim)' }}
      onClick={() => handleSort(key)}>
      {label}{sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  )

  const dimCell = 'px-3 py-1'
  const dimStyle = { color: 'var(--color-dim)', fontVariantNumeric: 'tabular-nums' as const }

  return (
    <div className='flex-1 overflow-auto' style={{ background: 'var(--color-page)' }}>
      <div className='flex gap-2 px-3 py-2 sticky top-0 z-10'
        style={{ background: 'var(--color-chrome)', borderBottom: '1px solid var(--color-border)' }}>
        <input placeholder='Filter title...' value={titleFilter}
          onChange={e => setTitleFilter(e.target.value)} className='text-xs px-2 py-1 rounded'
          style={{ background: 'var(--color-page)', color: 'var(--color-prose)', border: '1px solid var(--color-border)', width: 130 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as NodeStatus | '')}
          className='text-xs px-2 py-1 rounded'
          style={{ background: 'var(--color-page)', color: 'var(--color-prose)', border: '1px solid var(--color-border)' }}>
          <option value=''>All statuses</option>
          {(['idea', 'draft', 'revised', 'done'] as NodeStatus[]).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input placeholder='Filter POV...' value={povFilter}
          onChange={e => setPovFilter(e.target.value)} className='text-xs px-2 py-1 rounded'
          style={{ background: 'var(--color-page)', color: 'var(--color-prose)', border: '1px solid var(--color-border)', width: 100 }} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className='w-full text-xs border-collapse'>
          <thead>
            <tr style={{ background: 'var(--color-chrome)', position: 'sticky', top: 36 }}>
              {colHead('title', 'Title')}
              <th className='text-left px-3 py-1.5 font-medium' style={{ color: 'var(--color-dim)' }}>Synopsis</th>
              {colHead('status', 'Status')}
              <th className='text-left px-3 py-1.5 font-medium' style={{ color: 'var(--color-dim)' }}>POV</th>
              {colHead('words', 'Words')}
              {colHead('target', 'Target')}
              <th className='text-left px-3 py-1.5 font-medium' style={{ color: 'var(--color-dim)' }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ node, depth }) => {
              const wordCount = selectedNodeId === node.id && node.type === 'scene' ? sceneWordCount : null
              const progress = node.wordTarget && wordCount !== null
                ? Math.min(1, wordCount / node.wordTarget) : 0
              return (
                <tr key={node.id} className='cursor-pointer'
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ background: node.id === selectedNodeId ? 'var(--color-selection)' : 'transparent' }}>
                  <td className={dimCell} style={{ paddingLeft: depth * 16 + 12, color: 'var(--color-prose)' }}>
                    <div className='flex items-center gap-1'>
                      {node.type === 'folder' && (
                        <span className='cursor-pointer' style={{ color: 'var(--color-dim)' }}
                          onClick={e => {
                            e.stopPropagation()
                            setCollapsed(s => { const n = new Set(s); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n })
                          }}>
                          {collapsed.has(node.id) ? '▶' : '▼'}
                        </span>
                      )}
                      <span contentEditable suppressContentEditableWarning
                        onClick={e => e.stopPropagation()}
                        onBlur={e => updateNode(node.id, { title: e.currentTarget.textContent ?? node.title })}
                        style={{ outline: 'none', minWidth: 60 }}>{node.title}</span>
                    </div>
                  </td>
                  <td className={dimCell}>
                    <span contentEditable suppressContentEditableWarning
                      onClick={e => e.stopPropagation()}
                      onBlur={e => updateNode(node.id, { synopsis: e.currentTarget.textContent ?? node.synopsis })}
                      style={{ outline: 'none', color: 'var(--color-dim)', minWidth: 80, display: 'inline-block', maxWidth: 240 }}>{node.synopsis}</span>
                  </td>
                  <td className={dimCell} onClick={e => e.stopPropagation()}>
                    <select value={node.status}
                      onChange={e => updateNode(node.id, { status: e.target.value as NodeStatus })}
                      style={{ background: 'transparent', border: 'none', outline: 'none',
                        color: STATUS_COLORS[node.status], fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                      {(['idea', 'draft', 'revised', 'done'] as NodeStatus[]).map(s => (
                        <option key={s} value={s} style={{ background: 'var(--color-chrome)', color: 'var(--color-prose)' }}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className={dimCell}>
                    <span contentEditable suppressContentEditableWarning
                      onClick={e => e.stopPropagation()}
                      onBlur={e => updateNode(node.id, { pov: e.currentTarget.textContent ?? node.pov })}
                      style={{ outline: 'none', color: 'var(--color-dim)', minWidth: 40 }}>{node.pov}</span>
                  </td>
                  <td className={dimCell} style={dimStyle}>{wordCount ?? '—'}</td>
                  <td className={dimCell} onClick={e => e.stopPropagation()}>
                    <span
                      contentEditable suppressContentEditableWarning
                      style={{ outline: 'none', color: 'var(--color-dim)', minWidth: 30, display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}
                      onBlur={e => {
                        const val = parseInt(e.currentTarget.textContent ?? '', 10)
                        updateNode(node.id, { wordTarget: isNaN(val) || val <= 0 ? null : val })
                      }}
                    >
                      {node.wordTarget ?? '—'}
                    </span>
                  </td>
                  <td className={dimCell}>
                    <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2, width: 60 }}>
                      <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--color-accent)', borderRadius: 2 }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
