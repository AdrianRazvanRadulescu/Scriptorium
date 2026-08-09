import { type Extension } from '@codemirror/state'
import { EditorView, keymap, type ViewUpdate } from '@codemirror/view'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { markdown, markdownKeymap, markdownLanguage } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

export interface EditorOptions {
  onUpdate: (content: string) => void
  onSave: () => void
  smartTypography: boolean
  focusMode: boolean
  typewriterScrolling: boolean
}

export function buildEditorTheme(): Extension {
  return EditorView.theme(
    {
      // Setting font vars directly here overrides CodeMirror's base theme (which defaults to
      // monospace) without relying on CSS specificity tricks from external stylesheets.
      '&': {
        background: 'transparent',
        height: '100%',
        fontFamily: 'var(--font-prose)',
        fontSize: 'var(--font-size-prose)',
        lineHeight: 'var(--line-height-prose)',
      },
      '.cm-content': { caretColor: 'var(--color-accent)', padding: '0' },
      '.cm-cursor': { borderLeftColor: 'var(--color-accent)', borderLeftWidth: '2px' },
      '.cm-selectionBackground': { background: 'var(--color-selection) !important' },
      '.cm-focused .cm-selectionBackground': { background: 'var(--color-selection) !important' },
      '.cm-line': { padding: '0', color: 'var(--color-prose)' },
      '&.cm-focused': { outline: 'none' },
    },
    { dark: true },
  )
}

export function buildMarkdownHighlight(): Extension {
  // Use class names so editor.css controls all visual properties including
  // theme-aware values like --color-chrome on inline code backgrounds.
  const style = HighlightStyle.define([
    { tag: tags.strong, class: 'cm-bold' },
    { tag: tags.emphasis, class: 'cm-italic' },
    { tag: tags.strikethrough, class: 'cm-strike' },
    { tag: tags.heading1, class: 'cm-heading1' },
    { tag: tags.heading2, class: 'cm-heading2' },
    { tag: tags.heading3, class: 'cm-heading3' },
    { tag: tags.link, class: 'cm-link' },
    { tag: tags.monospace, class: 'cm-code-inline' },
    // Dim Markdown punctuation (*, _, #, etc.) rather than hiding it entirely
    { tag: tags.processingInstruction, opacity: '0.35' },
  ])
  return syntaxHighlighting(style)
}

export function buildSmartTypographyExtension(): Extension {
  return EditorView.inputHandler.of((view, from, to, text) => {
    if (text === '"') {
      const before = view.state.doc.sliceString(Math.max(0, from - 1), from)
      // Opening after whitespace, open brackets, or start of document
      const isOpening = before === '' || /[\s([{]/.test(before)
      view.dispatch({ changes: { from, to, insert: isOpening ? '“' : '”' } })
      return true
    }
    if (text === "'") {
      const before = view.state.doc.sliceString(Math.max(0, from - 1), from)
      // After a word char this is an apostrophe — the closing form ’ is correct
      const isOpening = before === '' || /[\s([{]/.test(before)
      view.dispatch({ changes: { from, to, insert: isOpening ? '‘' : '’' } })
      return true
    }
    if (text === '-') {
      const before = view.state.doc.sliceString(Math.max(0, from - 1), from)
      if (before === '-') {
        view.dispatch({ changes: { from: from - 1, to, insert: '—' } })
        return true
      }
    }
    if (text === '.') {
      const before = view.state.doc.sliceString(Math.max(0, from - 2), from)
      if (before === '..') {
        view.dispatch({ changes: { from: from - 2, to, insert: '…' } })
        return true
      }
    }
    return false
  })
}

export function buildTypewriterScrolling(): Extension {
  return EditorView.updateListener.of((update: ViewUpdate) => {
    if (!update.selectionSet && !update.docChanged) return
    const view = update.view
    const head = update.state.selection.main.head
    // coordsAtPos returns viewport-relative Y, so the scroll delta is:
    //   (lineCenter - viewHeight/2) — positive scrolls down, negative scrolls up
    const coords = view.coordsAtPos(head)
    if (!coords) return
    const lineCenter = (coords.top + coords.bottom) / 2
    const viewHeight = view.dom.clientHeight
    // Defer to avoid forced synchronous layout
    requestAnimationFrame(() => {
      view.scrollDOM.scrollTop += lineCenter - viewHeight / 2
    })
  })
}

export function createEditorExtensions(opts: EditorOptions): Extension[] {
  const exts: Extension[] = [
    history(),
    // @codemirror/language-data is not installed; code blocks render as plain text
    markdown({ base: markdownLanguage }),
    buildEditorTheme(),
    buildMarkdownHighlight(),
    EditorView.lineWrapping,
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      // markdownKeymap includes Ctrl-b/Cmd-b for bold, Ctrl-i/Cmd-i for italic, etc.
      ...markdownKeymap,
      { key: 'Ctrl-s', mac: 'Cmd-s', run: () => { opts.onSave(); return true } },
    ]),
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) opts.onUpdate(update.state.doc.toString())
    }),
  ]

  if (opts.smartTypography) exts.push(buildSmartTypographyExtension())
  if (opts.typewriterScrolling) exts.push(buildTypewriterScrolling())

  return exts
}
