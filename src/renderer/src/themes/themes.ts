import type { ThemeDefinition } from '@shared/types'

const nocturne: ThemeDefinition = {
  id: 'nocturne',
  name: 'Nocturne',
  page: '#12110F',
  prose: '#E8E3D9',
  dim: '#4A4640',
  chrome: '#1C1A17',
  border: '#2A2723',
  accent: '#C0956F',
  selection: '#2A2420',
  isLight: false,
}

const ember: ThemeDefinition = {
  id: 'ember',
  name: 'Ember',
  page: '#0F0E0C',
  prose: '#D9C9A8',
  dim: '#3D3629',
  chrome: '#181610',
  border: '#252319',
  accent: '#B8762A',
  selection: '#2B2112',
  isLight: false,
}

const tidewater: ThemeDefinition = {
  id: 'tidewater',
  name: 'Tidewater',
  page: '#0D1117',
  prose: '#C9D4DC',
  dim: '#3A4550',
  chrome: '#111820',
  border: '#1C2730',
  accent: '#5B9BD5',
  selection: '#162333',
  isLight: false,
}

const vellum: ThemeDefinition = {
  id: 'vellum',
  name: 'Vellum',
  page: '#F5F0E8',
  prose: '#2C2416',
  dim: '#9E9180',
  chrome: '#EDE8DF',
  border: '#D4CBB8',
  accent: '#8B6340',
  selection: '#DDD5C2',
  isLight: true,
}

const foolscap: ThemeDefinition = {
  id: 'foolscap',
  name: 'Foolscap',
  page: '#F8F8F6',
  prose: '#1A1A24',
  dim: '#8080A0',
  chrome: '#F0F0EE',
  border: '#E0E0DC',
  accent: '#3355AA',
  selection: '#DDE4F5',
  isLight: true,
}

const terminal: ThemeDefinition = {
  id: 'terminal',
  name: 'Terminal',
  page: '#0A0F0A',
  prose: '#33FF33',
  dim: '#1A6620',
  chrome: '#080C08',
  border: '#0F200F',
  accent: '#44FF44',
  selection: '#0F300F',
  isLight: false,
}

const sepia: ThemeDefinition = {
  id: 'sepia',
  name: 'Sepia',
  page: '#F4EBD0',
  prose: '#3C2F1A',
  dim: '#9A8672',
  chrome: '#EDE3C5',
  border: '#D6C9A8',
  accent: '#8B5A2B',
  selection: '#D6C9A8',
  isLight: true,
}

const midnight: ThemeDefinition = {
  id: 'midnight',
  name: 'Midnight',
  page: '#07090F',
  prose: '#B4C4D8',
  dim: '#2C3A4A',
  chrome: '#0C1018',
  border: '#151F2D',
  accent: '#4C82B0',
  selection: '#0F1F33',
  isLight: false,
}

const dusk: ThemeDefinition = {
  id: 'dusk',
  name: 'Dusk',
  page: '#12101C',
  prose: '#C4B8D8',
  dim: '#3A3050',
  chrome: '#1A1728',
  border: '#252038',
  accent: '#9B77CC',
  selection: '#201B33',
  isLight: false,
}

const manuscript: ThemeDefinition = {
  id: 'manuscript',
  name: 'Manuscript',
  page: '#FFFFFF',
  prose: '#111111',
  dim: '#888888',
  chrome: '#F4F4F4',
  border: '#E0E0E0',
  accent: '#333333',
  selection: '#E8E8E8',
  isLight: true,
}

export const THEMES: Record<string, ThemeDefinition> = {
  nocturne,
  ember,
  tidewater,
  vellum,
  foolscap,
  terminal,
  sepia,
  midnight,
  dusk,
  manuscript,
}

export const THEME_ORDER = [
  'nocturne', 'ember', 'tidewater', 'midnight', 'dusk',
  'vellum', 'sepia', 'foolscap', 'manuscript', 'terminal',
]
