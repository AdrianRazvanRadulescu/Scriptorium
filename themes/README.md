# Theme Schema

Each theme is a JSON file with the following 9 fields:

- `id` — unique slug used in AppConfig.theme (e.g. `"nocturne"`); must match the filename
- `name` — human-readable display name shown in the theme picker (e.g. `"Nocturne"`)
- `page` — background color of the writing canvas (the widest surface the author stares at)
- `prose` — primary text color for editor content and labels at full reading contrast
- `dim` — muted text color for secondary UI elements, labels, and placeholder text
- `chrome` — background color for panels, sidebars, and toolbar surfaces flanking the canvas
- `border` — color for all dividing lines, input outlines, and subtle separators
- `accent` — highlight color for interactive elements: buttons, links, selection handles, progress
- `selection` — background fill behind selected text in the editor
- `isLight` — `true` for light themes, `false` for dark; controls icon set and overlay blending

All color values are CSS hex strings. Add an optional `texture` field (data URI) for grain overlays.
