import { useEffect } from 'react'
import useAppStore from '../store/app-store'
import { THEMES } from './themes'

const FONT_FAMILIES: Record<string, string> = {
  'literata': 'Literata, Georgia, serif',
  'eb-garamond': '"EB Garamond", Georgia, serif',
  'crimson-pro': '"Crimson Pro", Georgia, serif',
  'spectral': 'Spectral, Georgia, serif',
  'newsreader': 'Newsreader, Georgia, serif',
  'vollkorn': 'Vollkorn, Georgia, serif',
  'ia-writer-quattro': '"iA Writer Quattro", "JetBrains Mono", monospace',
  'jetbrains-mono': '"JetBrains Mono", monospace',
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const config = useAppStore((state) => state.config)

  useEffect(() => {
    if (config === null) return

    const theme = THEMES[config.theme] ?? THEMES['nocturne']
    const root = document.documentElement

    root.style.setProperty('--color-page', theme.page)
    root.style.setProperty('--color-prose', theme.prose)
    root.style.setProperty('--color-dim', theme.dim)
    root.style.setProperty('--color-chrome', theme.chrome)
    root.style.setProperty('--color-border', theme.border)
    root.style.setProperty('--color-accent', theme.accent)
    root.style.setProperty('--color-selection', theme.selection)

    root.style.setProperty('--font-prose', FONT_FAMILIES[config.font] ?? FONT_FAMILIES['literata'])
    root.style.setProperty('--font-size-prose', config.fontSize + 'px')
    root.style.setProperty('--line-height-prose', String(config.lineHeight))
    root.style.setProperty('--measure-prose', config.measure + 'ch')

    if (theme.isLight) {
      root.classList.add('theme-light')
    } else {
      root.classList.remove('theme-light')
    }
  }, [config])

  return <>{children}</>
}
