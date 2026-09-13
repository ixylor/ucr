/**
 * Media blocks take a URL on the first non-empty line and an optional caption on
 * the remaining lines. Keeping the shape uniform means an LLM only has to learn
 * one rule for every media type.
 */
export function parseMediaBlock(value: string): { url: string; caption?: string } {
  const lines = value.split('\n')
  const index = lines.findIndex((line) => line.trim() !== '')
  if (index === -1) return { url: '' }
  const caption = lines.slice(index + 1).join('\n').trim()
  return { url: lines[index].trim(), caption: caption || undefined }
}
