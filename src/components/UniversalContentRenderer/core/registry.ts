import type { BlockRenderer, RendererRegistry } from '../types'

export function createRegistry(
  initial: Record<string, BlockRenderer> = {},
): RendererRegistry {
  const renderers = new Map<string, BlockRenderer>(
    Object.entries(initial).map(([type, renderer]) => [
      normalizeType(type),
      renderer,
    ]),
  )

  const registry: RendererRegistry = {
    register(type, renderer) {
      renderers.set(normalizeType(type), renderer)
    },
    unregister(type) {
      renderers.delete(normalizeType(type))
    },
    get(type) {
      return renderers.get(normalizeType(type))
    },
    has(type) {
      return renderers.has(normalizeType(type))
    },
    fork() {
      return createRegistry(Object.fromEntries(renderers))
    },
  }

  return registry
}

export function normalizeType(type: string): string {
  return type.trim().toLowerCase()
}
