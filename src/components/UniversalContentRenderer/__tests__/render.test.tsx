import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { UniversalContentRenderer } from '../UniversalContentRenderer'

function render(content: string) {
  return renderToStaticMarkup(<UniversalContentRenderer content={content} />)
}

describe('markdown', () => {
  it('renders GFM: headings, task lists, strikethrough and tables', () => {
    const html = render(
      ['# Title', '', '- [x] done', '', '~~gone~~', '', '| a | b |', '| - | - |', '| 1 | 2 |'].join('\n'),
    )
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('<del>gone</del>')
    expect(html).toContain('ucr-table-scroll')
  })

  it('keeps tables inside a scroll container so they cannot break the layout', () => {
    expect(render('| a |\n| - |\n| 1 |')).toContain('<div class="ucr-table-scroll"')
  })

  it('marks external links with noopener', () => {
    const html = render('[x](https://example.com)')
    expect(html).toContain('rel="noopener noreferrer"')
  })
})

describe('untrusted content', () => {
  it.each([
    ['<script>alert(1)</script>', '<script'],
    ['<img src=x onerror="alert(1)">', 'onerror'],
    ['<iframe src="https://evil.test"></iframe>', 'evil.test'],
    ['[click](javascript:alert(1))', 'href="javascript:'],
    ['![x](data:text/html;base64,PHN2Zz4=)', 'src="data:'],
    ['<a href="vbscript:msgbox(1)">x</a>', 'vbscript:'],
  ])('strips %s', (content, forbidden) => {
    expect(render(content)).not.toContain(forbidden)
  })

  it('shows a blocked link as inert text rather than dropping the words', () => {
    const html = render('[click me](javascript:alert(1))')
    expect(html).toContain('ucr-blocked-link')
    expect(html).toContain('click me')
  })

  it('rejects an unsafe media URL inside a block', () => {
    expect(render('```video\njavascript:alert(1)\n```')).toContain('ucr-block-error')
  })

  it('builds a YouTube embed from a validated id, never from the raw URL', () => {
    const html = render('```youtube\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\n```')
    expect(html).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })
})

describe('mathematics', () => {
  it('renders inline and display maths with KaTeX', () => {
    const html = render('Inline $e^{i\\pi}$ and:\n\n$$\nx = \\frac{1}{2}\n$$')
    expect(html).toContain('katex')
    expect(html).toContain('katex-display')
  })

  it('rescues LaTeX delimiters a model emits instead of dollars', () => {
    const html = render('The answer is \\[ x = \\frac{1}{2} \\] exactly.')
    expect(html).toContain('katex-display')
    // The delimiters are gone. KaTeX keeps the original TeX in its MathML
    // annotation, which is what makes the maths readable to screen readers.
    expect(html).not.toContain('\\[')
    expect(html).toContain('<annotation encoding="application/x-tex">')
  })

  it('reports an invalid expression without throwing', () => {
    expect(() => render('$$\n\\frac{\n$$')).not.toThrow()
  })
})

describe('blocks', () => {
  it('renders a fenced code block with its language', () => {
    const html = render('```javascript\nconst a = 1\n```')
    expect(html).toContain('language-javascript')
    expect(html).toContain('const a = 1')
  })

  it('falls back to a code block for an unknown type', () => {
    const html = render('```chart\n{"type":"bar"}\n```')
    expect(html).toContain('ucr-code-block')
    expect(html).toContain('{&quot;type&quot;:&quot;bar&quot;}')
  })

  it('renders a video block with controls and no autoplay', () => {
    const html = render('```video\nhttps://example.com/a.mp4\nA caption.\n```')
    expect(html).toContain('<video')
    expect(html).toContain('controls')
    expect(html).not.toContain('autoplay')
    expect(html).toContain('A caption.')
  })

  it('renders an audio block without autoplay', () => {
    const html = render('```audio\nhttps://example.com/a.mp3\n```')
    expect(html).toContain('<audio')
    expect(html).not.toContain('autoplay')
  })

  it('renders a PDF with a download fallback for browsers that cannot inline it', () => {
    const html = render('```pdf\nhttps://example.com/a.pdf\n```')
    expect(html).toContain('ucr-pdf')
    expect(html).toContain('Open the document')
  })

  it('lazy-loads the diagram renderer behind a loading state', () => {
    expect(render('```mermaid\ngraph TD\nA --> B\n```')).toContain('ucr-block-loading')
  })
})

describe('streaming', () => {
  it('shows a placeholder for a block whose fence has not closed', () => {
    const html = render('# Title\n\n```mermaid\ngraph TD\n  A -->')
    expect(html).toContain('ucr-streaming-block')
    expect(html).toContain('<h1>Title</h1>')
  })

  it('renders the block normally once the fence closes', () => {
    const html = render('```mermaid\ngraph TD\n  A --> B\n```\n')
    expect(html).not.toContain('ucr-streaming-block')
  })

  it('never throws on any prefix of a complex document', () => {
    const document = [
      '# Title',
      '',
      'Inline $x^2$ and display:',
      '',
      '$$',
      '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      '$$',
      '',
      '| a | b |',
      '| - | - |',
      '| 1 | 2 |',
      '',
      '```javascript',
      'const a = 1',
      '```',
      '',
      '```mermaid',
      'graph TD',
      '  A --> B',
      '```',
    ].join('\n')

    for (let length = 0; length <= document.length; length++) {
      expect(() => render(document.slice(0, length))).not.toThrow()
    }
  })
})
