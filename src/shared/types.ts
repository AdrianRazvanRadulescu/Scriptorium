export type NodeType = 'folder' | 'scene'
export type NodeStatus = 'idea' | 'draft' | 'revised' | 'done'
export type NodeColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'

// One node in the project tree — either a container (folder) or a leaf (scene).
// Hierarchy lives here, NOT in the filename. Moving a node is a JSON update.
export interface ProjectNode {
  id: string
  type: NodeType
  title: string
  children: string[] // ordered list of child IDs; always empty for scenes
  parentId: string | null // null only for the virtual root
  status: NodeStatus
  color: NodeColor
  pov: string // free-text character name
  synopsis: string // shown on corkboard cards
  wordTarget: number | null
  sceneFile: string | null // e.g. "scenes/abc123-my-scene.md" (relative to projectDir)
  // Set only on scenes seeded from the Path. Their title and brief come from the
  // curriculum in the current language instead of this node's fixed title.
  journeyStepId: string | null
  createdAt: string // ISO 8601
  updatedAt: string
}

export interface ProjectMeta {
  id: string
  title: string
  rootNodeId: string // the virtual root folder's ID
  wordTarget: number | null
  sessionTarget: number | null
  author: string
  createdAt: string
  updatedAt: string
}

// The exact shape written to project.json on disk
export interface ProjectFile {
  meta: ProjectMeta
  nodes: Record<string, ProjectNode>
  version: 1
}

// What lives in memory after a project is opened
export interface LoadedProject {
  projectDir: string // absolute path
  meta: ProjectMeta
  nodes: Record<string, ProjectNode>
}

export type Language = 'en' | 'ro'

export interface AppConfig {
  libraryRoot: string // default: D:\Scriptorium
  backupRoot: string // default: C:\Scriptorium-Backups
  theme: string // theme ID, e.g. "nocturne"
  font: string // font ID, e.g. "literata"
  fontSize: number // 13–28
  lineHeight: number // 1.4–2.0
  measure: number // ch units; >=300 means full width
  smartTypography: boolean
  focusMode: boolean
  typewriterScrolling: boolean
  lastOpenProjectId: string | null
  language: Language
}

// Journey progress: levelId -> ISO date when the level was marked done
export interface JourneyState {
  completed: Record<string, string>
}

export interface SnapshotInfo {
  nodeId: string
  filename: string // e.g. "2026-08-09T14-32-11.md"
  timestamp: string // ISO 8601
  wordCount: number
}

export interface SearchHit {
  projectId: string
  projectDir: string
  nodeId: string
  nodeTitle: string
  context: string // ~120 chars around the match
  matchStart: number // char offset within context
  matchLength: number
}

export interface SearchQuery {
  text: string
  projectId?: string
  status?: NodeStatus
  pov?: string
}

export interface CompileOptions {
  rootNodeId: string
  projectDir: string
  format: 'md' | 'docx' | 'pdf'
  headingStyle: 'none' | 'arabic' | 'roman' | 'spelled'
  includePartTitlePages: boolean
  sceneSeparator: string // e.g. "* * *"
  includeTitlePage: boolean
  title: string
  author: string
}

export interface IntegrityReport {
  orphanedFiles: string[] // files on disk not referenced in project.json
  missingFiles: string[] // nodes in project.json with no file on disk
}

export interface ProjectSummary {
  id: string
  title: string
  dir: string
  updatedAt: string
}

export interface TrashEntry {
  name: string // original project folder name + timestamp suffix
  trashedAt: string // ISO 8601
}

export interface ThemeDefinition {
  id: string
  name: string
  page: string // CSS color
  prose: string
  dim: string
  chrome: string
  border: string
  accent: string
  selection: string
  texture?: string // optional very-low-opacity texture overlay (data URI or path)
  isLight: boolean
}
