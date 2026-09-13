import 'katex/dist/katex.min.css'
import './styles.css'

import { memo, useMemo } from 'react'
import Markdown from 'react-markdown'
import { rehypePlugins, remarkPlugins } from './core/markdownPlugins'
import { normalizeMath } from './core/normalizeMath'
import { StreamingFenceContext, openFenceOffset } from './core/streaming'
import { createMarkdownComponents } from './markdown/components'
import { defaultRegistry } from './renderers'
import type { UniversalContentRendererProps } from './types'

const components = createMarkdownComponents(defaultRegistry)

function UniversalContentRendererImpl({ content }: UniversalContentRendererProps) {
  // Both passes are recomputed only when the string changes, so a re-rendering
  // parent does not re-scan a long document.
  const source = useMemo(() => normalizeMath(content), [content])
  const streamingFence = useMemo(() => openFenceOffset(source), [source])

  return (
    <div className="universal-content-renderer">
      <StreamingFenceContext.Provider value={streamingFence}>
        <Markdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {source}
        </Markdown>
      </StreamingFenceContext.Provider>
    </div>
  )
}

export const UniversalContentRenderer = memo(UniversalContentRendererImpl)
