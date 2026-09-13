import { BlockLoading } from './BlockStatus'

/** Placeholder for an extended block whose closing fence has not arrived yet. */
export function StreamingBlock({ type, value }: { type: string; value: string }) {
  return (
    <div className="ucr-streaming-block" data-block-type={type}>
      <BlockLoading label={`Receiving ${type} block`} />
      <pre className="ucr-code">
        <code>{value}</code>
      </pre>
    </div>
  )
}
