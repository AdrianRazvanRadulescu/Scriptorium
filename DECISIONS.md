# Architectural Decisions

1. **Electron + Vite + React + TypeScript** — specified stack. Electron for native OS integration (file system, native menus, system notifications), React for component-based UI, TypeScript for type safety, Vite for fast dev builds.

2. **electron-vite over custom Vite/Webpack** — reduces boilerplate significantly. Handles the main/preload/renderer triple-entry setup out of the box, battle-tested IPC and preload integration, and keeps the build config simple and maintainable.

3. **CodeMirror 6 over ProseMirror/TipTap** — pure JS with no framework coupling (TipTap is React-aware but still adds overhead). Exceptional performance on large documents, built-in Markdown parser, extensible decoration system required for focus mode dimming, and actively maintained.

4. **Zustand over Redux/Context** — minimal API surface, no provider wrapper needed, works outside React (used in autosave timers running in main process context), and devtools are available when needed without extra setup.

5. **SQLite FTS5 for search index** — synchronous main-process API keeps search logic simple, porter stemming built-in, safe to delete and rebuild the index at any time without data loss, and zero configuration. The index is a cache, not the source of truth.

6. **Scene files flat on disk, hierarchy in project.json** — a 300-node novel reorg is a single JSON write, not 300 file renames. This is the key design decision that makes the app scale. Flat files eliminate rename bugs, keep the file system state simple, and make atomic updates tractable.

7. **Atomic write (temp → fsync → rename)** — guaranteed crash-safe. A write is either the old version or the new version; there is no intermediate state where the file is truncated or half-written on power loss or process kill.

8. **No unlink calls on scenes/ ever** — scene files are never deleted from disk through normal app operations. The only `fs.unlink` calls in the codebase are: backup zip pruning in `backup.ts` (only `*.zip` files), and crash journal cleanup in `crash-journal.ts` (only `userData/crash-journals/*.txt`). Scenes removed from a project remain on disk as recoverable orphans.

9. **sandbox:false + contextIsolation:true in BrowserWindow** — `sandbox:false` is required for `better-sqlite3` native module to load in the renderer process. `contextIsolation:true` provides equivalent security isolation for the renderer, keeping the `window` object clean and the preload bridge explicit.

10. **PowerShell Compress-Archive for backups** — zero extra npm dependencies, Windows-native, always available on Windows 11. Known downside: requires PowerShell to be accessible on PATH. Alternative considered was the `archiver` npm package, but it adds a dependency for functionality the OS already provides.

11. **iA Writer Quattro not on npm** — must be downloaded manually from https://github.com/iaolo/iA-Fonts (OFL-1.1 license). The font cannot be redistributed in the repo. Fallback is JetBrains Mono, which is available via `@fontsource/jetbrains-mono`. Documented in README.

12. **@fontsource/* packages** — fonts are downloaded at `npm install` time and bundled into the app build. No network requests at runtime. This satisfies the "no internet required" constraint for a fully offline app.

13. **PDF export deferred** — true PDF generation requires Electron's `webContents.printToPDF()`, which requires a renderer window reference accessible from the main process at export time. The compile endpoint currently outputs `.md`. Adding PDF is a known next step, not an oversight.

14. **No React Router** — state-driven view switching is simpler for a local desktop app with no URL semantics. The app has a small number of views (library, project, editor, settings) that map naturally to Zustand state. Routes add complexity without benefit in a single-window desktop context.

15. **D: library + C: backup split** — intentional single-point-of-failure prevention. If the D: drive fails, backups on C: are untouched, and vice versa. Defaulting to different volumes makes the safety property automatic for most users without requiring manual configuration.

16. **Performance: cold-start < 2s target** — depends on Electron bootstrap which is outside app code control. The measurable parts (JSON parse, scene load, search query) are covered by scale tests. The target is documented as a guideline, not a hard guarantee.
