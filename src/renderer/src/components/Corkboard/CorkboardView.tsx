import type { JSX } from 'react'
import { useState } from 'react'
import useAppStore from '../../store/app-store'
import useEditorStore from '../../store/editor-store'
import { reorderChildren } from '../../store/tree-ops'
import type { ProjectNode, ProjectFile } from '@shared/types'

const COLOR_STRIPES: Record<ProjectNode['color'], string> = {
  none: 'var(--color-border)', red: '#C0504D', orange: '#E36C09',
  yellow: '#C0A000', green: '#4E9A06', blue: '#3465A4', purple: '#75507B',
}
const STATUS_COLORS: Record<ProjectNode['status'], string> = {
  idea: 'var(--color-dim)', draft: '#888855', revised: '#AAAA55', done: 'var(--color-accent)',
}

export default function CorkboardView(): JSX.Element {
  const { currentProject, selectedNodeId, updateProjectNodes, setSelectedNodeId } = useAppStore()
  const { setContent } = useEditorStore()
  const [drillStack, setDrillStack] = useState<string[]>([])

  if (!currentProject) return <div className='flex-1' />

  const rootId = currentProject.meta.rootNodeId
  const activeFolderId = drillStack.length > 0
    ? drillStack[drillStack.length - 1]
    : (selectedNodeId && currentProject.nodes[selectedNodeId]?.type === 'folder'
        ? selectedNodeId : rootId)
  const activeFolder = currentProject.nodes[activeFolderId]
  if (!activeFolder) return <div className='flex-1' />

  const childIds = activeFolder.children
  const children = childIds.map(id => currentProject.nodes[id]).filter(Boolean)

  const saveTree = async (nodes: Record<string, ProjectNode>) => {
    updateProjectNodes(nodes)
    await window.api.saveProjectTree(currentProject.projectDir, {
      meta: currentProject.meta, nodes, version: 1,
    } as ProjectFile)
  }

  const handleCardClick = async (node: ProjectNode) => {
    if (node.type === 'folder') {
      setDrillStack([...drillStack, node.id])
    } else {
      setSelectedNodeId(node.id)
      if (node.sceneFile) {
        const content = await window.api.readScene(currentProject.projectDir, node.sceneFile)
        setContent(content)
      }
    }
  }

  const handleSynopsisChange = async (nodeId: string, synopsis: string) => {
    const updatedNodes = { ...currentProject.nodes, [nodeId]: { ...currentProject.nodes[nodeId], synopsis } }
    await saveTree(updatedNodes)
  }

  let dragFromIndex = -1

  return (
    <div className='flex-1 overflow-y-auto p-8' style={{ background: 'var(--color-page)' }}>
      {drillStack.length > 0 && (
        <button
          className='mb-4 text-xs px-3 py-1 rounded'
          style={{ color: 'var(--color-dim)', background: 'var(--color-chrome)' }}
          onClick={() => setDrillStack(drillStack.slice(0, -1))}
        >← Back</button>
      )}
      {children.length === 0 && (
        <p style={{ color: 'var(--color-dim)' }} className='text-sm'>
          No scenes yet. Create one in the Binder.
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {children.map((node, index) => (
          <div
            key={node.id}
            draggable
            onDragStart={() => { dragFromIndex = index }}
            onDragOver={e => e.preventDefault()}
            onDrop={async () => {
              if (dragFromIndex === index || dragFromIndex === -1) return
              const updated = reorderChildren(currentProject.nodes, activeFolderId, dragFromIndex, index)
              await saveTree(updated)
              dragFromIndex = -1
            }}
            onClick={() => handleCardClick(node)}
            className='rounded cursor-pointer flex flex-col overflow-hidden'
            style={{
              background: 'var(--color-chrome)',
              border: '1px solid var(--color-border)',
              minHeight: 180,
            }}
          >
            <div style={{ height: 6, background: COLOR_STRIPES[node.color], flexShrink: 0 }} />
            <div className='flex-1 p-3 flex flex-col gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <span className='text-sm font-medium' style={{ color: 'var(--color-prose)', fontFamily: 'var(--font-prose)' }}>
                  {node.title}
                </span>
                <span className='w-2 h-2 rounded-full flex-shrink-0 mt-1'
                  style={{ background: STATUS_COLORS[node.status] }} />
              </div>
              <textarea
                value={node.synopsis}
                placeholder='Synopsis...'
                className='text-xs resize-none flex-1 bg-transparent outline-none'
                style={{ color: 'var(--color-dim)', minHeight: 60 }}
                onClick={e => e.stopPropagation()}
                onChange={e => handleSynopsisChange(node.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
