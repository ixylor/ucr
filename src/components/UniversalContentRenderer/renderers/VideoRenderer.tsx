import { useState } from 'react'
import { BlockError } from '../core/BlockStatus'
import type { BlockRendererProps } from '../types'
import { parseMediaBlock } from '../utils/block'
import { safeMediaUrl } from '../utils/url'

export function VideoRenderer({ value }: BlockRendererProps) {
  const { url, caption } = parseMediaBlock(value)
  const src = safeMediaUrl(url)
  const [failed, setFailed] = useState(false)

  if (!src) return <BlockError title="Unsupported video URL" detail={url} />
  if (failed) return <BlockError title="Video could not be loaded" detail={src} />

  return (
    <figure className="ucr-figure">
      <video
        className="ucr-video"
        src={src}
        controls
        preload="metadata"
        onError={() => setFailed(true)}
      >
        <a href={src}>Download video</a>
      </video>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
