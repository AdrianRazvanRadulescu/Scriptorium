import { describe, it, expect } from 'vitest'
import { countWords } from '../../src/main/fs/word-count'
import { slugifyForFilename } from '../../src/main/fs/scene-file'
import { reorderChildren, reparentNode, collectSubtreeIds } from '../../src/renderer/src/store/tree-ops'
import type { ProjectNode } from '../../src/shared/types'

function makeNode(
  id: string,
  type: 'folder' | 'scene',
  children: string[],
  parentId: string | null,
): ProjectNode {
  return {
    id,
    type,
    title: id,
    children,
    parentId,
    status: 'draft',
    color: 'none',
    pov: '',
    synopsis: '',
    wordTarget: null,
    sceneFile: type === 'scene' ? 'scenes/' + id + '.md' : null,
    createdAt: '',
    updatedAt: '',
  }
}

describe('countWords', () => {
  it('counts basic words', () => {
    expect(countWords('hello world foo')).toBe(3)
  })

  it('treats em-dash as a word boundary', () => {
    expect(countWords('left—right')).toBe(2)
  })

  it('counts hyphenated words as one token', () => {
    expect(countWords('mother-in-law')).toBe(1)
  })

  it("counts contractions as one word", () => {
    expect(countWords("don't won't it's")).toBe(3)
  })

  it('treats ellipsis as whitespace, not a word', () => {
    expect(countWords('one...two')).toBe(2)
    expect(countWords('one… two')).toBe(2)
  })

  it('handles multiple consecutive spaces', () => {
    expect(countWords('a   b    c')).toBe(3)
  })

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('strips markdown formatting marks before counting', () => {
    expect(countWords('**bold** _italic_ # heading')).toBe(3)
  })
})

describe('slugifyForFilename', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugifyForFilename('Hello World')).toBe('hello-world')
  })

  it('replaces Windows-illegal characters with hyphens', () => {
    // ':' and '<>' become hyphens, which then collapse into a single separator
    expect(slugifyForFilename('Chapter: One')).toBe('chapter-one')
    // All illegal chars produce valid output with no illegal chars in it
    const result = slugifyForFilename('file:name<test>|end')
    expect(result).not.toMatch(/[<>:"/\\|?*]/)
    expect(result.length).toBeGreaterThan(0)
  })

  it('trims result to 40 characters', () => {
    const long = 'a'.repeat(60)
    expect(slugifyForFilename(long).length).toBeLessThanOrEqual(40)
  })

  it('appends -file to reserved Windows name CON', () => {
    expect(slugifyForFilename('CON')).toBe('con-file')
  })

  it('appends -file to reserved Windows name NUL', () => {
    expect(slugifyForFilename('NUL')).toBe('nul-file')
  })

  it('appends -file to reserved Windows name PRN', () => {
    expect(slugifyForFilename('PRN')).toBe('prn-file')
  })
})

describe('reorderChildren', () => {
  it('moves a child from one index to another', () => {
    const nodes = {
      root: makeNode('root', 'folder', ['a', 'b', 'c'], null),
      a: makeNode('a', 'scene', [], 'root'),
      b: makeNode('b', 'scene', [], 'root'),
      c: makeNode('c', 'scene', [], 'root'),
    }
    const result = reorderChildren(nodes, 'root', 0, 2)
    expect(result['root'].children).toEqual(['b', 'c', 'a'])
  })

  it('is a no-op when from and to are the same index', () => {
    const nodes = {
      root: makeNode('root', 'folder', ['a', 'b'], null),
      a: makeNode('a', 'scene', [], 'root'),
      b: makeNode('b', 'scene', [], 'root'),
    }
    const result = reorderChildren(nodes, 'root', 1, 1)
    expect(result['root'].children).toEqual(['a', 'b'])
  })
})

describe('reparentNode', () => {
  it('moves a node to a new parent and updates parentId', () => {
    const nodes = {
      root: makeNode('root', 'folder', ['a', 'b'], null),
      a: makeNode('a', 'folder', ['x'], 'root'),
      b: makeNode('b', 'folder', [], 'root'),
      x: makeNode('x', 'scene', [], 'a'),
    }
    const result = reparentNode(nodes, 'x', 'b')
    expect(result['b'].children).toContain('x')
    expect(result['a'].children).not.toContain('x')
    expect(result['x'].parentId).toBe('b')
  })

  it('refuses to reparent a node into its own subtree', () => {
    const nodes = {
      root: makeNode('root', 'folder', ['a'], null),
      a: makeNode('a', 'folder', ['b'], 'root'),
      b: makeNode('b', 'folder', [], 'a'),
    }
    const result = reparentNode(nodes, 'a', 'b')
    expect(result).toBe(nodes)
  })
})

describe('collectSubtreeIds', () => {
  it('returns only the node itself for a leaf', () => {
    const nodes = {
      root: makeNode('root', 'folder', ['a'], null),
      a: makeNode('a', 'scene', [], 'root'),
    }
    expect(collectSubtreeIds(nodes, 'a')).toEqual(['a'])
  })

  it('returns all descendants in depth-first order', () => {
    const nodes = {
      root: makeNode('root', 'folder', ['a', 'b'], null),
      a: makeNode('a', 'folder', ['c'], 'root'),
      b: makeNode('b', 'scene', [], 'root'),
      c: makeNode('c', 'scene', [], 'a'),
    }
    expect(collectSubtreeIds(nodes, 'root')).toEqual(['root', 'a', 'c', 'b'])
  })
})

describe('promote short story to novel', () => {
  it('wraps tail scenes into a new part folder, preserving all nodes and order', () => {
    let nodes: Record<string, ProjectNode> = {
      root: makeNode('root', 'folder', ['a', 'b', 'c', 'd', 'e'], null),
      a: makeNode('a', 'scene', [], 'root'),
      b: makeNode('b', 'scene', [], 'root'),
      c: makeNode('c', 'scene', [], 'root'),
      d: makeNode('d', 'scene', [], 'root'),
      e: makeNode('e', 'scene', [], 'root'),
    }

    // Add the partTwo folder to the node map and append it to root's children list
    const partTwo = makeNode('partTwo', 'folder', [], 'root')
    nodes = {
      ...nodes,
      partTwo,
      root: { ...nodes['root'], children: ['a', 'b', 'c', 'd', 'e', 'partTwo'] },
    }

    // Move c, d, e into partTwo — reparentNode removes each from root
    nodes = reparentNode(nodes, 'c', 'partTwo')
    nodes = reparentNode(nodes, 'd', 'partTwo')
    nodes = reparentNode(nodes, 'e', 'partTwo')

    // All 5 scenes still exist
    expect(nodes['a']).toBeDefined()
    expect(nodes['b']).toBeDefined()
    expect(nodes['c']).toBeDefined()
    expect(nodes['d']).toBeDefined()
    expect(nodes['e']).toBeDefined()

    // Root contains only the two early scenes and the new part folder
    expect(nodes['root'].children).toEqual(['a', 'b', 'partTwo'])

    // Part folder contains the three wrapped scenes in the original relative order
    expect(nodes['partTwo'].children).toEqual(['c', 'd', 'e'])

    // Every node has the correct parentId
    expect(nodes['a'].parentId).toBe('root')
    expect(nodes['b'].parentId).toBe('root')
    expect(nodes['c'].parentId).toBe('partTwo')
    expect(nodes['d'].parentId).toBe('partTwo')
    expect(nodes['e'].parentId).toBe('partTwo')
  })
})
