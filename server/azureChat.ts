import type { IncomingMessage, ServerResponse } from 'node:http'
import { type Plugin, loadEnv } from 'vite'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AzureConfig {
  endpoint: string
  deployment: string
  apiKey: string
  version: string
}

/**
 * The Azure credentials stay in this process. The browser talks to /api/chat and
 * never sees a key, which is why the env vars deliberately have no VITE_ prefix.
 */
function readConfig(root: string, mode: string): AzureConfig | undefined {
  const env = { ...loadEnv(mode, root, ''), ...process.env }
  const endpoint = env.AZURE_OPENAI_ENDPOINT?.trim().replace(/\/+$/, '')
  const deployment = env.AZURE_OPENAI_DEPLOYMENT?.trim()
  const apiKey = (env.AZURE_OPENAI_API_KEY ?? env.AZURE_OPENAI_KEY)?.trim()
  const version = env.AZURE_OPENAI_VERSION?.trim() || '2024-12-01-preview'

  if (!endpoint || !deployment || !apiKey) return undefined
  return { endpoint, deployment, apiKey, version }
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) reject(new Error('Request body too large'))
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(payload))
}

/**
 * Forwards Azure's server-sent events as a plain text stream of content deltas.
 * The client only has to append what arrives, which keeps the playground's
 * rendering path identical to any other streaming source.
 */
async function pipeCompletion(
  config: AzureConfig,
  messages: ChatMessage[],
  response: ServerResponse,
  signal: AbortSignal,
) {
  const url =
    `${config.endpoint}/openai/deployments/${config.deployment}` +
    `/chat/completions?api-version=${config.version}`

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': config.apiKey },
    body: JSON.stringify({ messages, stream: true }),
    signal,
  })

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    sendJson(response, upstream.status, {
      error: `Azure OpenAI returned ${upstream.status}`,
      detail: detail.slice(0, 2000),
    })
    return
  }

  response.statusCode = 200
  response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Accel-Buffering', 'no')

  const decoder = new TextDecoder()
  let buffer = ''

  for await (const chunk of upstream.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      for (const line of event.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta) response.write(delta)
        } catch {
          // A partial JSON payload can be split across chunks; the next
          // iteration carries the remainder.
        }
      }
    }
  }

  response.end()
}

export function azureChatPlugin(): Plugin {
  let config: AzureConfig | undefined

  const handler = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.url?.startsWith('/status')) {
      sendJson(response, 200, {
        configured: Boolean(config),
        deployment: config?.deployment ?? null,
      })
      return
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Use POST' })
      return
    }

    if (!config) {
      sendJson(response, 503, {
        error: 'Azure OpenAI is not configured',
        detail:
          'Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT and ' +
          'AZURE_OPENAI_API_KEY in .env, then restart the dev server.',
      })
      return
    }

    // Watch the response, not the request: IncomingMessage emits 'close' as
    // soon as its body has been consumed, which would abort every call.
    const controller = new AbortController()
    response.on('close', () => {
      if (!response.writableEnded) controller.abort()
    })

    try {
      const { system, messages } = JSON.parse(await readBody(request)) as {
        system?: string
        messages?: ChatMessage[]
      }
      const conversation: ChatMessage[] = [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        ...(messages ?? []),
      ]
      await pipeCompletion(config, conversation, response, controller.signal)
    } catch (error) {
      if (controller.signal.aborted) {
        response.end()
        return
      }
      const message = error instanceof Error ? error.message : String(error)
      if (response.headersSent) response.end()
      else sendJson(response, 500, { error: 'Chat request failed', detail: message })
    }
  }

  return {
    name: 'ucr:azure-chat',
    configResolved(resolved) {
      config = readConfig(resolved.root, resolved.mode)
    },
    configureServer(server) {
      server.middlewares.use('/api/chat', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/chat', handler)
    },
  }
}
