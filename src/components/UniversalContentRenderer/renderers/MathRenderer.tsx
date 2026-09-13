import katex from 'katex'
import { useMemo } from 'react'
import { BlockError } from '../core/BlockStatus'
import type { BlockRendererProps } from '../types'

/** Block form: ```math fences, complementing the inline `$…$` remark-math path. */
export function MathRenderer({ value }: BlockRendererProps) {
  const result = useMemo(() => {
    try {
      return {
        html: katex.renderToString(value, {
          displayMode: true,
          throwOnError: true,
          trust: false,
        }),
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Invalid expression' }
    }
  }, [value])

  if (result.error) {
    return <BlockError title="Invalid math expression" detail={result.error} />
  }

  return (
    <div
      className="ucr-math-block"
      // KaTeX output is generated from the expression with `trust` disabled.
      dangerouslySetInnerHTML={{ __html: result.html! }}
    />
  )
}
