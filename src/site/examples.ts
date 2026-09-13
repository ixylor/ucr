export interface Example {
  id: string
  name: string
  /** What this example proves the renderer can do, shown under the chips. */
  shows: string
  content: string
}

const quadratic = `## Solving a quadratic

Every quadratic $ax^2 + bx + c = 0$ with $a \\neq 0$ can be solved by completing
the square:

$$
\\begin{aligned}
ax^2 + bx + c &= 0 \\\\
x^2 + \\frac{b}{a}x &= -\\frac{c}{a} \\\\
\\left(x + \\frac{b}{2a}\\right)^2 &= \\frac{b^2 - 4ac}{4a^2} \\\\
x &= \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
\\end{aligned}
$$

The sign of the discriminant $\\Delta = b^2 - 4ac$ decides what you get:

| Discriminant | Roots |
| ------------ | ----- |
| $\\Delta > 0$ | two distinct real roots |
| $\\Delta = 0$ | one repeated real root |
| $\\Delta < 0$ | two complex conjugate roots |
`

const cacheFlow = `## How a request reaches the edge

A cache hit never touches your origin, which is the whole point.

\`\`\`mermaid
flowchart TD
  A["Browser requests /page"] --> B{"Fresh in cache?"}
  B -->|yes| C["Serve from edge"]
  B -->|no| D["Fetch from origin"]
  D --> E["Store at edge"] --> C
\`\`\`

The same exchange, step by step:

\`\`\`mermaid
sequenceDiagram
  participant edge as CDN edge
  Browser->>edge: GET /page (cache miss)
  edge->>Origin: GET /page
  Origin-->>edge: 200 OK
  edge-->>Browser: 200 OK (now cached)
\`\`\`

> Cache invalidation is hard because the edge cannot know what you changed.
`

const debounce = `## Debouncing input

A debounced function waits until the calls stop before it runs once.

\`\`\`typescript
export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined

  return (...args: T) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
\`\`\`

Use it when the work is expensive and only the last call matters:

- [x] Search-as-you-type against an API
- [x] Resize and scroll handlers
- [ ] Form submission, where you want *throttling* instead

Each keystroke costs $O(1)$, so the total work is $O(n)$ in keystrokes rather
than $O(n)$ in requests.
`

const everything = `# Everything at once

This whole page is **one string**. The component parses it and decides what each
part becomes, so the caller never picks a renderer.

## Text and lists

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

Inline maths such as $e^{i\\pi} + 1 = 0$ sits inside a paragraph, and display
maths gets its own block:

$$
\\int_{0}^{\\infty} e^{-x^2} \\, dx = \\frac{\\sqrt{\\pi}}{2}
$$

## Code

\`\`\`javascript
const renderers = new Map()

export function registerRenderer(type, renderer) {
  renderers.set(type, renderer)
}
\`\`\`

## Diagrams

\`\`\`mermaid
flowchart LR
  A["Content string"] --> B["Markdown parser"]
  B --> C["Standard markdown"]
  B --> D["Extended blocks"]
  D --> E["Registry lookup"]
\`\`\`

## Media

\`\`\`video
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
Video blocks take a URL and an optional caption.
\`\`\`

## Failure stays local

\`\`\`mermaid
this is not a valid diagram
\`\`\`

The diagram above is broken and the document below it is fine.
`

export const examples: Example[] = [
  {
    id: 'quadratic',
    name: 'Quadratic formula',
    shows: 'Aligned derivations and inline maths, typeset with KaTeX.',
    content: quadratic,
  },
  {
    id: 'cache',
    name: 'Request flow',
    shows: 'Mermaid diagrams, loaded only when a document contains one.',
    content: cacheFlow,
  },
  {
    id: 'debounce',
    name: 'Debounce',
    shows: 'Highlighted code, task lists and maths in the same answer.',
    content: debounce,
  },
  {
    id: 'everything',
    name: 'Everything at once',
    shows: 'One string carrying every block type, including one that fails.',
    content: everything,
  },
]
