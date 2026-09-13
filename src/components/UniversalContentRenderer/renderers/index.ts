import { createRegistry } from '../core/registry'
import type { BlockRenderer } from '../types'
import { AudioRenderer } from './AudioRenderer'
import { CodeRenderer } from './CodeRenderer'
import { MathRenderer } from './MathRenderer'
import { MermaidRenderer } from './MermaidRenderer'
import { PdfRenderer } from './PdfRenderer'
import { VideoRenderer } from './VideoRenderer'
import { YouTubeRenderer } from './YouTubeRenderer'

/**
 * The built-in block vocabulary. `code` is also the fallback for any fence the
 * registry does not recognise, so unknown block types degrade to source text
 * instead of disappearing.
 */
export const defaultRegistry = createRegistry({
  code: CodeRenderer,
  math: MathRenderer,
  latex: MathRenderer,
  mermaid: MermaidRenderer,
  video: VideoRenderer,
  audio: AudioRenderer,
  pdf: PdfRenderer,
  youtube: YouTubeRenderer,
})

/**
 * Internal for now; this is the seam the future package will expose as
 * `registerRenderer("chart", ChartRenderer)`.
 */
export function registerRenderer(type: string, renderer: BlockRenderer): void {
  defaultRegistry.register(type, renderer)
}
