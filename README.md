# UniversalContentRenderer

One React component that turns **a single string** into rendered content.

```jsx
import { UniversalContentRenderer } from './components/UniversalContentRenderer'

export default function Page({ content }) {
  return <UniversalContentRenderer content={content} />
}
```

The string is GitHub Flavored Markdown extended with a small set of fenced
blocks. The caller never picks a renderer; the component parses the string and
dispatches each block itself.

## The content language

The block vocabulary is written as an LLM prompt in
[`contentLanguage.ts`](src/components/UniversalContentRenderer/contentLanguage.ts)
and exported as `CONTENT_LANGUAGE_SPEC`. Put it in the system prompt of the model
producing the stream so producer and renderer stay in step.

| Syntax | Renders as |
| ------ | ---------- |
| Standard GFM | headings, lists, task lists, tables, quotes, links, images |
| `$x$` / `$$…$$` | inline and display maths via KaTeX |
| ` ```math ` | display maths as a fenced block |
| ` ```mermaid ` | diagram (lazy-loaded) |
| ` ```video `, ` ```audio `, ` ```pdf `, ` ```youtube ` | media; URL on the first line, optional caption after |
| ` ```<language> ` | highlighted code with a copy button |

An unknown block type falls back to a plain code block, so the document never
loses content.

## Azure OpenAI playground

`npm run dev` opens a playground where a model answers in the content language
and the answer is rendered live, token by token.

1. Copy `.env.example` to `.env` and fill in your Azure OpenAI resource:

   ```
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   AZURE_OPENAI_API_KEY=your-key
   AZURE_OPENAI_VERSION=2024-12-01-preview
   ```

2. `npm run dev`, then use the **Azure playground** tab.

The key is read only by the Vite dev server ([`server/azureChat.ts`](server/azureChat.ts)),
which proxies `POST /api/chat` to Azure and streams the completion back as plain
text. The variables have no `VITE_` prefix on purpose: nothing reaches the
browser bundle. That middleware runs under `npm run dev` and `npm run preview`
only — a static production build has no server, so bring your own endpoint.

The playground sends `CONTENT_LANGUAGE_SPEC` as the system prompt. It is editable
in the **System prompt** panel, so you can change the language and see the effect
on the next message; each reply also has a **Source** toggle to read the raw
markup the model produced.

## Streaming

The component is built for content that arrives token by token:

- the string is re-scanned only when it changes, not on every parent render;
- maths delimiters models actually emit are normalised before parsing — `[…]`,
  `(…)` and a `$…# UniversalContentRenderer

One React component that turns **a single string** into rendered content.

```jsx
import { UniversalContentRenderer } from './components/UniversalContentRenderer'

export default function Page({ content }) {
  return <UniversalContentRenderer content={content} />
}
```

The string is GitHub Flavored Markdown extended with a small set of fenced
blocks. The caller never picks a renderer; the component parses the string and
dispatches each block itself.

## The content language

The block vocabulary is written as an LLM prompt in
[`contentLanguage.ts`](src/components/UniversalContentRenderer/contentLanguage.ts)
and exported as `CONTENT_LANGUAGE_SPEC`. Put it in the system prompt of the model
producing the stream so producer and renderer stay in step.

| Syntax | Renders as |
| ------ | ---------- |
| Standard GFM | headings, lists, task lists, tables, quotes, links, images |
| `$x$` / `$$…$$` | inline and display maths via KaTeX |
| ` ```math ` | display maths as a fenced block |
| ` ```mermaid ` | diagram (lazy-loaded) |
| ` ```video `, ` ```audio `, ` ```pdf `, ` ```youtube ` | media; URL on the first line, optional caption after |
| ` ```<language> ` | highlighted code with a copy button |

An unknown block type falls back to a plain code block, so the document never
loses content.

## Azure OpenAI playground

`npm run dev` opens a playground where a model answers in the content language
and the answer is rendered live, token by token.

1. Copy `.env.example` to `.env` and fill in your Azure OpenAI resource:

   ```
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   AZURE_OPENAI_API_KEY=your-key
   AZURE_OPENAI_VERSION=2024-12-01-preview
   ```

2. `npm run dev`, then use the **Azure playground** tab.

The key is read only by the Vite dev server ([`server/azureChat.ts`](server/azureChat.ts)),
which proxies `POST /api/chat` to Azure and streams the completion back as plain
text. The variables have no `VITE_` prefix on purpose: nothing reaches the
browser bundle. That middleware runs under `npm run dev` and `npm run preview`
only — a static production build has no server, so bring your own endpoint.

The playground sends `CONTENT_LANGUAGE_SPEC` as the system prompt. It is editable
in the **System prompt** panel, so you can change the language and see the effect
on the next message; each reply also has a **Source** toggle to read the raw
markup the model produced.

## Streaming

The component is built for content that arrives token by token:

 span that runs across lines all become valid markdown maths
  instead of leaking raw LaTeX into the page;
- a fence that is open (still streaming) renders as a placeholder rather than
  being handed half-finished to Mermaid or a `<video>` element;
- each block sits behind its own error boundary that clears when the block's
  text changes, so a block that is briefly invalid recovers on its own.

Run `npm run dev` and press **Replay as a stream** in the demo to watch it.

## Security

Input is treated as untrusted, always:

- raw HTML is never parsed (`rehype-raw` is deliberately not installed);
- `rehype-sanitize` runs with a narrowed schema — `http`, `https` and `mailto`
  links only, `http(s)` media only, and a tight `className` allowlist so content
  cannot borrow the host app's CSS classes;
- every URL is re-validated in the renderer that uses it;
- YouTube embeds are rebuilt from a validated video id against a fixed origin —
  arbitrary iframes are impossible;
- Mermaid runs with `securityLevel: 'strict'` and KaTeX with `trust` disabled.

`npm test` server-renders a hostile document and asserts that no `javascript:` or
`data:` URL, `<script>`, `onerror` or foreign iframe survives, alongside unit
tests for URL validation, the registry, fence scanning and math normalisation.

## Architecture

```
UniversalContentRenderer.tsx   the only public component
core/
  registry.ts                  type -> renderer map
  BlockDispatcher.tsx          the one place a fence becomes a component
  markdownPlugins.ts           remark/rehype pipeline + sanitize schema
  streaming.ts                 open-fence detection
  BlockErrorBoundary.tsx       per-block failure isolation
markdown/components.tsx        element overrides (pre, img, a, table)
renderers/                     one file per content type
utils/                         URL validation, block parsing
```

Adding a content type means writing a renderer and registering it:

```js
registerRenderer('chart', ChartRenderer)
```

The core parser is untouched. `registerRenderer` is internal for now — it is the
seam that becomes the public plugin API when this moves into its own package.

Nothing here depends on the surrounding application: no design system, no
routing, no state management. Colours are CSS variables defaulting to
`color-mix` over `currentColor`, so the renderer inherits light or dark mode from
its host.

## Scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | demo with a live editor and stream replay |
| `npm run build` | type-check and build |
| `npm run lint` | oxlint |
| `npm test` | run the test suite once |
| `npm run test:watch` | run the suite in watch mode |

The demo has two tabs: the Azure playground, and a sample document with a live
editor and a stream-replay button that needs no credentials.
