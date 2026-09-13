import type { ComponentType } from 'react'

/**
 * Props every block renderer receives. Renderers are deliberately given the raw
 * fence body rather than an AST node so that they stay decoupled from the
 * markdown pipeline and can be reused (or replaced) independently.
 */
export interface BlockRendererProps {
  /** Raw text inside the fenced block, with surrounding blank lines trimmed. */
  value: string
  /** Lowercased language/type token from the fence info string. */
  type: string
  /** Anything after the type token on the fence line, e.g. ```video poster=... */
  meta?: string
}

export type BlockRenderer = ComponentType<BlockRendererProps>

export interface RendererRegistry {
  register(type: string, renderer: BlockRenderer): void
  unregister(type: string): void
  get(type: string): BlockRenderer | undefined
  has(type: string): boolean
  /** Shallow copy, so a consumer can derive a registry without mutating ours. */
  fork(): RendererRegistry
}

export interface UniversalContentRendererProps {
  /** A single string of extended markdown. The only input the caller provides. */
  content: string
}
