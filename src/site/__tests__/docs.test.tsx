import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { UniversalContentRenderer } from '../../components/UniversalContentRenderer'
import { docs } from '../docsContent'
import { examples } from '../examples'

/**
 * The documentation and the examples are content strings, so they are exercised
 * the same way a reader exercises them: by rendering them.
 */
function render(content: string) {
  return renderToStaticMarkup(<UniversalContentRenderer content={content} />)
}

describe('documentation page', () => {
  const html = render(docs)

  it('renders without a single failed block', () => {
    expect(html).not.toContain('ucr-block-error')
  })

  it('leaves no fence unclosed', () => {
    expect(html).not.toContain('ucr-streaming-block')
  })

  it('typesets its mathematics', () => {
    expect(html).toContain('katex-display')
  })

  it('shows the fenced block example as text rather than rendering it', () => {
    expect(html).toContain('language-text')
    expect(html).not.toContain('https://example.com/clip.mp4&quot;')
  })
})

describe('examples', () => {
  it.each(examples.map((example) => [example.name, example.content]))(
    'renders %s',
    (name, content) => {
      const html = render(content)
      expect(html.length).toBeGreaterThan(200)
      // "Everything at once" carries a deliberately broken diagram.
      if (name !== 'Everything at once') {
        expect(html).not.toContain('ucr-block-error')
      }
    },
  )
})
