import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { UniversalContentRenderer } from '../components/UniversalContentRenderer'

interface LiveEditorProps {
  content: string
  onChange: (content: string) => void
  /** Replays the content as a stream once, when it first appears. */
  autoPlay?: boolean
  label?: string
}

const CHARS_PER_TICK = 14
const TICK_MS = 16
/** How close to the bottom still counts as following along. */
const STICK_THRESHOLD = 32

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function isAtBottom(element: HTMLElement) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight < STICK_THRESHOLD
  )
}

/**
 * The source and its rendering, side by side. This is the whole product in one
 * component, so it doubles as the hero and as the try-it panel.
 */
export const LiveEditor = forwardRef<HTMLTextAreaElement, LiveEditorProps>(
  function LiveEditor({ content, onChange, autoPlay = false, label = 'Source' }, ref) {
    const [revealed, setRevealed] = useState(() => (autoPlay ? '' : content))
    const [streaming, setStreaming] = useState(false)
    const timer = useRef<ReturnType<typeof setInterval>>(undefined)
    const played = useRef(false)
    const source = useRef<HTMLTextAreaElement>(null)
    const output = useRef<HTMLDivElement>(null)
    // Following stops the moment the reader scrolls away, and resumes when they
    // come back to the bottom.
    const following = useRef(true)

    const play = (text: string) => {
      clearInterval(timer.current)
      if (prefersReducedMotion()) {
        setRevealed(text)
        return
      }
      following.current = true
      setStreaming(true)
      setRevealed('')
      let cursor = 0
      timer.current = setInterval(() => {
        cursor = Math.min(cursor + CHARS_PER_TICK, text.length)
        setRevealed(text.slice(0, cursor))
        if (cursor >= text.length) {
          clearInterval(timer.current)
          setStreaming(false)
        }
      }, TICK_MS)
    }

    useEffect(() => () => clearInterval(timer.current), [])

    useEffect(() => {
      if (!autoPlay || played.current) {
        setRevealed(content)
        return
      }
      played.current = true
      play(content)
    }, [content, autoPlay])

    // Runs before paint so the panes never flash a stale scroll position.
    useLayoutEffect(() => {
      if (!streaming || !following.current) return
      for (const element of [source.current, output.current]) {
        if (element) element.scrollTop = element.scrollHeight
      }
    }, [revealed, streaming])

    const trackFollowing = (element: HTMLElement | null) => {
      if (element) following.current = isAtBottom(element)
    }

    const edit = (value: string) => {
      clearInterval(timer.current)
      setStreaming(false)
      setRevealed(value)
      onChange(value)
    }

    return (
      <div className="editor" data-streaming={streaming || undefined}>
        <div className="editor__pane">
          <div className="editor__bar">
            <span className="editor__label">{label}</span>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => play(content)}
              disabled={streaming}
            >
              {streaming ? 'Streaming' : 'Replay as a stream'}
            </button>
          </div>
          <textarea
            ref={(element) => {
              source.current = element
              if (typeof ref === 'function') ref(element)
              else if (ref) ref.current = element
            }}
            className="editor__source"
            value={revealed}
            spellCheck={false}
            aria-label="Content source"
            onScroll={(event) => trackFollowing(event.currentTarget)}
            onChange={(event) => edit(event.target.value)}
          />
        </div>

        <div className="editor__pane">
          <div className="editor__bar">
            <span className="editor__label">Rendered</span>
          </div>
          <div
            ref={output}
            className="editor__output"
            onScroll={(event) => trackFollowing(event.currentTarget)}
          >
            <UniversalContentRenderer content={revealed} />
          </div>
        </div>
      </div>
    )
  },
)
