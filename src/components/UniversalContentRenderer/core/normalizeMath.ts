/**
 * Language models emit maths in delimiters markdown does not recognise, and the
 * failure is silent: the LaTeX leaks into the page as prose. Two forms account
 * for almost all of it.
 *
 *   \[ ... \] and \( ... \)   LaTeX's own delimiters
 *   $ ... $ spanning lines    inline maths can never contain a newline, so a
 *                             multi-line span was always meant to be display
 *
 * Both are rewritten to the `$$`/`$` forms remark-math understands. Only
 * balanced pairs are touched, so a half-streamed expression is left alone until
 * its closing delimiter arrives.
 */

const FENCE = /^[ \t]{0,3}(`{3,}|~{3,})(.*)$/
const INLINE_CODE = /(`+)[\s\S]*?\1/g
const LATEX_DISPLAY = /\\\[([\s\S]*?)\\\]/g
const LATEX_INLINE = /\\\(([\s\S]*?)\\\)/g
const DOLLAR_SPAN = /(?<![\\$])\$(?!\$)((?:\\.|[^$])*?)(?<!\\)\$(?!\$)/g

/**
 * Character ranges holding fenced code, which must be copied through verbatim —
 * a fenced example of `\(x\)` is documentation, not maths. An unterminated fence
 * protects everything to the end of the input, which is the normal state of
 * affairs while a response is still streaming.
 */
function fencedRegions(content: string): Array<[number, number]> {
  const regions: Array<[number, number]> = []
  let open: { start: number; marker: string; length: number } | undefined
  let offset = 0

  for (const line of content.split('\n')) {
    const match = FENCE.exec(line)
    if (match) {
      const [, marker, rest] = match
      if (!open) {
        open = { start: offset, marker: marker[0], length: marker.length }
      } else if (
        marker[0] === open.marker &&
        marker.length >= open.length &&
        rest.trim() === ''
      ) {
        regions.push([open.start, offset + line.length])
        open = undefined
      }
    }
    offset += line.length + 1
  }

  if (open) regions.push([open.start, content.length])
  return regions
}

function rewriteDelimiters(text: string): string {
  return text
    .replace(LATEX_DISPLAY, (_match, body: string) => displayBlock(body))
    .replace(LATEX_INLINE, (_match, body: string) => `$${body.trim()}$`)
    .replace(DOLLAR_SPAN, (match: string, body: string) =>
      // A dollar span is rescued only when it looks like maths meant to be a
      // display block, never when it is prose about money.
      body.includes('\n') && body.includes('\\') ? displayBlock(body) : match,
    )
}

function displayBlock(body: string): string {
  return `\n\n$$\n${body.trim()}\n$$\n\n`
}

/** Applies the rewrites to prose, skipping inline code spans. */
function rewriteProse(text: string): string {
  let result = ''
  let cursor = 0

  for (const code of text.matchAll(INLINE_CODE)) {
    result += rewriteDelimiters(text.slice(cursor, code.index)) + code[0]
    cursor = code.index + code[0].length
  }

  return result + rewriteDelimiters(text.slice(cursor))
}

export function normalizeMath(content: string): string {
  if (!content.includes('\\')) return content

  let result = ''
  let cursor = 0

  for (const [start, end] of fencedRegions(content)) {
    result += rewriteProse(content.slice(cursor, start)) + content.slice(start, end)
    cursor = end
  }

  return result + rewriteProse(content.slice(cursor))
}
