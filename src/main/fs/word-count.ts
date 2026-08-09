export function countWords(text: string): number {
  let cleaned = text.replace(/[*_#~]/g, '')     // strip Markdown formatting marks
  cleaned = cleaned.replace(/—/g, ' ')           // em-dash is a word boundary
  cleaned = cleaned.replace(/\.{3,}|…/g, ' ')   // ellipsis adds 0 words; treat as space

  const tokens = cleaned.split(/\s+/).filter(token => token.length > 0)
  return Math.max(0, tokens.length)
}
