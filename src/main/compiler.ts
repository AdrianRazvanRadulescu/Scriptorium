import { readProjectFile } from './fs/project-io'
import { readScene, slugifyForFilename } from './fs/scene-file'
import type { CompileOptions, ProjectNode, ProjectFile } from '@shared/types'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import fs from 'node:fs/promises'
import path from 'node:path'

const ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
]

const SPELLED = [
  'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
  'Twenty-One', 'Twenty-Two', 'Twenty-Three', 'Twenty-Four', 'Twenty-Five',
  'Twenty-Six', 'Twenty-Seven', 'Twenty-Eight', 'Twenty-Nine', 'Thirty',
]

function formatChapterNumber(n: number, style: CompileOptions['headingStyle']): string {
  if (style === 'none') return ''
  if (style === 'arabic') return String(n)
  if (style === 'roman') return ROMAN[n - 1] ?? String(n)
  return SPELLED[n - 1] ?? String(n)
}

// Returns the node itself plus all descendants in depth-first order.
// Includes folders (for heading generation) and scenes (for content).
function collectScenes(
  nodes: Record<string, ProjectNode>,
  nodeId: string,
  depth: number,
): Array<{ node: ProjectNode; depth: number }> {
  const node = nodes[nodeId]
  if (!node) return []
  const result: Array<{ node: ProjectNode; depth: number }> = [{ node, depth }]
  for (const childId of node.children) {
    result.push(...collectScenes(nodes, childId, depth + 1))
  }
  return result
}

export async function compileProject(options: CompileOptions): Promise<{ outputPath: string }> {
  const projectFile: ProjectFile = await readProjectFile(options.projectDir)
  const collected = collectScenes(projectFile.nodes, options.rootNodeId, 0)
  const nodes = collected.slice(1) // drop virtual root — its children carry the real structure

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const ext = options.format === 'docx' ? '.docx' : '.md'
  const outputPath = path.join(
    path.dirname(options.projectDir),
    slugifyForFilename(options.title) + '-' + date + ext,
  )

  if (options.format === 'docx') {
    const paragraphs: Paragraph[] = []

    if (options.includeTitlePage) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: options.title })],
      }))
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: options.author })] }))
    }

    let chapterCounter = 0
    let needsSeparator = false

    for (const { node, depth } of nodes) {
      if (node.type === 'folder') {
        chapterCounter++
        const number = formatChapterNumber(chapterCounter, options.headingStyle)
        const headingText = number ? number + ' — ' + node.title : node.title
        const level = depth === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2
        paragraphs.push(new Paragraph({
          heading: level,
          children: [new TextRun({ text: headingText })],
        }))
        needsSeparator = false
      } else if (node.sceneFile) {
        if (needsSeparator) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: options.sceneSeparator })],
          }))
        }
        const content = await readScene(options.projectDir, node.sceneFile)
        for (const line of content.split('\n')) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: line })] }))
        }
        needsSeparator = true
      }
    }

    const doc = new Document({ sections: [{ children: paragraphs }] })
    await fs.writeFile(outputPath, await Packer.toBuffer(doc))
  } else {
    // 'md' and 'pdf' both produce markdown.
    // Full PDF export requires Electron's printToPDF — the caller handles that step.
    const lines: string[] = []

    if (options.includeTitlePage) {
      lines.push('# ' + options.title, '*' + options.author + '*', '', '---', '')
    }

    let chapterCounter = 0
    let needsSeparator = false

    for (const { node, depth } of nodes) {
      if (node.type === 'folder') {
        chapterCounter++
        const number = formatChapterNumber(chapterCounter, options.headingStyle)
        const headingText = number ? number + ' — ' + node.title : node.title
        if (options.includePartTitlePages && depth === 1) {
          lines.push('', '---', '')
        }
        lines.push('#'.repeat(depth) + ' ' + headingText, '')
        needsSeparator = false
      } else if (node.sceneFile) {
        if (needsSeparator) {
          lines.push('', options.sceneSeparator, '')
        }
        const content = await readScene(options.projectDir, node.sceneFile)
        lines.push(content.trim())
        needsSeparator = true
      }
    }

    await fs.writeFile(outputPath, lines.join('\n'), 'utf-8')
  }

  return { outputPath }
}
