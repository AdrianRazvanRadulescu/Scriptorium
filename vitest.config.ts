import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Default environment for pure-Node unit tests.
    // Individual test files can override with: // @vitest-environment jsdom
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    alias: {
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
})
