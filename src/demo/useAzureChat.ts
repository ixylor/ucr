import { useCallback, useEffect, useRef, useState } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AzureStatus {
  configured: boolean
  deployment: string | null
}

function newId() {
  return Math.random().toString(36).slice(2)
}

async function readError(response: Response) {
  try {
    const payload = await response.json()
    return [payload.error, payload.detail].filter(Boolean).join(' — ')
  } catch {
    return `Request failed with status ${response.status}`
  }
}

/**
 * Talks to the dev-server proxy in server/azureChat.ts, which returns the
 * completion as a plain text stream. Deltas are appended to the last assistant
 * message so the renderer sees the document grow exactly as a reader would.
 */
export function useAzureChat(systemPrompt: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string>()
  const [status, setStatus] = useState<AzureStatus>()
  const controller = useRef<AbortController>(undefined)

  useEffect(() => {
    fetch('/api/chat/status')
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus({ configured: false, deployment: null }))
    return () => controller.current?.abort()
  }, [])

  const stop = useCallback(() => {
    controller.current?.abort()
    controller.current = undefined
    setStreaming(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setMessages([])
    setError(undefined)
  }, [stop])

  const send = useCallback(
    async (text: string) => {
      const prompt = text.trim()
      if (!prompt || controller.current) return

      const history = [...messages, { id: newId(), role: 'user' as const, content: prompt }]
      const replyId = newId()
      setMessages([...history, { id: replyId, role: 'assistant', content: '' }])
      setError(undefined)
      setStreaming(true)

      const abort = new AbortController()
      controller.current = abort

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abort.signal,
          body: JSON.stringify({
            system: systemPrompt,
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        })

        if (!response.ok || !response.body) {
          setError(await readError(response))
          setMessages(history)
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          const delta = decoder.decode(value, { stream: true })
          setMessages((current) =>
            current.map((message) =>
              message.id === replyId
                ? { ...message, content: message.content + delta }
                : message,
            ),
          )
        }
      } catch (cause) {
        if (!abort.signal.aborted) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      } finally {
        controller.current = undefined
        setStreaming(false)
      }
    },
    [messages, systemPrompt],
  )

  return { messages, send, stop, reset, streaming, error, status }
}
