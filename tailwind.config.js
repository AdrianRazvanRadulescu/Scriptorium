/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        prose: ['var(--font-prose)', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        page: 'var(--color-page)',
        prose: 'var(--color-prose)',
        dim: 'var(--color-dim)',
        chrome: 'var(--color-chrome)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        selection: 'var(--color-selection)'
      }
    }
  },
  plugins: []
}
