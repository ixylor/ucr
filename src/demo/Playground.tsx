import { useState } from 'react'
import {
  CONTENT_LANGUAGE_SPEC,
  UniversalContentRenderer,
} from '../components/UniversalContentRenderer'
import { examplePrompts } from './examplePrompts'
import { type ChatMessage, useAzureChat } from './useAzureChat'

function Reply({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  const [showSource, setShowSource] = useState(false)

  return (
    <article className="chat__reply">
      <header className="chat__replyBar">
        <span className="demo__label">Assistant</span>
        <button
          type="button"
          className="chat__ghostButton"
          onClick={() => setShowSource((value) => !value)}
        >
          {showSource ? 'Rendered' : 'Source'}
        </button>
      </header>
      {showSource ? (
        <pre className="chat__source">{message.content}</pre>
      ) : (
        <UniversalContentRenderer content={message.content} />
      )}
      {streaming && !message.content ? (
        <p className="chat__waiting">Waiting for the first token…</p>
      ) : null}
    </article>
  )
}

export function Playground() {
  const [systemPrompt, setSystemPrompt] = useState(CONTENT_LANGUAGE_SPEC)
  const [input, setInput] = useState('')
  const { messages, send, stop, reset, streaming, error, status } =
    useAzureChat(systemPrompt)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    void send(input)
    setInput('')
  }

  const lastId = messages.at(-1)?.id

  return (
    <div className="chat">
      <div className="chat__thread">
        {messages.length === 0 ? (
          <div className="chat__empty">
            <p>
              Ask for something rich. The model is instructed to answer in the
              content language, and every token is rendered as it arrives.
            </p>
            <ul className="chat__examples">
              {examplePrompts.map((prompt) => (
                <li key={prompt}>
                  <button type="button" onClick={() => void send(prompt)}>
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((message) =>
            message.role === 'user' ? (
              <p key={message.id} className="chat__prompt">
                {message.content}
              </p>
            ) : (
              <Reply
                key={message.id}
                message={message}
                streaming={streaming && message.id === lastId}
              />
            ),
          )
        )}

        {error ? <p className="chat__error">{error}</p> : null}
      </div>

      <form className="chat__composer" onSubmit={submit}>
        <textarea
          className="chat__input"
          value={input}
          placeholder="Ask anything — press Enter to send"
          rows={2}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) submit(event)
          }}
        />
        <div className="chat__actions">
          {streaming ? (
            <button type="button" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()}>
              Send
            </button>
          )}
          <button type="button" onClick={reset} disabled={messages.length === 0}>
            Clear
          </button>
        </div>
      </form>

      <details className="chat__prompts">
        <summary>
          System prompt
          <span className="chat__status">
            {status === undefined
              ? 'checking Azure…'
              : status.configured
                ? `Azure deployment: ${status.deployment}`
                : 'Azure not configured — see .env.example'}
          </span>
        </summary>
        <p className="chat__hint">
          This is the content language handed to the model. Edit it to change what
          the model is allowed to emit; it applies to the next message.
        </p>
        <textarea
          className="chat__systemPrompt"
          value={systemPrompt}
          spellCheck={false}
          onChange={(event) => setSystemPrompt(event.target.value)}
        />
        <button
          type="button"
          className="chat__ghostButton"
          onClick={() => setSystemPrompt(CONTENT_LANGUAGE_SPEC)}
        >
          Reset to default
        </button>
      </details>
    </div>
  )
}
