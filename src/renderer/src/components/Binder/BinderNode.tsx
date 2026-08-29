import type { JSX } from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import useAppStore from '../../store/app-store'
import useEditorStore from '../../store/editor-store'
import { reparentNode, reorderChildren } from '../../store/tree-ops'
import { findStep } from '../../journey/levels'
import type { Language, ProjectNode } from '@shared/types'

const STATUS_COLORS: Record<ProjectNode['status'], string> = {
  idea: '#4A4640',
  draft: 'color-mix(in srgb, var(--color-accent) 50%, transparent)',
  revised: 'color-mix(in srgb, var(--color-accent) 80%, transparent)',
  done: 'var(--color-accent)',
}

const NODE_BORDER: Record<ProjectNode['color'], string> = {
  none: 'transparent', red: '#C0504D', orange: '#E36C09', yellow: '#C0A000',
  green: '#4E9A06', blue: '#3465A4', purple: '#75507B',
}

// ── ContextMenu ──────────────────────────────────────────────────────────────

interface MenuProps {
  x: number; y: number; type: 'scene' | 'folder'; onClose(): void
  onSnapshot(): void; onDuplicate(): void
  onNewScene(): void; onNewFolder(): void; onTrash(): void
}

function ContextMenu(p: MenuProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) p.onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [p.onClose])
  const btn = (label: string, fn: () => void, danger?: boolean) => (
    <button className='w-full text-left text-xs px-3 py-1 block'
      style={{ color: danger ? '#C0504D' : 'var(--color-prose)', background: 'transparent' }}
      onMouseOver={e => { e.currentTarget.style.background = 'var(--color-selection)' }}
      onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
      onClick={() => { fn(); p.onClose() }}
    >{label}</button>
  )
  return (
    <div ref={ref} className='fixed z-50 py-1 rounded' style={{
      left: p.x, top: p.y, background: 'var(--color-chrome)',
      border: '1px solid var(--color-border)', minWidth: 160,
    }}>
      {p.type === 'scene' && btn('New Snapshot', p.onSnapshot)}
      {p.type === 'scene' && btn('Duplicate', p.onDuplicate)}
      {p.type === 'folder' && btn('New Scene Inside', p.onNewScene)}
      {p.type === 'folder' && btn('New Folder Inside', p.onNewFolder)}
      <div style={{ height: 1, background: 'var(--color-border)', margin: '2px 0' }} />
      {btn('Move to Trash', p.onTrash, true)}
    </div>
  )
}

// ── BinderNode ───────────────────────────────────────────────────────────────

