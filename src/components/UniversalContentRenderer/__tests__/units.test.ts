import { describe, expect, it } from 'vitest'
import { createRegistry } from '../core/registry'
import { openFenceOffset } from '../core/streaming'
import type { BlockRenderer } from '../types'
import { parseMediaBlock } from '../utils/block'
import { safeLinkUrl, safeMediaUrl, youTubeVideoId } from '../utils/url'

const Renderer = (() => null) as unknown as BlockRenderer

describe('registry', () => {
  it('looks up renderers case-insensitively', () => {
    const registry = createRegistry({ Video: Renderer })
    expect(registry.get('video')).toBe(Renderer)
    expect(registry.has('VIDEO')).toBe(true)
  })

  it('registers and unregisters at runtime', () => {
    const registry = createRegistry()
    expect(registry.has('chart')).toBe(false)
    registry.register('chart', Renderer)
    expect(registry.get('chart')).toBe(Renderer)
    registry.unregister('chart')
    expect(registry.has('chart')).toBe(false)
  })

  it('forks without mutating the original', () => {
    const registry = createRegistry({ video: Renderer })
    const fork = registry.fork()
    fork.register('chart', Renderer)
    expect(fork.has('chart')).toBe(true)
    expect(registry.has('chart')).toBe(false)
  })
})

describe('openFenceOffset', () => {
  it('reports nothing for a closed fence', () => {
    expect(openFenceOffset('```js\nconst a = 1\n```\n')).toBeUndefined()
  })

  it('reports the offset of an unclosed fence', () => {
    const content = '# Title\n\n```mermaid\ngraph TD\n'
    expect(openFenceOffset(content)).toBe(content.indexOf('```mermaid'))
  })

  it('handles tilde fences', () => {
    expect(openFenceOffset('~~~python\nprint(1)\n')).toBe(0)
  })

  it('does not close a fence with a different marker', () => {
    expect(openFenceOffset('```js\ncode\n~~~\n')).toBe(0)
  })

  it('ignores a closing fence that carries an info string', () => {
    expect(openFenceOffset('```js\ncode\n``` not a close\n')).toBe(0)
  })

  it('tracks the second fence after the first closes', () => {
    const content = '```js\na\n```\n\n```video\nhttps://x.test/a.mp4\n'
    expect(openFenceOffset(content)).toBe(content.indexOf('```video'))
  })
})

describe('parseMediaBlock', () => {
  it('reads the URL from the first non-empty line', () => {
    expect(parseMediaBlock('\n\nhttps://x.test/a.mp4\n')).toEqual({
      url: 'https://x.test/a.mp4',
      caption: undefined,
    })
  })

  it('treats the remaining lines as a caption', () => {
    expect(parseMediaBlock('https://x.test/a.mp4\nA caption.\nSecond line.')).toEqual({
      url: 'https://x.test/a.mp4',
      caption: 'A caption.\nSecond line.',
    })
  })

  it('returns an empty URL for an empty block', () => {
    expect(parseMediaBlock('  \n\n')).toEqual({ url: '' })
  })
})

describe('url safety', () => {
  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'vbscript:msgbox(1)',
  ])('rejects %s as a link', (url) => {
    expect(safeLinkUrl(url)).toBeUndefined()
  })

  it('allows http, https and mailto links', () => {
    expect(safeLinkUrl('https://example.com/a')).toBe('https://example.com/a')
    expect(safeLinkUrl('http://example.com/a')).toBe('http://example.com/a')
    expect(safeLinkUrl('mailto:a@example.com')).toBe('mailto:a@example.com')
  })

  it('rejects mailto and data for media, which must be fetchable', () => {
    expect(safeMediaUrl('mailto:a@example.com')).toBeUndefined()
    expect(safeMediaUrl('data:image/png;base64,AAAA')).toBeUndefined()
    expect(safeMediaUrl('https://example.com/a.png')).toBe('https://example.com/a.png')
  })

  it('rejects empty and malformed input', () => {
    expect(safeLinkUrl(undefined)).toBeUndefined()
    expect(safeLinkUrl('   ')).toBeUndefined()
  })

  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts the video id from %s', (url, id) => {
    expect(youTubeVideoId(url)).toBe(id)
  })

  it('rejects a non-YouTube host', () => {
    expect(youTubeVideoId('https://evil.test/watch?v=dQw4w9WgXcQ')).toBeUndefined()
  })
})
