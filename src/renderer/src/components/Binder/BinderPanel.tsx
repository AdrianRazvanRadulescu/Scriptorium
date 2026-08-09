import type { JSX } from 'react'
import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import useAppStore from '../../store/app-store'
import BinderNode from './BinderNode'
import type { ProjectNode, ProjectFile } from '@shared/types'

export default function BinderPanel(): JSX.Element {
  const { currentProject, selectedNodeId, updateProjectNodes } = useAppStore()
  const [isCreating, setIsCreating] = useState(false)

  if (!currentProject) {
    return (
      <aside
        className='flex items-center justify-center h-full shrink-0'
        style={{ width: 280, background: 'var(--color-chrome)', borderRight: '1px solid var(--color-border)' }}
      >
        <p style={{ color: 'var(--color-dim)', fontSize: 12 }}>Open a project to begin</p>
      </aside>
    )
  }

  const { nodes, meta, projectDir } = currentProject

  const saveTree = async (updated: Record<string, ProjectNode>) => {
    updateProjectNodes(updated)
    const file: ProjectFile = { meta, nodes: updated, version: 1 }
    await window.api.saveProjectTree(projectDir, file)
  }

  const getParentId = (): string => {
    if (selectedNodeId && nodes[selectedNodeId]?.type === 'folder') return selectedNodeId
    if (selectedNodeId) return nodes[selectedNodeId]?.parentId ?? meta.rootNodeId
    return meta.rootNodeId
  }

  const createScene = async () => {
    if (isCreating) return
    setIsCreating(true)
    try {
      const id = uuid()
      const title = 'Untitled Scene'
      const parentId = getParentId()
      const sceneFile = await window.api.createSceneFile(projectDir, id, title)
      const now = new Date().toISOString()
      const newNode: ProjectNode = {
        id, type: 'scene', title, children: [], pov: '', synopsis: '',
        status: 'idea', color: 'none', wordTarget: null, sceneFile, parentId,
        createdAt: now, updatedAt: now,
      }
      const parent = nodes[parentId]
      await saveTree({
        ...nodes,
        [id]: newNode,
        [parentId]: { ...parent, children: [...parent.children, id] },
      })
    } finally {
      setIsCreating(false)
    }
  }

  const createFolder = async () => {
    if (isCreating) return
    setIsCreating(true)
    try {
      const id = uuid()
      const parentId = getParentId()
      const now = new Date().toISOString()
      const newNode: ProjectNode = {
        id, type: 'folder', title: 'Untitled Folder', children: [], pov: '', synopsis: '',
        status: 'idea', color: 'none', wordTarget: null, sceneFile: null, parentId,
        createdAt: now, updatedAt: now,
      }
      const parent = nodes[parentId]
      await saveTree({
        ...nodes,
        [id]: newNode,
        [parentId]: { ...parent, children: [...parent.children, id] },
      })
    } finally {
      setIsCreating(false)
    }
  }

  const rootChildren = nodes[meta.rootNodeId]?.children ?? []

  return (
    <aside
      className='flex flex-col h-full shrink-0 overflow-hidden'
      style={{ width: 280, background: 'var(--color-chrome)', borderRight: '1px solid var(--color-border)' }}
    >
      <div
        className='flex items-center justify-between px-3 py-2 shrink-0'
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <span
          className='text-xs font-medium truncate'
          style={{ color: 'var(--color-dim)' }}
          title={meta.title}
        >
          {meta.title}
        </span>
        <div className='flex gap-1 shrink-0'>
          <button
            onClick={createScene}
            disabled={isCreating}
            className='text-xs px-1.5 py-0.5 rounded'
            style={{ color: 'var(--color-dim)', background: 'transparent' }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--color-prose)' }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--color-dim)' }}
            title='New Scene'
          >
            + Scene
          </button>
          <button
            onClick={createFolder}
            disabled={isCreating}
            className='text-xs px-1.5 py-0.5 rounded'
            style={{ color: 'var(--color-dim)', background: 'transparent' }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--color-prose)' }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--color-dim)' }}
            title='New Folder'
          >
            + Folder
          </button>
        </div>
      </div>
      <div className='flex-1 overflow-y-auto py-1'>
        {rootChildren.map(childId => (
          <BinderNode key={childId} nodeId={childId} depth={0} />
        ))}
      </div>
    </aside>
  )
}
