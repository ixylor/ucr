import { useEffect, useRef, useState } from 'react'
import { UniversalContentRenderer } from '../components/UniversalContentRenderer'
import { sampleContent } from './sampleContent'

/** Replays the sample in chunks to exercise the streaming path without Azure. */
function useStreamSimulation(source: string) {
  const [content, setContent] = useState(source)
  const [streaming, setStreaming] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => () => clearInterval(timer.current), [])

  const start = () => {
    clearInterval(timer.current)
    setStreaming(true)
    setContent('')
    let cursor = 0
    timer.current = setInterval(() => {
      cursor = Math.min(cursor + 12, source.length)
      setContent(source.slice(0, cursor))
      if (cursor >= source.length) {
        clearInterval(timer.current)
        setStreaming(false)
      }
    }, 16)
  }

  return { content, setContent, streaming, start }
}

export function SampleDemo() {
  const { content, setContent, streaming, start } = useStreamSimulation(sampleContent)

  return (
    <div className="sample">
      <div className="sample__toolbar">
        <button type="button" onClick={start} disabled={streaming}>
          {streaming ? 'Streaming…' : 'Replay as a stream'}
        </button>
      </div>

      <div className="sample__panes">
        <label className="demo__pane">
          <span className="demo__label">Content string</span>
          <textarea
            className="sample__editor"
            value={content}
            spellCheck={false}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>

        <section className="demo__pane" aria-label="Rendered output">
          <span className="demo__label">Rendered</span>
          <div className="sample__output">
            <UniversalContentRenderer content={content} />
          </div>
        </section>
      </div>
    </div>
  )
}
