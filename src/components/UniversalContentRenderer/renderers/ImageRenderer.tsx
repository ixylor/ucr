import { useState } from 'react'
import { BlockError } from '../core/BlockStatus'
import { safeMediaUrl } from '../utils/url'

interface ImageRendererProps {
  src?: string
  alt?: string
  title?: string
}

/** Backs standard markdown `![alt](url)` rather than a fenced block. */
export function ImageRenderer({ src, alt, title }: ImageRendererProps) {
  const safeSrc = safeMediaUrl(src)
  const [failed, setFailed] = useState(false)

  if (!safeSrc) return <BlockError title="Unsupported image URL" detail={src} />
  if (failed) {
    return <BlockError title="Image could not be loaded" detail={alt || safeSrc} />
  }

  return (
    <img
      className="ucr-image"
      src={safeSrc}
      alt={alt ?? ''}
      title={title}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
