import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, posix, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Emits a shadcn registry item so the component can be installed with
 *
 *   npx shadcn@latest add https://<deployment>/r/universal-content-renderer.json
 *
 * The file list and the dependency list are both read from the real source, so
 * the registry cannot drift from what the repository actually contains.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'src/components/UniversalContentRenderer')
const outputDir = join(root, 'public/r')
const outputFile = join(outputDir, 'universal-content-renderer.json')

const TARGET_ROOT = 'components/universal-content-renderer'
const SKIP_DIRECTORIES = new Set(['__tests__'])

/** Runtime packages the component imports directly. */
const DEPENDENCIES = [
  'react-markdown',
  'remark-gfm',
  'remark-math',
  'rehype-katex',
  'rehype-sanitize',
  'katex',
  'mermaid',
  'highlight.js',
  'unist-util-visit',
]

function registryType(path) {
  return path.endsWith('.css') ? 'registry:file' : 'registry:component'
}

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue
      files.push(...(await collect(full)))
      continue
    }
    if (entry.name.includes('.test.')) continue
    files.push(full)
  }

  return files
}

async function build() {
  const paths = (await collect(source)).sort()
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

  const dependencies = DEPENDENCIES.map((name) => {
    const range = packageJson.dependencies[name]
    if (!range) throw new Error(`${name} is listed in the registry but not installed`)
    return `${name}@${range.replace(/^[\^~]/, '')}`
  })

  const files = await Promise.all(
    paths.map(async (path) => {
      const target = posix.join(TARGET_ROOT, relative(source, path).split(/[\\/]/).join('/'))
      return {
        path: target,
        target,
        type: registryType(path),
        content: await readFile(path, 'utf8'),
      }
    }),
  )

  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: 'universal-content-renderer',
    type: 'registry:component',
    title: 'Universal Content Renderer',
    description:
      'Renders one string as markdown, mathematics, code, diagrams and media. ' +
      'Safe with untrusted input and built for streaming model output.',
    dependencies,
    files,
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputFile, `${JSON.stringify(item, null, 2)}\n`)

  console.log(
    `registry: ${files.length} files, ${dependencies.length} dependencies -> ${relative(root, outputFile)}`,
  )
}

await build()
