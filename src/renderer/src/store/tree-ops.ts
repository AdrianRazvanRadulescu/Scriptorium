import type { ProjectNode } from '@shared/types'

export function reorderChildren(
  nodes: Record<string, ProjectNode>,
  parentId: string,
  fromIndex: number,
  toIndex: number
): Record<string, ProjectNode> {
  const parent = nodes[parentId]
  const children = [...parent.children]
  const [moved] = children.splice(fromIndex, 1)
  children.splice(toIndex, 0, moved)
  return { ...nodes, [parentId]: { ...parent, children } }
}

export function collectSubtreeIds(
  nodes: Record<string, ProjectNode>,
  nodeId: string
): string[] {
  const ids: string[] = [nodeId]
  const node = nodes[nodeId]
  for (const childId of node.children) {
    ids.push(...collectSubtreeIds(nodes, childId))
  }
  return ids
}

export function reparentNode(
  nodes: Record<string, ProjectNode>,
  nodeId: string,
  newParentId: string,
  insertAtIndex?: number
): Record<string, ProjectNode> {
  const subtreeIds = collectSubtreeIds(nodes, nodeId)
  if (subtreeIds.includes(newParentId)) {
    return nodes
  }

  const node = nodes[nodeId]
  const oldParentId = node.parentId

  let result = { ...nodes }

  if (oldParentId !== null) {
    const oldParent = result[oldParentId]
    result = {
      ...result,
      [oldParentId]: {
        ...oldParent,
        children: oldParent.children.filter((id) => id !== nodeId),
      },
    }
  }

  const newParent = result[newParentId]
  const newChildren = [...newParent.children]
  if (insertAtIndex === undefined) {
    newChildren.push(nodeId)
  } else {
    newChildren.splice(insertAtIndex, 0, nodeId)
  }

  result = {
    ...result,
    [newParentId]: { ...newParent, children: newChildren },
    [nodeId]: { ...result[nodeId], parentId: newParentId },
  }

  return result
}

export function getAncestors(
  nodes: Record<string, ProjectNode>,
  nodeId: string
): string[] {
  const ancestors: string[] = []
  let current = nodes[nodeId]

  while (current.parentId !== null) {
    ancestors.push(current.parentId)
    current = nodes[current.parentId]
  }

  return ancestors
}

export function countWordsInSubtree(
  nodes: Record<string, ProjectNode>,
  nodeId: string,
  wordCounts: Record<string, number>
): number {
  const node = nodes[nodeId]
  let total = 0

  if (node.type === 'scene') {
    total += wordCounts[nodeId] ?? 0
  }

  for (const childId of node.children) {
    total += countWordsInSubtree(nodes, childId, wordCounts)
  }

  return total
}
