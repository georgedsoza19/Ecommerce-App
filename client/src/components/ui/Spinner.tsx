import clsx from 'clsx'

interface SpinnerProps {
  size?: number
  label?: string
  className?: string
}

export function Spinner({ size = 24, label = 'Loading', className }: SpinnerProps) {
  return (
    <span role={label ? 'status' : undefined} className={clsx('inline-flex items-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

export function LoadingBlock({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-center gap-3 py-16 text-ink-faint', className)}>
      <Spinner label={label} />
      <span aria-hidden="true" className="text-sm">
        {label}...
      </span>
    </div>
  )
}
