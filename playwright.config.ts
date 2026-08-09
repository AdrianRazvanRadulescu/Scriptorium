import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  use: {
    // Electron is launched in the test fixtures
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'electron',
      testMatch: '**/*.spec.ts'
    }
  ]
})
