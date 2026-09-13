import { UniversalContentRenderer } from '../components/UniversalContentRenderer'
import { docs } from './docsContent'

/**
 * The documentation is one content string rendered by the component it
 * documents, so a regression in the renderer breaks this page first.
 */
export function Docs() {
  return (
    <article className="docs">
      <UniversalContentRenderer content={docs} />
    </article>
  )
}
