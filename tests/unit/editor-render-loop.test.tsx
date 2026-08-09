// @vitest-environment jsdom
//
// Regression test: verifies that EditorPane does NOT reload the scene from disk
// when unrelated nodes are edited (e.g. a rename in the Binder). The old code
// depended on the full `currentProject` object in its scene-load effect, which
// changed identity on every updateProjectNodes call and re-triggered the load.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'
import useAppStore from '../../src/renderer/src/store/app-store'
import useEditorStore from '../../src/renderer/src/store/editor-store'
import type { AppConfig, LoadedProject, ProjectNode } from '../../src/shared/types'

// ── CodeMirror mocks ────────────────────────────────────────────────────────
// The real CodeMirror does heavy DOM work that jsdom can't handle. We stub
// just enough for EditorPane to mount and dispatch without crashing.

vi.mock('@codemirror/view', () => {
  const listeners: Array<(update: unknown) => void> = []
  const MockEditorView = vi.fn().mockImplementation(({ parent }: { parent: HTMLElement }) => {
    if (parent) parent.appendChild(document.createElement('div'))
    return {
      state: { doc: { toString: () => '' }, selection: { main: { head: 0 } } },
      dom: { clientHeight: 500 },
      scrollDOM: { scrollTop: 0 },
      coordsAtPos: () => ({ top: 200, bottom: 220 }),
      dispatch: vi.fn(),
      destroy: vi.fn(),
    }
  })
  return {
    EditorView: Object.assign(MockEditorView, {
      theme: () => ({}),
      lineWrapping: {},
      updateListener: { of: (fn: (u: unknown) => void) => { listeners.push(fn); return {} } },
      inputHandler: { of: () => ({}) },
    }),
    keymap: { of: () => ({}) },
  }
})

vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: () => ({
      doc: { toString: () => '', length: 0 },
      selection: { main: { head: 0 } },
    }),
  },
}))

vi.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  historyKeymap: [],
  history: () => ({}),
}))

vi.mock('@codemirror/lang-markdown', () => ({
  markdown: () => ({}),
  markdownKeymap: [],
  markdownLanguage: {},
}))

vi.mock('@codemirror/language', () => ({
  HighlightStyle: { define: () => ({}) },
  syntaxHighlighting: () => ({}),
}))

vi.mock('@lezer/highlight', () => ({
  tags: new Proxy({}, { get: () => 'tag' }),
}))

// ── window.api mock ─────────────────────────────────────────────────────────

const mockReadScene = vi.fn().mockResolvedValue('Hello world')
const mockReadCrashJournal = vi.fn().mockResolvedValue(null)
const mockWriteScene = vi.fn().mockResolvedValue(undefined)
const mockWriteCrashJournal = vi.fn().mockResolvedValue(undefined)

