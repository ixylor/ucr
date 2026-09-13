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
  return element.scrollHeight - element.scrollTop - element.clientHeight < STICK_THRESHOLD
}

/**
 * The source and its rendering, side by side. This is the whole product in one
 * component, so it doubles as the hero and as the try-it panel.
 *
 * The caller owns the content. The only local state is the prefix shown during a
 * replay, so "streaming" is derived rather than a second source of truth that
 * could be left switched on.
 */
export const LiveEditor = forwardRef<HTMLTextAreaElement, LiveEditorProps>(
  function LiveEditor({ content, onChange, autoPlay = false, label = 'Source' }, ref) {
    const [replay, setReplay] = useState<string>()
    const timer = useRef<ReturnType<typeof setInterval>>(undefined)
    const initial = useRef(content)
    const source = useRef<HTMLTextAreaElement>(null)
    const output = useRef<HTMLDivElement>(null)
    // Following stops the moment the reader scrolls away, and resumes when they
    // come back to the bottom.
    const following = useRef(true)

    const shown = replay ?? content
    const streaming = replay !== undefined

    const play = (text: string) => {
      clearInterval(timer.current)
      if (prefersReducedMotion() || !text) return

      following.current = true
      setReplay('')
      let cursor = 0

      timer.current = setInterval(() => {
        cursor += CHARS_PER_TICK
        if (cursor >= text.length) {
          clearInterval(timer.current)
          setReplay(undefined)
        } else {
          setReplay(text.slice(0, cursor))
        }
      }, TICK_MS)
    }

    const stop = () => {
      clearInterval(timer.current)
      setReplay(undefined)
    }

    useEffect(() => () => clearInterval(timer.current), [])

    // The one-off replay, on mount only: it must not restart when the reader
    // edits the content. Its cleanup undoes what it started, so a remount —
    // StrictMode's double invoke included — cannot leave the pane mid-stream.
    useEffect(() => {
      if (!autoPlay) return
      play(initial.current)
      return () => clearInterval(timer.current)
    }, [autoPlay])

    // Runs before paint so the panes never show a stale scroll position.
    useLayoutEffect(() => {
      if (!streaming || !following.current) return
      for (const element of [source.current, output.current]) {
        if (element) element.scrollTop = element.scrollHeight
      }
    }, [shown, streaming])

    const trackFollowing = (element: HTMLElement | null) => {
      if (element) following.current = isAtBottom(element)
    }

    return (
      <div className="editor" data-streaming={streaming || undefined}>
        <div className="editor__pane">
          <div className="editor__bar">
            <span className="editor__label">{label}</span>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => (streaming ? stop() : play(content))}
            >
              {streaming ? 'Stop' : 'Replay as a stream'}
            </button>
          </div>
          <textarea
            ref={(element) => {
              source.current = element
              if (typeof ref === 'function') ref(element)
              else if (ref) ref.current = element
            }}
            className="editor__source"
            value={shown}
            spellCheck={false}
            aria-label="Content source"
            onScroll={(event) => trackFollowing(event.currentTarget)}
            onChange={(event) => {
              stop()
              onChange(event.target.value)
            }}
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
            <UniversalContentRenderer content={shown} />
          </div>
        </div>
      </div>
    )
  },
)
