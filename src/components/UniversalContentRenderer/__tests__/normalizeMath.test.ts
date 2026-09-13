import { describe, expect, it } from 'vitest'
import { normalizeMath } from '../core/normalizeMath'

describe('normalizeMath', () => {
  it('rewrites LaTeX display delimiters to $$', () => {
    const result = normalizeMath('Before \\[ x = y \\] after')
    expect(result).toContain('$$\nx = y\n$$')
    expect(result).not.toContain('\\[')
  })

  it('rewrites LaTeX inline delimiters to $', () => {
    expect(normalizeMath('the value \\( x^2 \\) here')).toBe('the value $x^2$ here')
  })

  it('promotes a multi-line dollar span to display maths', () => {
    const input = '$ X = \\begin{pmatrix}\n1 & 2\n\\end{pmatrix} $'
    const result = normalizeMath(input)
    expect(result).toContain('$$\nX = \\begin{pmatrix}\n1 & 2\n\\end{pmatrix}\n$$')
  })

  it('leaves single-line inline maths untouched', () => {
    const input = 'the sum $\\frac{a}{b}$ converges'
    expect(normalizeMath(input)).toBe(input)
  })

  it('leaves prose about money untouched', () => {
    const input = 'It costs $5 today\nand $10 tomorrow.'
    expect(normalizeMath(input)).toBe(input)
  })

  it('does not touch maths inside a fenced code block', () => {
    const input = '```latex\n\\[ x = y \\]\n```'
    expect(normalizeMath(input)).toBe(input)
  })

  it('does not touch maths inside an inline code span', () => {
    const input = 'write `\\(x\\)` for inline maths'
    expect(normalizeMath(input)).toBe(input)
  })

  it('protects an unterminated fence to the end of the input', () => {
    const input = '```latex\n\\[ x = y \\]\nstill streaming'
    expect(normalizeMath(input)).toBe(input)
  })

  it('leaves a half-streamed delimiter alone until it closes', () => {
    const partial = 'The answer is \\[ x = \\frac{'
    expect(normalizeMath(partial)).toBe(partial)
  })

  it('returns the input unchanged when it contains no backslash', () => {
    const input = '# Heading\n\nPlain $text$ only.'
    expect(normalizeMath(input)).toBe(input)
  })
})
