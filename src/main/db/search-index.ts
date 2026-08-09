import Database from 'better-sqlite3'
import path from 'node:path'
import type { SearchQuery, SearchHit } from '@shared/types'
import { readProjectFile, listProjects } from '../fs/project-io'
import { readScene } from '../fs/scene-file'

interface SceneRow {
  project_id: string
  project_dir: string
  node_id: string
  node_title: string
  ctx: string
}

export function openIndex(libraryRoot: string): Database.Database {
  const indexDir = path.join(libraryRoot, '.index')
  // Caller must mkdir(indexDir) before this — can't do async mkdir in a sync function.
  const db = new Database(path.join(indexDir, 'search.db'))
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS scenes USING fts5(
      project_id UNINDEXED,
      project_dir UNINDEXED,
      node_id UNINDEXED,
      node_title,
      content,
      tokenize = 'porter ascii'
    );
    CREATE TABLE IF NOT EXISTS scene_meta (
      project_id TEXT,
      node_id TEXT,
      status TEXT,
      pov TEXT,
      PRIMARY KEY (project_id, node_id)
    );
  `)
  return db
}

export function upsertDocument(
  db: Database.Database,
  doc: {
    projectId: string
    projectDir: string
    nodeId: string
    nodeTitle: string
    content: string
    status: string
    pov: string
  },
): void {
  const runTransaction = db.transaction(() => {
    db.prepare('DELETE FROM scenes WHERE project_id = ? AND node_id = ?')
      .run(doc.projectId, doc.nodeId)
    db.prepare('DELETE FROM scene_meta WHERE project_id = ? AND node_id = ?')
      .run(doc.projectId, doc.nodeId)
    db.prepare(
      'INSERT INTO scenes(project_id, project_dir, node_id, node_title, content) VALUES(?,?,?,?,?)',
    ).run(doc.projectId, doc.projectDir, doc.nodeId, doc.nodeTitle, doc.content)
    db.prepare('INSERT INTO scene_meta(project_id, node_id, status, pov) VALUES(?,?,?,?)')
      .run(doc.projectId, doc.nodeId, doc.status, doc.pov)
  })
  runTransaction()
}

export function deleteDocument(
  db: Database.Database,
  projectId: string,
  nodeId: string,
): void {
  db.prepare('DELETE FROM scenes WHERE project_id = ? AND node_id = ?').run(projectId, nodeId)
  db.prepare('DELETE FROM scene_meta WHERE project_id = ? AND node_id = ?').run(projectId, nodeId)
}

export function searchIndex(db: Database.Database, query: SearchQuery): SearchHit[] {
  const escapedText = '"' + query.text.replace(/"/g, '') + '"'

  let sql = `
    SELECT s.project_id, s.project_dir, s.node_id, s.node_title,
           snippet(s, 4, '<m>', '</m>', '...', 20) AS ctx
    FROM scenes s
    JOIN scene_meta m ON m.project_id = s.project_id AND m.node_id = s.node_id
    WHERE s MATCH ?
  `
  const params: string[] = [escapedText]

  if (query.projectId) {
    sql += ' AND s.project_id = ?'
    params.push(query.projectId)
  }
  if (query.status) {
    sql += ' AND m.status = ?'
    params.push(query.status)
  }
  if (query.pov) {
    sql += ' AND m.pov = ?'
    params.push(query.pov)
  }
  sql += ' LIMIT 50'

  const rows = db.prepare(sql).all(...params) as SceneRow[]

  return rows.map((row) => {
    const openPos = row.ctx.indexOf('<m>')
    const closePos = row.ctx.indexOf('</m>')
    const matchStart = openPos === -1 ? 0 : openPos
    const matchLength = openPos === -1 || closePos === -1 ? 0 : closePos - openPos - 3
    const context = row.ctx.replace('<m>', '').replace('</m>', '')
    return {
      projectId: row.project_id,
      projectDir: row.project_dir,
      nodeId: row.node_id,
      nodeTitle: row.node_title,
      context,
      matchStart,
      matchLength,
    }
  })
}

export async function rebuildIndex(libraryRoot: string, db: Database.Database): Promise<void> {
  db.exec('DELETE FROM scenes; DELETE FROM scene_meta;')
  const projects = await listProjects(libraryRoot)
  for (const summary of projects) {
    const projectFile = await readProjectFile(summary.dir)
    for (const node of Object.values(projectFile.nodes)) {
      if (node.type !== 'scene' || !node.sceneFile) continue
      const content = await readScene(summary.dir, node.sceneFile)
      upsertDocument(db, {
        projectId: summary.id,
        projectDir: summary.dir,
        nodeId: node.id,
        nodeTitle: node.title,
        content,
        status: node.status,
        pov: node.pov,
      })
    }
  }
}