Object.defineProperty(globalThis, 'window', {
  value: {
    api: {
      readScene: mockReadScene,
      readCrashJournal: mockReadCrashJournal,
      writeScene: mockWriteScene,
      writeCrashJournal: mockWriteCrashJournal,
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
  writable: true,
})

// ── helpers ─────────────────────────────────────────────────────────────────

function makeSceneNode(id: string, parentId: string): ProjectNode {
  return {
    id,
    type: 'scene',
    title: 'Scene A',
    children: [],
    parentId,
    status: 'draft',
    color: 'none',
    pov: '',
    synopsis: '',
    wordTarget: null,
    sceneFile: `scenes/${id}.md`,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

function makeProject(): LoadedProject {
  const rootNode: ProjectNode = {
    id: 'root',
    type: 'folder',
    title: 'My Novel',
    children: ['scene-1', 'scene-2'],
    parentId: null,
    status: 'idea',
    color: 'none',
    pov: '',
    synopsis: '',
    wordTarget: null,
    sceneFile: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
  return {
    projectDir: 'D:\\Scriptorium\\my-novel',
    meta: { id: 'proj-1', title: 'My Novel', rootNodeId: 'root', createdAt: '', updatedAt: '' },
    nodes: {
      root: rootNode,
      'scene-1': makeSceneNode('scene-1', 'root'),
      'scene-2': makeSceneNode('scene-2', 'root'),
    },
  }
}

function makeConfig(): AppConfig {
  return {
    libraryRoot: 'D:\\Scriptorium',
    backupRoot: 'C:\\Backup',
    theme: 'dark',
    font: 'spectral',
    fontSize: 18,
    lineHeight: 1.8,
    focusMode: false,
    typewriterScrolling: false,
    smartTypography: false,
  }
}

// ── tests ───────────────────────────────────────────────────────────────────

describe('EditorPane render loop regression', () => {
  beforeEach(() => {
    mockReadScene.mockClear()
    mockReadCrashJournal.mockClear()
    mockWriteScene.mockClear()
    // Reset both stores to initial state
    useAppStore.setState({
      config: null,
      projects: [],
      libraryError: null,
      currentProject: null,
      selectedNodeId: null,
      folderView: 'corkboard',
      isDirty: false,
      saveStatus: 'saved',
      binderOpen: true,
      rightPanel: 'none',
      pendingCrashRecovery: null,
    })
    useEditorStore.setState({
      content: '',
      sceneWordCount: 0,
      sessionWordsAtOpen: 0,
      projectWordCount: 0,
      autosaveTimer: null,
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('loads the scene exactly once when a project and scene are selected', async () => {
    // Dynamically import EditorPane so the mocks above are in place first.
    const { default: EditorPane } = await import(
      '../../src/renderer/src/components/Editor/EditorPane'
    )

    const project = makeProject()
    const config = makeConfig()

    await act(async () => {
      useAppStore.getState().setConfig(config)
      useAppStore.getState().setCurrentProject(project)
      useAppStore.getState().setSelectedNodeId('scene-1')
    })

    render(React.createElement(EditorPane))

    // Give the async load a chance to resolve.
    await act(async () => {
      await new Promise(r => setTimeout(r, 50))
    })

    expect(mockReadScene).toHaveBeenCalledTimes(1)
    expect(mockReadScene).toHaveBeenCalledWith('D:\\Scriptorium\\my-novel', 'scenes/scene-1.md')
  })

  it('does NOT reload the scene when unrelated nodes are edited (anti-regression)', async () => {
    const { default: EditorPane } = await import(
      '../../src/renderer/src/components/Editor/EditorPane'
    )

    const project = makeProject()
    const config = makeConfig()

    await act(async () => {
      useAppStore.getState().setConfig(config)
      useAppStore.getState().setCurrentProject(project)
      useAppStore.getState().setSelectedNodeId('scene-1')
    })

    render(React.createElement(EditorPane))

    // Give the initial load a chance to resolve.
    await act(async () => {
      await new Promise(r => setTimeout(r, 50))
    })

    const callsAfterInitialLoad = mockReadScene.mock.calls.length

    // Simulate 50 node edits (rename scene-2, status changes, etc.).
    // These call updateProjectNodes which previously changed currentProject identity
    // and caused the scene-load effect to retrigger.
    await act(async () => {
      for (let i = 0; i < 50; i++) {
        useAppStore.getState().updateProjectNodes({
          ...project.nodes,
          'scene-2': {
            ...project.nodes['scene-2'],
            title: `Chapter ${i}`,
            updatedAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
          },
        })
      }
      await new Promise(r => setTimeout(r, 50))
    })

    // The scene should NOT have been reloaded — only the initial load counts.
    expect(mockReadScene.mock.calls.length).toBe(callsAfterInitialLoad)
  })

  it('does reload the scene when the selected scene changes', async () => {
    const { default: EditorPane } = await import(
      '../../src/renderer/src/components/Editor/EditorPane'
    )

    const project = makeProject()
    const config = makeConfig()

    await act(async () => {
      useAppStore.getState().setConfig(config)
      useAppStore.getState().setCurrentProject(project)
      useAppStore.getState().setSelectedNodeId('scene-1')
    })

    render(React.createElement(EditorPane))

    await act(async () => {
      await new Promise(r => setTimeout(r, 50))
    })

    // Switch to a different scene.
    await act(async () => {
      useAppStore.getState().setSelectedNodeId('scene-2')
      await new Promise(r => setTimeout(r, 50))
    })

    expect(mockReadScene).toHaveBeenCalledTimes(2)
    expect(mockReadScene).toHaveBeenNthCalledWith(2, 'D:\\Scriptorium\\my-novel', 'scenes/scene-2.md')
  })

  it('does NOT mark the scene as dirty when content is loaded from disk', async () => {
    const { default: EditorPane } = await import(
      '../../src/renderer/src/components/Editor/EditorPane'
    )

    const project = makeProject()
    const config = makeConfig()

    await act(async () => {
      useAppStore.getState().setConfig(config)
      useAppStore.getState().setCurrentProject(project)
      useAppStore.getState().setSelectedNodeId('scene-1')
    })

    render(React.createElement(EditorPane))

    await act(async () => {
      await new Promise(r => setTimeout(r, 50))
    })

    // After loading, the document should be clean — not dirty, not pending save.
    expect(useAppStore.getState().isDirty).toBe(false)
    expect(useAppStore.getState().saveStatus).toBe('saved')
  })
})
