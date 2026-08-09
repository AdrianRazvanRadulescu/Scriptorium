import type { JSX } from 'react'
import { useState } from 'react'
import useAppStore from '../../store/app-store'
import type { ProjectNode, NodeStatus, ProjectFile } from '@shared/types'

const STATUS_LABELS: Record<NodeStatus, string> = {
  idea: 'Idea', draft: 'Draft', revised: 'Revised', done: 'Done',
}
const STATUS_COLORS: Record<NodeStatus, string> = {
  idea: '#888888', draft: '#AAAA44', revised: '#88AA44', done: 'var(--color-accent)',
}

type SortKey = 'title' | 'status' | 'words'
type SortDir = 'asc' | 'desc'

function collectFlat(
  nodes: Record<string, ProjectNode>, nodeId: string, depth: number, collapsed: Set<string>
): Array<{ node: ProjectNode; depth: number }> {
  const node = nodes[nodeId]
  if (!node) return []
  const result: Array<{ node: ProjectNode; depth: number }> = []
  if (depth > 0) result.push({ node, depth })
  if (node.type === 'folder' && !collapsed.has(nodeId)) {
    for (const childId of node.children) result.push(...collectFlat(nodes, childId, depth + 1, collapsed))
  }
  return result
}

export default function OutlineView(): JSX.Element {
  const { currentProject, selectedNodeId, updateProjectNodes, setSelectedNodeId } = useAppStore()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [titleFilter, setTitleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<NodeStatus | ''>('')

  if (!currentProject) return <div className='flex-1' />

  const rootId = selectedNodeId && currentProject.nodes[selectedNodeId]?.type === 'folder'
    ? selectedNodeId : currentProject.meta.rootNodeId

  const rows = collectFlat(currentProject.nodes, rootId, 0, collapsed)

  const filtered = rows.filter(({ node }) => {
    if (titleFilter && !node.title.toLowerCase().includes(titleFilter.toLowerCase())) return false
    if (statusFilter && node.status !== statusFilter) return false
    return true
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

  return (
    <div className='flex-1 overflow-auto' style={{ background: 'var(--color-page)' }}>
      <div className='p-3 flex gap-3' style={{ borderBottom: '1px solid var(--color-border)' }}>
        <input placeholder='Filter title...' value={titleFilter}
          onChange={e => setTitleFilter(e.target.value)}
          className='text-xs px-2 py-1 rounded'
          style={{ background: 'var(--color-chrome)', color: 'var(--color-prose)', border: '1px solid var(--color-border)' }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as NodeStatus | '')}
          className='text-xs px-2 py-1 rounded'
          style={{ background: 'var(--color-chrome)', color: 'var(--color-prose)', border: '1px solid var(--color-border)' }}
        >
          <option value=''>All statuses</option>
          {(['idea', 'draft', 'revised', 'done'] as NodeStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <table className='w-full text-xs border-collapse'>
        <thead>
          <tr style={{ background: 'var(--color-chrome)', position: 'sticky', top: 0 }}>
            {([['title', 'Title'], ['status', 'Status'], ['words', 'Words']] as const).map(([k, label]) => (
              <th key={k} className='text-left px-3 py-1.5 cursor-pointer font-medium'
                style={{ color: sortKey === k ? 'var(--color-prose)' : 'var(--color-dim)' }}
                onClick={() => handleSort(k)}
              >{label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
            ))}
            <th className='text-left px-3 py-1.5 font-medium' style={{ color: 'var(--color-dim)' }}>POV</th>
            <th className='text-left px-3 py-1.5 font-medium' style={{ color: 'var(--color-dim)' }}>Synopsis</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(({ node, depth }) => (
            <tr key={node.id}
              className='cursor-pointer'
              onClick={() => setSelectedNodeId(node.id)}
              style={{ background: node.id === selectedNodeId ? 'var(--color-selection)' : 'transparent' }}
            >
              <td className='px-3 py-1' style={{ paddingLeft: depth * 16 + 12, color: 'var(--color-prose)' }}>
                <div className='flex items-center gap-1'>
                  {node.type === 'folder' && (
                    <span className='cursor-pointer' style={{ color: 'var(--color-dim)' }}
                      onClick={e => {
                        e.stopPropagation()
                        setCollapsed(s => {
                          const next = new Set(s)
                          if (next.has(node.id)) next.delete(node.id)
                          else next.add(node.id)
                          return next
                        })
                      }}
                    >{collapsed.has(node.id) ? '▶' : '▼'}</span>
                  )}
                  <span contentEditable suppressContentEditableWarning
                    onBlur={e => updateNode(node.id, { title: e.currentTarget.textContent ?? node.title })}
                    style={{ outline: 'none', minWidth: 60 }}
                  >{node.title}</span>
                </div>
              </td>
              <td className='px-3 py-1'>
                <span style={{ color: STATUS_COLORS[node.status], fontSize: '0.7rem' }}>
                  {STATUS_LABELS[node.status]}
                </span>
              </td>
              <td className='px-3 py-1' style={{ color: 'var(--color-dim)' }}>—</td>
              <td className='px-3 py-1'>
                <span contentEditable suppressContentEditableWarning
                  style={{ outline: 'none', color: 'var(--color-dim)', minWidth: 40 }}
                  onBlur={e => updateNode(node.id, { pov: e.currentTarget.textContent ?? node.pov })}
                >{node.pov}</span>
              </td>
              <td className='px-3 py-1'>
                <span contentEditable suppressContentEditableWarning
                  style={{ outline: 'none', color: 'var(--color-dim)', minWidth: 80 }}
                  onBlur={e => updateNode(node.id, { synopsis: e.currentTarget.textContent ?? node.synopsis })}
                >{node.synopsis}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
