import { BlockError } from '../core/BlockStatus'
import type { BlockRendererProps } from '../types'
import { parseMediaBlock } from '../utils/block'
import { youTubeVideoId } from '../utils/url'

export function YouTubeRenderer({ value }: BlockRendererProps) {
  const { url, caption } = parseMediaBlock(value)
  const id = youTubeVideoId(url)

  // The iframe is built from a validated id against a fixed origin, never from
  // a caller-supplied URL, so arbitrary embeds cannot be injected.
  if (!id) return <BlockError title="Unrecognised YouTube URL" detail={url} />

  return (
    <figure className="ucr-figure">
      <div className="ucr-embed ucr-embed--16x9">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={caption ?? 'YouTube video player'}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
