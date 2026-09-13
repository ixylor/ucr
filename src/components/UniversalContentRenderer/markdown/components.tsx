import type { Element } from 'hast'
import type { Components } from 'react-markdown'
import { BlockDispatcher } from '../core/BlockDispatcher'
import { ImageRenderer } from '../renderers/ImageRenderer'
import type { RendererRegistry } from '../types'
import { isExternalUrl, safeLinkUrl } from '../utils/url'

function findCodeChild(node: Element | undefined): Element | undefined {
  return node?.children.find(
    (child): child is Element => child.type === 'element' && child.tagName === 'code',
  )
}

function readFenceInfo(code: Element): string {
  const classes = code.properties?.className
  const list = Array.isArray(classes) ? classes.map(String) : []
  const language = list
    .map((name) => /^language-(.+)$/.exec(name)?.[1])
    .find(Boolean)
  const meta = code.properties?.dataMeta
  return [language, typeof meta === 'string' ? meta : undefined]
    .filter(Boolean)
    .join(' ')
}

function readText(code: Element): string {
  return code.children
    .map((child) => (child.type === 'text' ? child.value : ''))
    .join('')
    .replace(/\n$/, '')
}

/**
 * Maps the handful of markdown elements that need behaviour (rather than just
 * styling) onto dedicated components. Everything else stays plain HTML so the
 * host application's stylesheet can reach it.
 */
export function createMarkdownComponents(registry: RendererRegistry): Components {
  return {
    pre({ node, children }) {
      const code = findCodeChild(node)
      if (!code) return <pre className="ucr-code">{children}</pre>

      return (
        <BlockDispatcher
          registry={registry}
          info={readFenceInfo(code)}
          value={readText(code)}
          startOffset={node?.position?.start.offset}
        />
      )
    },

    code({ children }) {
      return <code className="ucr-inline-code">{children}</code>
    },

    img({ src, alt, title }) {
      return (
        <ImageRenderer
          src={typeof src === 'string' ? src : undefined}
          alt={alt}
          title={title}
        />
      )
    },

    a({ href, children, ...rest }) {
      const safeHref = safeLinkUrl(href)
      if (!safeHref) return <span className="ucr-blocked-link">{children}</span>

      const external = isExternalUrl(safeHref)
      return (
        <a
          {...rest}
          href={safeHref}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
      )
    },

    table({ children }) {
      return (
        <div className="ucr-table-scroll" tabIndex={0} role="region" aria-label="Table">
          <table>{children}</table>
        </div>
      )
    },
  }
}
