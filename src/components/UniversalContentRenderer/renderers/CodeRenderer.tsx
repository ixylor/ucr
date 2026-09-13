import { useEffect, useRef, useState } from 'react'
import type { BlockRendererProps } from '../types'

/**
 * Highlighting is loaded on demand and kept behind this component, so swapping
 * highlight.js for Shiki (or dropping highlighting) touches only this file.
 */
async function highlight(value: string, language: string) {
  const { default: hljs } = await import('highlight.js/lib/common')
  if (!hljs.getLanguage(language)) return undefined
  return hljs.highlight(value, { language, ignoreIllegals: true }).value
}

export function CodeRenderer({ value, type }: BlockRendererProps) {
  // Keyed by its source so a stale highlight is never shown against new code —
  // during streaming this component re-renders on every token.
  const source = `${type}\n${value}`
  const [highlighted, setHighlighted] = useState<{ source: string; html: string }>()
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!type) return
    let active = true
    highlight(value, type)
      .then((html) => {
        if (active && html) setHighlighted({ source, html })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [source, value, type])

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      copyTimer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const html = highlighted?.source === source ? highlighted.html : undefined

  return (
    <div className="ucr-code-block">
      <div className="ucr-code-block__bar">
        <span className="ucr-code-block__lang">{type || 'text'}</span>
        <button type="button" className="ucr-code-block__copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="ucr-code" tabIndex={0}>
        <code
          className={type ? `language-${type} hljs` : undefined}
          {...(html
            ? { dangerouslySetInnerHTML: { __html: html } }
            : { children: value })}
        />
      </pre>
    </div>
  )
}
