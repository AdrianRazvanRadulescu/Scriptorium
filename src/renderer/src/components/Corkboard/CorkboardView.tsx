import type { JSX } from 'react'
import { useState, useRef } from 'react'
import useAppStore from '../../store/app-store'
import useEditorStore from '../../store/editor-store'
import { reorderChildren, reparentNode } from '../../store/tree-ops'
import { v4 as uuid } from 'uuid'
import type { ProjectNode } from '@shared/types'

const COLOR_STRIPES: Record<ProjectNode['color'], string> = {
  none: 'transparent', red: '#C0504D', orange: '#E36C09',
  yellow: '#C0A000', green: '#4E9A06', blue: '#3465A4', purple: '#75507B',
}

const STATUS_COLORS: Record<ProjectNode['status'], string> = {
  idea: 'var(--color-dim)', draft: '#E8A838', revised: '#5B9BD5', done: '#4CAF50',
}

export default function CorkboardView(): JSX.Element {
  const { currentProject, selectedNodeId, updateProjectNodes, setSelectedNodeId } = useAppStore()
  const { sceneWordCount, setContent } = useEditorStore()
  const [drillStack, setDrillStack] = useState<string[]>([])
  const [dragOverIndex, setDragOverIndex] = useState(-1)
  const dragFromRef = useRef(-1)

  if (!currentProject) return <div className='flex-1' />

  const rootId = currentProject.meta.rootNodeId
  const activeFolderId = drillStack.length > 0
    ? drillStack[drillStack.length - 1]
    : (selectedNodeId && currentProject.nodes[selectedNodeId]?.type === 'folder'
        ? selectedNodeId : rootId)
  const activeFolder = currentProject.nodes[activeFolderId]
  if (!activeFolder) return <div className='flex-1' />

  const children = activeFolder.children.map(id => currentProject.nodes[id]).filter(Boolean)

  const saveTree = async (nodes: Record<string, ProjectNode>) => {
    updateProjectNodes(nodes)
    await window.api.saveProjectTree(currentProject.projectDir, {
      meta: currentProject.meta, nodes, version: 1 as const,
    })
  }

  const handleCardClick = async (node: ProjectNode) => {
    if (node.type === 'folder') {
      setDrillStack([...drillStack, node.id])
      return
    }
    setSelectedNodeId(node.id)
    if (node.sceneFile) {
      const content = await window.api.readScene(currentProject.projectDir, node.sceneFile)
      setContent(content)
    }
  }

  const handleTitleBlur = async (nodeId: string, title: string) => {
    if (title === currentProject.nodes[nodeId].title) return
    const updated = { ...currentProject.nodes, [nodeId]: { ...currentProject.nodes[nodeId], title, updatedAt: new Date().toISOString() } }
    await saveTree(updated)
  }

  const handleSynopsisBlur = async (nodeId: string, synopsis: string) => {
    if (synopsis === currentProject.nodes[nodeId].synopsis) return
    const updated = { ...currentProject.nodes, [nodeId]: { ...currentProject.nodes[nodeId], synopsis, updatedAt: new Date().toISOString() } }
    await saveTree(updated)
  }

  const handleDrop = async (toIndex: number) => {
    const fromIndex = dragFromRef.current
    dragFromRef.current = -1
    setDragOverIndex(-1)
    if (fromIndex === -1 || fromIndex === toIndex) return
    const dragged = children[fromIndex]
    const target = children[toIndex]
    if (target.type === 'folder') {
      await saveTree(reparentNode(currentProject.nodes, dragged.id, target.id))
    } else {
      await saveTree(reorderChildren(currentProject.nodes, activeFolderId, fromIndex, toIndex))
    }
  }

  const addScene = async () => {
    const id = uuid()
    const now = new Date().toISOString()
    const sceneFile = await window.api.createSceneFile(currentProject.projectDir, id, 'Untitled')
    const newNode: ProjectNode = {
      id, type: 'scene', title: 'Untitled', children: [], parentId: activeFolderId,
      status: 'idea', color: 'none', pov: '', synopsis: '', wordTarget: null,
      sceneFile, createdAt: now, updatedAt: now,
    }
    const parent = currentProject.nodes[activeFolderId]
    await saveTree({
      ...currentProject.nodes,
      [id]: newNode,
      [activeFolderId]: { ...parent, children: [...parent.children, id], updatedAt: now },
    })
  }

  return (
    <div className='flex-1 overflow-y-auto p-8' style={{ background: 'var(--color-page)' }}>
      <div className='flex items-center gap-3 mb-6'>
        {drillStack.length > 0 && (
          <button
            onClick={() => setDrillStack(drillStack.slice(0, -1))}
            className='text-xs px-3 py-1 rounded'
            style={{ color: 'var(--color-dim)', background: 'var(--color-chrome)', border: 'none', cursor: 'pointer' }}
          >
            ← Back
          </button>
        )}
        <span className='text-xs' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
          {activeFolder.title}
        </span>
        <button
          onClick={addScene}
          className='text-xs px-2 py-1 rounded ml-auto'
          style={{ color: 'var(--color-accent)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
        >
          + Scene
        </button>
      </div>
      {children.length === 0 ? (
        <p className='text-sm' style={{ color: 'var(--color-dim)' }}>
          No scenes yet. Click + Scene or add one in the Binder.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 220px)', gap: '1.5rem' }}>
          {children.map((node, index) => (
            <div
              key={node.id}
              draggable
              onDragStart={() => { dragFromRef.current = index }}
              onDragOver={e => { e.preventDefault(); setDragOverIndex(index) }}
              onDragLeave={() => setDragOverIndex(-1)}
              onDrop={() => handleDrop(index)}
              onClick={() => handleCardClick(node)}
              className='rounded flex flex-col overflow-hidden'
              style={{
                background: 'var(--color-chrome)',
                border: `1px solid ${dragOverIndex === index ? 'var(--color-accent)' : 'var(--color-border)'}`,
                minHeight: 200, width: 200, cursor: 'default',
              }}
            >
              <div style={{ height: 6, background: COLOR_STRIPES[node.color], flexShrink: 0 }} />
              <div className='flex-1 p-3 flex flex-col gap-2'>
                <div className='flex items-start justify-between gap-2'>
                  <span
                    contentEditable suppressContentEditableWarning
                    onBlur={e => handleTitleBlur(node.id, e.currentTarget.textContent ?? '')}
                    onClick={e => e.stopPropagation()}
                    className='text-sm font-medium outline-none flex-1'
                    style={{ color: 'var(--color-prose)', fontFamily: 'var(--font-prose)' }}
                  >
                    {node.title}
                  </span>
                  <span
                    className='w-2 h-2 rounded-full flex-shrink-0 mt-1'
                    style={{ background: STATUS_COLORS[node.status] }}
                  />
                </div>
                <textarea
                  defaultValue={node.synopsis}
                  placeholder='Synopsis...'
                  className='text-xs resize-none flex-1 outline-none'
                  style={{ color: 'var(--color-dim)', minHeight: 80, background: 'transparent', border: 'none' }}
                  onClick={e => e.stopPropagation()}
                  onBlur={e => handleSynopsisBlur(node.id, e.currentTarget.value)}
                />
              </div>
              {node.type === 'scene' && (
                <div
                  className='px-3 py-1.5'
                  style={{ color: 'var(--color-dim)', fontSize: '0.65rem', borderTop: '1px solid var(--color-border)', fontFamily: 'var(--font-ui)' }}
                >
                  {selectedNodeId === node.id ? `${sceneWordCount} w` : '—'}
                  {node.wordTarget !== null ? ` / ${node.wordTarget}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
