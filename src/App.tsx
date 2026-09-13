import { useState } from 'react'
import './site/site.css'
import { Playground } from './demo/Playground'
import { usePlaygroundStatus } from './demo/useAzureChat'
import { Docs } from './site/Docs'
import { Landing } from './site/Landing'
import { Logo } from './site/Logo'
import { brand } from './site/brand'

type View = 'home' | 'docs' | 'playground'

export default function App() {
  const [view, setView] = useState<View>('home')
  const status = usePlaygroundStatus()

  return (
    <div className="page">
      <header className="masthead">
        <a className="masthead__mark" href="#top" onClick={() => setView('home')}>
          <Logo size={26} />
          <span className="masthead__name">{brand.name}</span>
          <span className="masthead__full">{brand.fullName}</span>
        </a>

        <nav className="masthead__nav">
          {view === 'home' ? (
            <>
              <a href="#try">Try it</a>
              <a href="#install">Install</a>
              <a href="#prompt">Prompt</a>
            </>
          ) : (
            <button type="button" className="link" onClick={() => setView('home')}>
              Back to the page
            </button>
          )}
          <button
            type="button"
            className="link"
            onClick={() => setView(view === 'docs' ? 'home' : 'docs')}
          >
            {view === 'docs' ? 'Close docs' : 'Docs'}
          </button>
          {status?.configured ? (
            <button
              type="button"
              className="link"
              onClick={() => setView(view === 'playground' ? 'home' : 'playground')}
            >
              {view === 'playground' ? 'Close playground' : 'Playground'}
            </button>
          ) : null}
          <a
            className="masthead__star"
            href={brand.repository}
            target="_blank"
            rel="noopener noreferrer"
          >
            Star on GitHub
          </a>
        </nav>
      </header>

      <main id="top" className={view === 'playground' ? 'main main--full' : 'main'}>
        {view === 'playground' ? <Playground /> : view === 'docs' ? <Docs /> : <Landing />}
      </main>

      <footer className="colophon">
        <p>
          {brand.fullName} is MIT licensed and built on react-markdown, KaTeX and
          Mermaid. Everything on this page renders in your browser.
        </p>
        <p className="colophon__meta">
          <a href={brand.repository} target="_blank" rel="noopener noreferrer">
            Star the repository
          </a>
          <a href={`${brand.repository}/issues`} target="_blank" rel="noopener noreferrer">
            Report an issue
          </a>
          <a href={brand.author.url} target="_blank" rel="noopener noreferrer">
            {brand.author.name}
          </a>
        </p>
      </footer>
    </div>
  )
}
