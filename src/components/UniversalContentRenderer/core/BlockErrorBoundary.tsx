import { Component, type ErrorInfo, type ReactNode } from 'react'
import { BlockError } from './BlockStatus'

interface Props {
  /** Shown in the fallback so a reader knows which block failed. */
  type: string
  /** Clearing the error when the block's source changes lets streamed content
   * recover once the rest of a block arrives. */
  resetKey: string
  children: ReactNode
}

interface State {
  message?: string
  resetKey?: string
}

/**
 * One boundary per extended block: a renderer that throws degrades to an inline
 * error notice instead of taking the whole document down.
 */
export class BlockErrorBoundary extends Component<Props, State> {
  state: State = {}

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { message: error instanceof Error ? error.message : String(error) }
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (state.resetKey === props.resetKey) return null
    return { message: undefined, resetKey: props.resetKey }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[UniversalContentRenderer] block render failed', error, info)
  }

  render() {
    if (this.state.message) {
      return (
        <BlockError
          title={`Could not render ${this.props.type} block`}
          detail={this.state.message}
        />
      )
    }
    return this.props.children
  }
}
