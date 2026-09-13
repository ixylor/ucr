/**
 * A chevron beside three set lines: source on the left, the document it becomes
 * on the right. Drawn on a 32px grid so it stays legible as a favicon.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.2"
        y="1.2"
        width="29.6"
        height="29.6"
        rx="7.4"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.28"
      />
      <path
        d="M9.5 10.5 13 16l-3.5 5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 11.5h6M17.5 16h5M17.5 20.5h3.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
