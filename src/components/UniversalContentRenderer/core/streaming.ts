import { createContext, useContext } from 'react'

/**
 * Offset of a fence that has been opened but not yet closed. While a response
 * is streaming the parser still emits a code node for it (CommonMark closes
 * fences at end of input), so without this the renderer would repeatedly hand
 * half a diagram to Mermaid or half a URL to a media element.
 */
export function openFenceOffset(content: string): number | undefined {
  const fence = /^([ \t]{0,3})(`{3,}|~{3,})(.*)$/
  let open: { offset: number; marker: string; length: number } | undefined
  let offset = 0

  for (const line of content.split('\n')) {
    const match = fence.exec(line)
    if (match) {
      const [, , marker, rest] = match
      if (!open) {
        open = { offset, marker: marker[0], length: marker.length }
      } else if (
        marker[0] === open.marker &&
        marker.length >= open.length &&
        rest.trim() === ''
      ) {
        open = undefined
      }
    }
    offset += line.length + 1
  }

  return open?.offset
}

export const StreamingFenceContext = createContext<number | undefined>(undefined)

export function useIsStreamingBlock(startOffset: number | undefined): boolean {
  const openOffset = useContext(StreamingFenceContext)
  return openOffset !== undefined && openOffset === startOffset
}
