import mermaid from 'mermaid'
import { useEffect, useId, useState } from 'react'
import { BlockError, BlockLoading } from '../../core/BlockStatus'
import type { BlockRendererProps } from '../../types'
import { usePrefersDark } from '../../utils/usePrefersDark'

interface Result {
  source: string
  svg?: string
  error?: string
}

export function MermaidDiagram({ value }: BlockRendererProps) {
  const prefersDark = usePrefersDark()
  const domId = `ucr-mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const source = `${prefersDark}\n${value}`
  const [result, setResult] = useState<Result>()

  useEffect(() => {
    let active = true

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: prefersDark ? 'dark' : 'default',
      fontFamily: 'inherit',
      // Without this, a diagram that fails to parse has its error graphic
      // appended to the document body, outside this component entirely.
      suppressErrorRendering: true,
    })

    // Parsing first keeps a broken diagram away from render(), which is what
    // creates and leaves behind DOM nodes.
    mermaid
      .parse(value, { suppressErrors: true })
      .then((valid) => (valid ? mermaid.render(domId, value) : undefined))
      .then((rendered) => {
        if (!active) return
        if (rendered) setResult({ source, svg: rendered.svg })
        else setResult({ source, error: 'The diagram could not be parsed.' })
      })
      .catch((error: unknown) => {
        if (active) {
          setResult({
            source,
            error: error instanceof Error ? error.message : 'Invalid diagram',
          })
        }
      })

    return () => {
      active = false
      // mermaid.render leaves its measuring element behind when parsing fails.
      document.getElementById(`d${domId}`)?.remove()
    }
  }, [source, value, prefersDark, domId])

  const current = result?.source === source ? result : undefined

  if (current?.error) {
    return <BlockError title="Diagram could not be rendered" detail={current.error} />
  }
  if (!current?.svg) {
    return <BlockLoading label="Rendering diagram" />
  }

  return (
    <div
      className="ucr-mermaid"
      role="img"
      // Mermaid runs with securityLevel 'strict', which sanitizes diagram text.
      dangerouslySetInnerHTML={{ __html: current.svg }}
    />
  )
}
