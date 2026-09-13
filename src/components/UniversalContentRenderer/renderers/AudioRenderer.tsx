import { useState } from 'react'
import { BlockError } from '../core/BlockStatus'
import type { BlockRendererProps } from '../types'
import { parseMediaBlock } from '../utils/block'
import { safeMediaUrl } from '../utils/url'

export function AudioRenderer({ value }: BlockRendererProps) {
  const { url, caption } = parseMediaBlock(value)
  const src = safeMediaUrl(url)
  const [failed, setFailed] = useState(false)

  if (!src) return <BlockError title="Unsupported audio URL" detail={url} />
  if (failed) return <BlockError title="Audio could not be loaded" detail={src} />

  return (
    <figure className="ucr-figure">
      <audio
        className="ucr-audio"
        src={src}
        controls
        preload="metadata"
        onError={() => setFailed(true)}
      >
        <a href={src}>Download audio</a>
      </audio>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
