interface BlockErrorProps {
  title: string
  detail?: string
}

export function BlockError({ title, detail }: BlockErrorProps) {
  return (
    <span className="ucr-block-error" role="alert">
      <strong>{title}</strong>
      {detail ? <span className="ucr-block-error__detail">{detail}</span> : null}
    </span>
  )
}

export function BlockLoading({ label }: { label: string }) {
  return (
    <span className="ucr-block-loading" role="status" aria-live="polite">
      <span className="ucr-block-loading__bar" aria-hidden="true" />
      <span className="ucr-visually-hidden">{label}</span>
    </span>
  )
}
