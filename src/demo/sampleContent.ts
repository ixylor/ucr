export const sampleContent = `# Universal Content Renderer

Everything on this page comes from **one string** passed to a single component.
It is GitHub Flavored Markdown with ~~nothing~~ a few extra fenced blocks, so a
model can stream it token by token and it renders as it arrives.

## Markdown basics

- Nested lists work
  - like this
- [x] Task lists too
- [ ] Including unchecked items

> Blockquotes stay readable in light and dark themes.

| Block type | Renderer | Loaded |
| ---------- | -------- | ------ |
| \`mermaid\` | MermaidRenderer | lazily |
| \`video\` | VideoRenderer | eagerly |
| \`math\` | KaTeX | eagerly |

## Mathematics

Inline math such as $e^{i\\pi} + 1 = 0$ sits inside a normal paragraph, and
display math gets its own block:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Images

![A wide landscape photograph](https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=60)

## Code

\`\`\`javascript
const renderers = new Map()

export function registerRenderer(type, renderer) {
  renderers.set(type, renderer)
}
\`\`\`

## A custom block

\`\`\`mermaid
graph TD
  A[Content string] --> B[Markdown parser]
  B --> C[Standard markdown]
  B --> D[Extended blocks]
  D --> E[Registry lookup]
  E --> F[Math / Media / Diagrams]
\`\`\`

## Media

\`\`\`video
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
Video blocks take a URL and an optional caption.
\`\`\`

\`\`\`youtube
https://www.youtube.com/watch?v=dQw4w9WgXcQ
YouTube links become privacy-preserving embeds.
\`\`\`

## Failure is contained

\`\`\`mermaid
this is not a valid diagram
\`\`\`

\`\`\`video
javascript:alert(1)
\`\`\`

Both blocks above fail, and the rest of the document is unaffected.
`
