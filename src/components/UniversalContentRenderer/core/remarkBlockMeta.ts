import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * Fence meta (```video poster=…) is dropped on the way from mdast to hast.
 * Carrying it through as a data attribute keeps the door open for typed block
 * parameters without changing the dispatcher.
 */
export function remarkBlockMeta() {
  return (tree: Root) => {
    visit(tree, 'code', (node) => {
      if (!node.meta) return
      const data = (node.data ??= {})
      const properties = ((data as { hProperties?: Record<string, unknown> })
        .hProperties ??= {})
      properties.dataMeta = node.meta
    })
  }
}
