import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type Database from 'better-sqlite3'
import Sqlite from 'better-sqlite3'
import { openIndex, upsertDocument, searchIndex } from '../../src/main/db/search-index'

// better-sqlite3 is rebuilt for Electron's ABI, so plain Node cannot always load it.
// Run with ELECTRON_RUN_AS_NODE=1 electron node_modules/vitest/vitest.mjs run to force this suite.
function canLoadNativeSqlite(): boolean {
  try {
    new Sqlite(':memory:').close()
    return true
  } catch {
    return false
  }
}

let libraryRoot: string
let db: Database.Database

function addScene(nodeId: string, projectId: string, content: string, status: string) {
  upsertDocument(db, {
    projectId,
    projectDir: `/library/${projectId}`,
    nodeId,
    nodeTitle: `Scene ${nodeId}`,
    content,
    status,
    pov: 'Anna',
  })
}

beforeEach(() => {
  libraryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'scriptorium-search-'))
  fs.mkdirSync(path.join(libraryRoot, '.index'))
  db = openIndex(libraryRoot)
  addScene('n1', 'p1', 'The lighthouse keeper climbed the stairs.', 'draft')
  addScene('n2', 'p1', 'Nothing about the sea here.', 'final')
  addScene('n3', 'p2', 'Another lighthouse, another project.', 'draft')
})

afterEach(() => {
  db.close()
  fs.rmSync(libraryRoot, { recursive: true, force: true })
})

describe.skipIf(!canLoadNativeSqlite())('searchIndex', () => {
  it('finds scenes across projects and highlights the match', () => {
    const hits = searchIndex(db, { text: 'lighthouse' })
    expect(hits.map((hit) => hit.nodeId).sort()).toEqual(['n1', 'n3'])
    const hit = hits.find((candidate) => candidate.nodeId === 'n1')!
    expect(hit.context.substr(hit.matchStart, hit.matchLength)).toBe('lighthouse')
  })

  it('filters by project and status', () => {
    expect(searchIndex(db, { text: 'lighthouse', projectId: 'p2' }).map((hit) => hit.nodeId)).toEqual(['n3'])
    expect(searchIndex(db, { text: 'sea', status: 'final' }).map((hit) => hit.nodeId)).toEqual(['n2'])
    expect(searchIndex(db, { text: 'sea', status: 'draft' })).toEqual([])
  })
})
