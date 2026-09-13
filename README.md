# UCR — Universal Content Renderer

One string in. A typeset document out.

A React component for content you did not write: model output, user input,
anything arriving a token at a time. It reads markdown, mathematics, code,
diagrams and media from a single string and renders them safely, as the text
arrives.

```jsx
import { UniversalContentRenderer } from '@/components/universal-content-renderer'

<UniversalContentRenderer content={content} />
```

That is the whole API. The caller never picks a renderer.

## Install

Nothing is published to npm yet. The shadcn CLI copies the component into your
project and installs its dependencies, so you own the files:

```bash
npx shadcn@latest add https://<your-deployment>/r/universal-content-renderer.json
```

Run `npx shadcn@latest init` once first if the project has no `components.json`.
No Tailwind or design system required. To vendor it by hand, copy
`src/components/UniversalContentRenderer` — it has no imports outside its own
folder.

The registry item is generated from the real source on every build
(`scripts/build-registry.mjs`), so it cannot drift from what the repository
contains.

## What it renders

| Syntax | Renders as |
| ------ | ---------- |
| Standard GFM | headings, lists, task lists, tables, quotes, links, images |
| `$x$` / `$$…$$` | inline and display mathematics via KaTeX |
| ` ```math ` | display mathematics as a fenced block |
| ` ```mermaid ` | a diagram, loaded on demand |
| ` ```video `, ` ```audio `, ` ```pdf `, ` ```youtube ` | media; URL on the first line, optional caption after |
| ` ```<language> ` | highlighted code with a copy button |

An unknown block type falls back to a plain code block, so no content is ever
silently dropped.

## The content language

The block vocabulary is written as an LLM system prompt in
[`contentLanguage.ts`](src/components/UniversalContentRenderer/contentLanguage.ts),
exported as `CONTENT_LANGUAGE_SPEC`. Give it to the model producing the stream
and its answers arrive as documents rather than walls of text. It is the single
source of truth: a new renderer is documented there in the same change.

## Streaming

The component is built for content that arrives a token at a time:

- the string is re-scanned only when it changes, not on every parent render;
- the maths delimiters models actually emit — `\[…\]`, `\(…\)` and a `$…$` span
  that runs across lines — are normalised before parsing instead of leaking into
  the page as raw LaTeX;
- a fence that has not closed renders as a placeholder rather than being handed
  half-written to a diagram engine;
- each block sits behind its own error boundary that clears when the block's
  text changes, so a briefly invalid block recovers on its own.

## Security

Input is treated as untrusted, always:

- raw HTML is never parsed (`rehype-raw` is deliberately not installed);
- `rehype-sanitize` runs with a narrowed schema — `http`, `https` and `mailto`
  links only, `http(s)` media only, and a tight `className` allowlist so content
  cannot borrow the host application's CSS classes;
- every URL is validated again by the renderer that uses it;
- YouTube embeds are rebuilt from a validated video id against a fixed origin,
  so arbitrary iframes are impossible;
- Mermaid runs with `securityLevel: 'strict'`, KaTeX with `trust` disabled and
  expansion limits.

`npm test` renders a hostile document and asserts that no `javascript:` or
`data:` URL, `<script>`, `onerror` or foreign iframe survives.

## Architecture

```
UniversalContentRenderer.tsx   the only public component
core/
  registry.ts                  type -> renderer map
  BlockDispatcher.tsx          the one place a fence becomes a component
  markdownPlugins.ts           remark/rehype pipeline + sanitize schema
  normalizeMath.ts             delimiter rescue before parsing
  streaming.ts                 open-fence detection
  BlockErrorBoundary.tsx       per-block failure isolation
markdown/components.tsx        element overrides (pre, img, a, table)
renderers/                     one file per content type
utils/                         URL validation, block parsing
```

Adding a content type is a component plus one registration:

```js
registerRenderer('chart', ChartRenderer)
```

The parser is untouched. Nothing in the folder depends on the surrounding
application: no design system, no routing, no state management. Colours are CSS
variables defaulting to a mix of the inherited text colour, so the renderer
takes light or dark mode from its host.

## Local development

```bash
npm install
npm run dev
```

The site is the documentation: a landing page with live examples, an editor you
can paste model output into, and a docs page that is itself one content string
rendered by the component.

### Azure OpenAI playground

Optional, and local only. Copy `.env.example` to `.env` and fill in your Azure
OpenAI resource; the playground tab then appears, serving the content language
as the system prompt and rendering the reply as it streams.

The key is read only by the Vite dev server
([`server/azureChat.ts`](server/azureChat.ts)), which proxies `POST /api/chat`
and streams the completion back. The variables have no `VITE_` prefix on
purpose: nothing reaches the browser bundle, and a deployed build has no server,
so the playground stays hidden in production.

## Scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | the site, with the playground when Azure is configured |
| `npm run build` | generate the registry, type-check and build |
| `npm test` | run the test suite once |
| `npm run test:watch` | run the suite in watch mode |
| `npm run lint` | oxlint |
| `npm run registry` | regenerate the shadcn registry item |

## Deploying

The site is a static Vite build. `vercel.json` sets the framework, the output
directory, SPA rewrites and cache headers, so a Vercel import needs no further
configuration. Set no environment variables: the playground is a development
tool and stays off in production.

## Licence

MIT © [Vikas Patel](https://github.com/ixylor)
