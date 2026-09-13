/**
 * The documentation is itself a single content string, rendered by the component
 * it documents. Anything wrong with the renderer shows up on this page first.
 */
export const docs = `# Documentation

Universal Content Renderer turns one string into a rendered document: markdown,
mathematics, code, diagrams and media. The caller never chooses a renderer.

This page is one string passed to the component, so everything below is also a
demonstration of it.

## Install

Nothing is published to npm yet. The shadcn CLI copies the component into your
project and installs its dependencies, which means you own the files:

\`\`\`bash
npx shadcn@latest add https://<your-deployment>/r/universal-content-renderer.json
\`\`\`

If you have never used the CLI in this project, run \`npx shadcn@latest init\`
once first — it writes the \`components.json\` that tells the CLI where your
components live. No Tailwind or design system is required.

To vendor it by hand instead, copy \`src/components/UniversalContentRenderer\`
out of the repository and install the nine runtime dependencies. The folder has
no imports outside itself.

## Usage

\`\`\`tsx
import { UniversalContentRenderer } from '@/components/universal-content-renderer'

export function Answer({ content }: { content: string }) {
  return <UniversalContentRenderer content={content} />
}
\`\`\`

That is the whole API.

| Prop | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| \`content\` | \`string\` | yes | The document to render |

The component is wrapped in \`React.memo\`, and parsing is memoised on the
string, so a re-rendering parent costs nothing until the content changes.

### Streaming

Pass a growing string. There is no separate streaming mode:

\`\`\`tsx
const [content, setContent] = useState('')

for await (const delta of stream) {
  setContent((current) => current + delta)
}
\`\`\`

## Syntax

Everything in GitHub Flavored Markdown works: headings, bold, italics,
strikethrough, links, images, ordered and unordered lists, task lists, tables,
blockquotes, footnotes and horizontal rules.

### Mathematics

Inline maths goes between single dollars, display maths between double dollars.
KaTeX does the typesetting.

\`\`\`text
The sum converges when $|r| < 1$.

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
\`\`\`

Which renders as: the sum converges when $|r| < 1$, and

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

Models frequently emit LaTeX's own delimiters instead. \`\\[ ... \\]\`,
\`\\( ... \\)\` and a \`$ ... $\` span that runs across lines are all normalised
before parsing, so they render rather than leaking into the page as text.

### Blocks

Anything markdown cannot express is a fenced block whose info string names the
type.

| Type | Body | Renders as |
| ---- | ---- | ---------- |
| any language id | source code | highlighted code with a copy button |
| \`math\` | LaTeX | display mathematics |
| \`mermaid\` | diagram source | a diagram, loaded on demand |
| \`video\` | URL, then optional caption | a video player |
| \`audio\` | URL, then optional caption | an audio player |
| \`pdf\` | URL, then optional caption | an inline document |
| \`youtube\` | URL, then optional caption | a privacy-preserving embed |

Media blocks all share one shape — the URL alone on the first non-empty line,
everything after it is the caption:

\`\`\`\`text
\`\`\`video
https://example.com/clip.mp4
Recorded at 60fps.
\`\`\`
\`\`\`\`

An unrecognised block type renders as a plain code block, so no content is ever
silently dropped.

## Adding a content type

Renderers live in a registry keyed by the fence type. A renderer receives the
raw body of the block and nothing else, which keeps it independent of the
markdown pipeline.

\`\`\`tsx
import type { BlockRendererProps } from './types'

export function ChartRenderer({ value }: BlockRendererProps) {
  const spec = JSON.parse(value)
  return <Chart spec={spec} />
}
\`\`\`

Register it in \`renderers/index.ts\`:

\`\`\`ts
export const defaultRegistry = createRegistry({
  // ...existing renderers
  chart: ChartRenderer,
})
\`\`\`

The parser is untouched. A renderer that throws is caught by its own error
boundary, so a malformed chart cannot take the document down.

### The pipeline

\`\`\`mermaid
flowchart TD
  A["Content string"] --> B["Normalise maths delimiters"]
  B --> C["remark: GFM, math, fence meta"]
  C --> D["rehype: sanitise, then KaTeX"]
  D --> E["Standard markdown"]
  D --> F["Fenced blocks"]
  F --> G["Registry lookup"]
  G --> H["Math, media, diagrams, code"]
\`\`\`

## Security

The input is treated as untrusted at every step, because it usually is.

- Raw HTML is never parsed. \`rehype-raw\` is deliberately not installed, so
  \`<script>\`, \`<iframe>\` and \`onerror\` attributes have no path into the
  output at all.
- \`rehype-sanitize\` runs with a narrowed schema: \`http\`, \`https\` and
  \`mailto\` links only, \`http(s)\` media only, and a tight \`className\`
  allowlist so content cannot borrow your application's CSS classes.
- Every URL is validated again by the renderer that uses it. A rejected URL
  becomes a visible notice rather than a silent drop.
- YouTube embeds are rebuilt from a validated video id against a fixed origin,
  so an arbitrary iframe cannot be injected through a media block.
- Mermaid runs with \`securityLevel: 'strict'\`, and KaTeX runs with \`trust\`
  disabled and expansion limits, so a pathological expression cannot hang the
  page.

The test suite renders a hostile document and asserts that none of these
survive.

## Styling

The component ships one stylesheet and takes its colours from whatever surrounds
it. Every colour is a CSS variable that defaults to a mix of the inherited text
colour, so it works in light and dark without configuration.

\`\`\`css
.universal-content-renderer {
  --ucr-border: color-mix(in srgb, currentColor 18%, transparent);
  --ucr-surface: color-mix(in srgb, currentColor 5%, transparent);
  --ucr-muted: color-mix(in srgb, currentColor 65%, transparent);
  --ucr-error-color: #c5303a;
  --ucr-radius: 8px;
  --ucr-space: 1rem;
}
\`\`\`

Override any of them on \`.universal-content-renderer\` or an ancestor. Code
blocks scroll horizontally, tables sit in their own scroll container, images and
video stay inside the container, and display mathematics scrolls rather than
overflowing.

## Accessibility

Headings stay semantic, images carry their alt text, media uses native controls,
error states are announced with \`role="alert"\`, loading states with
\`role="status"\`, and KaTeX emits MathML alongside its visual output so screen
readers read the mathematics rather than the markup.

## Development

\`\`\`bash
npm install
npm run dev
npm test
\`\`\`

The suite covers URL validation, the registry, fence scanning, maths
normalisation and full renders, including a test that renders every prefix of a
complex document to prove that no partial input throws.

## What is next

- Publishing to npm alongside the shadcn registry
- Lazy-loading KaTeX to shrink the initial bundle
- A plugin API for renderers, so a project can register its own without editing
  the registry
`
