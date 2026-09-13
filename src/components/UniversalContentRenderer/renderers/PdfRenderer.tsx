import { BlockError } from '../core/BlockStatus'
import type { BlockRendererProps } from '../types'
import { parseMediaBlock } from '../utils/block'
import { safeMediaUrl } from '../utils/url'

/**
 * Uses the browser's built-in viewer. That keeps the bundle free of a PDF
 * engine; a pdf.js-backed implementation can replace this file without the core
 * renderer or the content language changing.
 */
export function PdfRenderer({ value }: BlockRendererProps) {
  const { url, caption } = parseMediaBlock(value)
  const src = safeMediaUrl(url)

  if (!src) return <BlockError title="Unsupported PDF URL" detail={url} />

  return (
    <figure className="ucr-figure">
      <object className="ucr-pdf" data={src} type="application/pdf">
        <p>
          This browser cannot display the PDF inline.{' '}
          <a href={src} target="_blank" rel="noopener noreferrer">
            Open the document
          </a>
          .
        </p>
      </object>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
