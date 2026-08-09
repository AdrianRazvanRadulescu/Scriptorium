# Scriptorium

A calm local writing app for short stories and novels. Scrivener's structure, iA Writer's calm. Runs entirely offline, forever.

## Running in development

```
npm install
npm run dev
```

## Building the installer

```
npm run dist
```

Produces `dist-installer/Scriptorium Setup.exe`.

## Where your files live

| What | Where | Why |
|------|-------|-----|
| Library (projects, scenes) | `D:\Scriptorium\` (default) | Configurable in `%APPDATA%\scriptorium\config.json` |
| Backups | `C:\Scriptorium-Backups\` | Different volume — one dead disk should not take both |
| App config | `%APPDATA%\scriptorium\config.json` | Theme, font, library path |
| Crash journals | `%APPDATA%\scriptorium\crash-journals\` | Autosaved buffer state |

## Your prose is plain Markdown

Every scene is a `.md` file containing only your prose — no frontmatter, no metadata. Open any file in Notepad and find nothing but your words. The hierarchy lives in `project.json`, not in filenames.

## Theme JSON schema

Each file in `themes/` defines one theme. Copy any file, change the `id`, and restart.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Identifier used in config |
| name | string | Display name |
| page | hex | Editor/page background |
| prose | hex | Body text color |
| dim | hex | Muted text and icons |
| chrome | hex | Sidebar and panel backgrounds |
| border | hex | Subtle dividers |
| accent | hex | Caret, progress bars, selection |
| selection | hex | Text selection background |
| isLight | boolean | true for light themes |

## Manual backup and restore

**Backup**: Copy `D:\Scriptorium` to any other drive.  
**Restore**: Replace `D:\Scriptorium` with the backup copy.  
The app stores nothing besides `D:\Scriptorium` and `%APPDATA%\scriptorium\config.json`.

## Adding iA Writer Quattro

1. Download from https://github.com/iaolo/iA-Fonts (OFL-1.1 license)
2. Copy `iA Writer Quattro S Regular.ttf` and italic/bold variants to `fonts/`
3. The app will use them automatically (falls back to JetBrains Mono if absent)

## Running tests

```
npm test              # Vitest unit tests
npm run test:e2e      # Playwright e2e tests
```

## The C: backup / D: library split

This is intentional. A single disk failure taking both your originals and your backups is the only truly unrecoverable scenario. The app defaults to `D:\` for the library and `C:\` for backups so a single drive failure leaves the other intact.
