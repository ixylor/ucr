import { useState } from 'react'
import './App.css'
import { Playground } from './demo/Playground'
import { SampleDemo } from './demo/SampleDemo'

const tabs = [
  { id: 'playground', label: 'Azure playground' },
  { id: 'sample', label: 'Sample document' },
] as const

export default function App() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('playground')

  return (
    <div className="demo">
      <header className="demo__header">
        <h1>UniversalContentRenderer</h1>
        <nav className="demo__tabs">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="demo__main">
        {tab === 'playground' ? <Playground /> : <SampleDemo />}
      </main>
    </div>
  )
}
