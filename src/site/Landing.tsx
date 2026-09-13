import { useRef, useState } from 'react'
import { CONTENT_LANGUAGE_SPEC } from '../components/UniversalContentRenderer'
import { LiveEditor } from './LiveEditor'
import { brand, installCommand } from './brand'
import { examples } from './examples'
import { asciiWordmark } from './wordmark'

const usage = `import { UniversalContentRenderer } from '@/components/universal-content-renderer'

<UniversalContentRenderer content={content} />`

function useCopy() {
  const [copied, setCopied] = useState<string>()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(undefined), 2000)
    } catch {
      setCopied(undefined)
    }
  }

  return { copied, copy }
}

export function Landing() {
  const [selected, setSelected] = useState(examples[0])
  const [content, setContent] = useState(examples[0].content)
  const [heroContent, setHeroContent] = useState(examples[0].content)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const clipboard = useCopy()
  const command = installCommand()

  const choose = (example: (typeof examples)[number]) => {
    setSelected(example)
    setContent(example.content)
  }

  const focusEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    editorRef.current?.focus({ preventScroll: true })
  }

  return (
    <>
      <section className="hero">
        <div className="hero__top">
        <div className="hero__words">
          <h1>
            One string in.
            <br />A typeset document out.
          </h1>
          <p className="hero__lede">
            A React component for content you did not write: model output, user
            input, anything arriving a token at a time. It reads markdown,
            mathematics, code, diagrams and media from a single string and renders
            them as the text arrives.
          </p>
          <pre className="hero__usage">
            <code>{usage}</code>
          </pre>
        </div>

          <aside className="hero__aside">
            <pre className="hero__wordmark" aria-hidden="true">
              {asciiWordmark}
            </pre>
            <p className="hero__asideNote">{brand.tagline}</p>
          </aside>
        </div>

        <LiveEditor
          content={heroContent}
          onChange={setHeroContent}
          autoPlay
          label="Streaming in"
        />
      </section>

      <section className="section" id="try">
        <h2>Try it</h2>
        <p className="section__lede">
          Pick an example, or replace the source with anything you like. Nothing
          leaves your browser.
        </p>

        <div className="chips" role="tablist" aria-label="Examples">
          {examples.map((example) => (
            <button
              key={example.id}
              type="button"
              role="tab"
              aria-selected={selected.id === example.id}
              className="chip"
              onClick={() => choose(example)}
            >
              {example.name}
            </button>
          ))}
        </div>
        <p className="chips__caption">{selected.shows}</p>

        <LiveEditor ref={editorRef} content={content} onChange={setContent} />
      </section>

      <section className="section" id="install">
        <h2>Add it to your project</h2>
        <p className="section__lede">
          {brand.name} is not on npm yet. The shadcn CLI copies the component
          straight into your codebase and installs what it needs, so you own the
          files and can change anything.
        </p>

        <div className="command">
          <code>{command}</code>
          <button
            type="button"
            className="button"
            onClick={() => clipboard.copy('install', command)}
          >
            {clipboard.copied === 'install' ? 'Copied' : 'Copy'}
          </button>
        </div>

        <dl className="facts facts--tight">
          <div>
            <dt>What lands in your project</dt>
            <dd>
              Twenty-eight files under{' '}
              <code>components/universal-content-renderer/</code>, including the
              renderers, the sanitising pipeline and the stylesheet.
            </dd>
          </div>
          <div>
            <dt>What it pulls in</dt>
            <dd>
              react-markdown, remark-gfm, remark-math, rehype-katex,
              rehype-sanitize, katex, mermaid, highlight.js and unist-util-visit.
              No Tailwind, no design system.
            </dd>
          </div>
          <div>
            <dt>If you have never used the CLI</dt>
            <dd>
              Run <code>npx shadcn@latest init</code> once first. It writes a{' '}
              <code>components.json</code> that tells the CLI where your components
              live.
            </dd>
          </div>
          <div>
            <dt>Prefer to vendor it yourself</dt>
            <dd>
              Copy{' '}
              <a href={brand.repository} target="_blank" rel="noopener noreferrer">
                src/components/UniversalContentRenderer
              </a>{' '}
              out of the repository. It has no imports outside its own folder.
            </dd>
          </div>
        </dl>
      </section>

      <section className="section" id="prompt">
        <h2>Use it with any model</h2>
        <p className="section__lede">
          The renderer reads a small language built on markdown. Hand that language
          to a model and its answers arrive as documents rather than walls of text.
        </p>

        <ol className="steps">
          <li>
            <p>
              Copy the language. It describes every block the renderer
              understands, with examples of each.
            </p>
            <button
              type="button"
              className="button"
              onClick={() => clipboard.copy('prompt', CONTENT_LANGUAGE_SPEC)}
            >
              {clipboard.copied === 'prompt' ? 'Copied to clipboard' : 'Copy the prompt'}
            </button>
          </li>
          <li>
            <p>
              Paste it into ChatGPT, Claude or any model as the system prompt or
              the first message, then ask your question.
            </p>
          </li>
          <li>
            <p>Paste the reply into the editor above to see it rendered.</p>
            <button type="button" className="button button--quiet" onClick={focusEditor}>
              Jump to the editor
            </button>
          </li>
        </ol>
      </section>

      <section className="section" id="about">
        <h2>What it handles for you</h2>
        <dl className="facts">
          <div>
            <dt>Untrusted input</dt>
            <dd>
              Raw HTML is never parsed. URLs are restricted to http, https and
              mailto, then checked again by each renderer, and embeds are rebuilt
              from validated ids rather than pasted through.
            </dd>
          </div>
          <div>
            <dt>Half-written content</dt>
            <dd>
              A fence that has not closed renders as a placeholder instead of being
              handed to a diagram engine mid-sentence, and the maths delimiters
              models actually emit are normalised before parsing.
            </dd>
          </div>
          <div>
            <dt>Broken blocks</dt>
            <dd>
              Every block sits behind its own error boundary, so an invalid diagram
              becomes a small notice and the rest of the document still renders.
            </dd>
          </div>
          <div>
            <dt>New content types</dt>
            <dd>
              Renderers live in a registry keyed by fence type. Adding charts or
              custom blocks is a component and one registration, not a change to
              the parser.
            </dd>
          </div>
        </dl>
      </section>
    </>
  )
}
