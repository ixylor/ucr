const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])
const MEDIA_PROTOCOLS = new Set(['http:', 'https:'])

function parse(url: string): URL | undefined {
  const trimmed = url.trim()
  if (!trimmed) return undefined
  try {
    // A base is required so that relative URLs (/img.png, ./a.mp4) resolve
    // instead of throwing; they inherit the page protocol, which is safe.
    return new URL(trimmed, getBaseUrl())
  } catch {
    return undefined
  }
}

function getBaseUrl(): string {
  return typeof window === 'undefined' ? 'https://localhost/' : window.location.href
}

/** Link targets: http(s) and mailto only. Returns undefined when unsafe. */
export function safeLinkUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const parsed = parse(url)
  if (!parsed || !LINK_PROTOCOLS.has(parsed.protocol)) return undefined
  return parsed.href
}

/** Media/embed sources: http(s) only. Returns undefined when unsafe. */
export function safeMediaUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const parsed = parse(url)
  if (!parsed || !MEDIA_PROTOCOLS.has(parsed.protocol)) return undefined
  return parsed.href
}

export function isExternalUrl(url: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return new URL(url, window.location.href).origin !== window.location.origin
  } catch {
    return false
  }
}

/** Extracts a YouTube video id from the watch, share, embed or shorts forms. */
export function youTubeVideoId(url: string): string | undefined {
  const parsed = parse(url)
  if (!parsed) return undefined

  const host = parsed.hostname.replace(/^www\./, '')
  const id =
    host === 'youtu.be'
      ? parsed.pathname.slice(1)
      : host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')
        ? (parsed.searchParams.get('v') ??
          parsed.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)/)?.[1])
        : undefined

  return id && /^[\w-]{6,20}$/.test(id) ? id : undefined
}
