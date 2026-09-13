import { Suspense, lazy } from 'react'
import { BlockLoading } from '../core/BlockStatus'
import type { BlockRendererProps } from '../types'

// Mermaid is by far the heaviest dependency here, so it is split out of the
// main bundle and only fetched when a document actually contains a diagram.
const MermaidDiagram = lazy(() =>
  import('./mermaid/MermaidDiagram').then((module) => ({
    default: module.MermaidDiagram,
  })),
)

export function MermaidRenderer(props: BlockRendererProps) {
  return (
    <Suspense fallback={<BlockLoading label="Loading diagram renderer" />}>
      <MermaidDiagram {...props} />
    </Suspense>
  )
}