export default function BinderNode({ nodeId, depth }: { nodeId: string; depth: number }): JSX.Element | null {
  const { currentProject, selectedNodeId, setSelectedNodeId, updateProjectNodes } = useAppStore()
  const language: Language = useAppStore(s => s.config?.language) ?? 'ro'
  const { setContent } = useEditorStore()
  const [expanded, setExpanded] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const node = currentProject?.nodes[nodeId]
  if (!node || !currentProject) return null
  const { nodes, meta, projectDir } = currentProject
  const isSelected = selectedNodeId === nodeId

  // Path scenes carry their title in the curriculum, so it follows the UI language.
  const journeyStep = node.journeyStepId === null ? undefined : findStep(node.journeyStepId)
  const displayTitle = journeyStep ? journeyStep.title[language] : node.title

  // Stable reference so ContextMenu's useEffect([p.onClose]) doesn't rerun on every
  // parent re-render, which would constantly remove and re-add the mousedown listener.
  const closeMenu = useCallback(() => setMenu(null), [])

  const saveNodes = async (updated: Record<string, ProjectNode>) => {
    updateProjectNodes(updated)
    await window.api.saveProjectTree(projectDir, { meta, nodes: updated, version: 1 })
  }

  const handleClick = async () => {
    setSelectedNodeId(nodeId)
    if (node.type !== 'scene' || !node.sceneFile) return
    const content = await window.api.readScene(projectDir, node.sceneFile)
    const journal = await window.api.readCrashJournal(nodeId)
    if (journal && journal !== content) {
      useAppStore.getState().setPendingCrashRecovery({ nodeId, journalContent: journal, diskContent: content })
    }
    setContent(journal ?? content)
  }

  const startRename = () => {
    setRenameValue(displayTitle); setRenaming(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }
  const commitRename = async () => {
    setRenaming(false)
    const title = renameValue.trim()
    if (title && title !== node.title) await saveNodes({ ...nodes, [nodeId]: { ...node, title } })
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false)
    const draggedId = e.dataTransfer.getData('nodeId')
    if (!draggedId || draggedId === nodeId) return
    if (node.type === 'folder') { await saveNodes(reparentNode(nodes, draggedId, nodeId)); return }
    const pid = node.parentId; if (!pid) return
    const sibs = nodes[pid].children
    const from = sibs.indexOf(draggedId), to = sibs.indexOf(nodeId)
    await saveNodes(from === -1 ? reparentNode(nodes, draggedId, pid, to) : reorderChildren(nodes, pid, from, to))
  }
  const handleDuplicate = async () => {
    if (node.type !== 'scene' || !node.parentId || !node.sceneFile) return
    const newId = uuid(); const title = `${node.title} (copy)`
    const sceneFile = await window.api.createSceneFile(projectDir, newId, title)
    await window.api.writeScene(projectDir, sceneFile, await window.api.readScene(projectDir, node.sceneFile))
    const now = new Date().toISOString(); const parent = nodes[node.parentId]
    const newChildren = [...parent.children]; newChildren.splice(parent.children.indexOf(nodeId) + 1, 0, newId)
    await saveNodes({ ...nodes,
      [newId]: { ...node, id: newId, title, sceneFile, parentId: node.parentId, createdAt: now, updatedAt: now },
      [node.parentId]: { ...parent, children: newChildren },
    })
  }

  const createChildNode = async (type: 'scene' | 'folder') => {
    const newId = uuid(); const now = new Date().toISOString()
    const title = type === 'scene' ? 'Untitled Scene' : 'Untitled Folder'
    const sceneFile = type === 'scene' ? await window.api.createSceneFile(projectDir, newId, title) : null
    await saveNodes({ ...nodes,
      [newId]: { id: newId, type, title, children: [], pov: '', synopsis: '',
        status: 'idea', color: 'none', wordTarget: null, sceneFile, journeyStepId: null,
        parentId: nodeId, createdAt: now, updatedAt: now },
      [nodeId]: { ...node, children: [...node.children, newId] },
    })
    setExpanded(true)
  }

  const handleTrash = async () => {
    if (!node.parentId) return
    const parent = nodes[node.parentId]
    const updated = { ...nodes }; delete updated[nodeId]
    updated[node.parentId] = { ...parent, children: parent.children.filter(id => id !== nodeId) }
    await saveNodes(updated)
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
  }

  return (
    <div>
      <div
        draggable
        onDragStart={e => { e.dataTransfer.setData('nodeId', nodeId); e.dataTransfer.effectAllowed = 'move' }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={handleClick}
        onDoubleClick={startRename}
        onContextMenu={e => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }) }}
        className='flex items-center gap-1 h-7 cursor-default select-none'
        style={{
          paddingLeft: depth * 16 + 8, paddingRight: 8,
          borderLeft: `3px solid ${NODE_BORDER[node.color]}`,
          background: dragOver ? 'var(--color-border)' : isSelected ? 'var(--color-selection)' : 'transparent',
        }}
      >
        {node.type === 'folder'
          ? <span className='text-xs w-3 flex-shrink-0' onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              style={{ color: 'var(--color-dim)', display: 'inline-block',
                transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 100ms' }}
            >▶</span>
          : <span className='w-3 flex-shrink-0' />
        }
        <span className='w-2 h-2 rounded-full flex-shrink-0' style={{ background: STATUS_COLORS[node.status] }} />
        {renaming
          ? <input ref={inputRef} value={renameValue} onChange={e => setRenameValue(e.target.value)}
              onBlur={commitRename} onClick={e => e.stopPropagation()}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
              className='flex-1 text-xs bg-transparent outline-none min-w-0'
              style={{ color: 'var(--color-prose)', boxShadow: '0 0 0 1px var(--color-accent)', borderRadius: 2 }}
            />
          : <span className='flex-1 text-xs truncate min-w-0' style={{ color: 'var(--color-prose)' }}>{displayTitle}</span>
        }
      </div>
      {node.type === 'folder' && expanded && node.children.map(id =>
        <BinderNode key={id} nodeId={id} depth={depth + 1} />
      )}
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} type={node.type} onClose={closeMenu}
          onSnapshot={async () => {
            if (!node.sceneFile) return
            await window.api.createSnapshot(projectDir, nodeId, await window.api.readScene(projectDir, node.sceneFile))
          }}
          onDuplicate={handleDuplicate}
          onNewScene={() => createChildNode('scene')}
          onNewFolder={() => createChildNode('folder')}
          onTrash={handleTrash}
        />
      )}
    </div>
  )
}
