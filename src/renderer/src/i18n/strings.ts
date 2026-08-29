import useAppStore from '../store/app-store'
import type { Language } from '@shared/types'

const en = {
  // Status bar
  words: 'words',
  thisSession: 'this session',
  today: 'today',
  total: 'total',
  saved: 'Saved',
  saving: 'Saving…',
  unsaved: 'Unsaved',
  errorSaving: 'Error saving',

  // Node statuses
  status_idea: 'idea',
  status_draft: 'draft',
  status_revised: 'revised',
  status_done: 'done',

  // Toolbar
  corkboard: 'Corkboard',
  outline: 'Outline',
  journey: 'Path',
  search: 'Search',
  snapshots: 'Snapshots',
  bible: 'Bible',
  compile: 'Compile',
  fullscreen: 'Fullscreen',
  binder: 'Binder',

  // Welcome screen
  newProject: 'New project',
  projectTitle: 'Project title',
  create: 'Create',
  creating: 'Creating…',
  cancel: 'Cancel',
  firstProjectHint: 'Create your first project to begin.',

  // Settings
  settings: 'Settings',
  theme: 'THEME',
  font: 'Font',
  fontSize: 'Font size',
  lineHeight: 'Line height',
  lineWidth: 'Line width',
  fullWidth: 'Full',
  editor: 'EDITOR',
  smartTypography: 'Smart typography',
  typewriterScrolling: 'Typewriter scrolling',
  focusMode: 'Focus mode',
  language: 'LANGUAGE',
  languageName: 'Language',
  library: 'LIBRARY',
  projectsFolder: 'Projects folder',
  backupsFolder: 'Backups folder',
  change: 'Change…',

  // Journey panel
  journeyTitle: 'THE PATH',
  journeyProgress: 'of',
  journeyLevels: 'levels',
  journeyNext: 'Next',
  journeyOnTrack: 'You are on the road.',
  journeyMarkDone: 'Mark as done',
  journeyUndoHint: 'Click to mark as not done',
  journeyLast14: 'LAST 14 DAYS',
  journeyWordsToday: 'today',
}

const ro: typeof en = {
  words: 'cuvinte',
  thisSession: 'in sesiune',
  today: 'azi',
  total: 'total',
  saved: 'Salvat',
  saving: 'Se salveaza…',
  unsaved: 'Nesalvat',
  errorSaving: 'Eroare la salvare',

  status_idea: 'idee',
  status_draft: 'ciorna',
  status_revised: 'revizuit',
  status_done: 'terminat',

  corkboard: 'Panou',
  outline: 'Schita',
  journey: 'Drumul',
  search: 'Cauta',
  snapshots: 'Versiuni',
  bible: 'Biblie',
  compile: 'Export',
  fullscreen: 'Tot ecranul',
  binder: 'Biblioraft',

  newProject: 'Proiect nou',
  projectTitle: 'Titlul proiectului',
  create: 'Creeaza',
  creating: 'Se creeaza…',
  cancel: 'Renunta',
  firstProjectHint: 'Creeaza primul proiect ca sa incepi.',

  settings: 'Setari',
  theme: 'TEMA',
  font: 'Font',
  fontSize: 'Marime font',
  lineHeight: 'Inaltime rand',
  lineWidth: 'Latime rand',
  fullWidth: 'Plina',
  editor: 'EDITOR',
  smartTypography: 'Tipografie inteligenta',
  typewriterScrolling: 'Derulare masina de scris',
  focusMode: 'Mod concentrare',
  language: 'LIMBA',
  languageName: 'Limba',
  library: 'BIBLIOTECA',
  projectsFolder: 'Folder proiecte',
  backupsFolder: 'Folder backupuri',
  change: 'Schimba…',

  journeyTitle: 'DRUMUL',
  journeyProgress: 'din',
  journeyLevels: 'niveluri',
  journeyNext: 'Urmeaza',
  journeyOnTrack: 'Esti pe drum.',
  journeyMarkDone: 'Marcheaza terminat',
  journeyUndoHint: 'Click pentru a marca ne-terminat',
  journeyLast14: 'ULTIMELE 14 ZILE',
  journeyWordsToday: 'azi',
}

const STRINGS: Record<Language, typeof en> = { en, ro }

export type StringKey = keyof typeof en

export function useT(): (key: StringKey) => string {
  const languageFromConfig = useAppStore(s => s.config?.language)
  const language: Language = languageFromConfig ?? 'ro'
  return (key) => STRINGS[language][key]
}
