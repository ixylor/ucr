import { createElement, memo } from 'react'
import type { BlockRenderer, RendererRegistry } from '../types'
import { BlockErrorBoundary } from './BlockErrorBoundary'
import { StreamingBlock } from './StreamingBlock'
import { useIsStreamingBlock } from './streaming'

interface BlockDispatcherProps {
  registry: RendererRegistry
  /** Full fence info string, e.g. `mermaid` or `video poster=...`. */
  info: string
  value: string
  startOffset?: number
}

/**
 * The single place that maps a fence info string to a renderer. The core knows
 * nothing about any concrete content type — it only asks the registry.
 */
function BlockDispatcherImpl({
  registry,
  info,
  value,
  startOffset,
}: BlockDispatcherProps) {
  const [rawType = '', ...metaParts] = info.trim().split(/\s+/)
  const type = rawType.toLowerCase()
  const meta = metaParts.join(' ') || undefined
  const isStreaming = useIsStreamingBlock(startOffset)

  // A block still being streamed is shown as plain text: renderers expect a
  // complete payload and would otherwise error on every intermediate token.
  if (isStreaming && type !== 'code' && registry.has(type)) {
    return <StreamingBlock type={type} value={value} />
  }

  const renderer: BlockRenderer = registry.get(type) ?? registry.get('code')!

  return (
    <BlockErrorBoundary type={type || 'code'} resetKey={value}>
      {createElement(renderer, { type, value, meta })}
    </BlockErrorBoundary>
  )
}

export const BlockDispatcher = memo(BlockDispatcherImpl)
