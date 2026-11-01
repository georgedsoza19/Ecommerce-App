import type { ReactNode } from 'react'
import clsx from 'clsx'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center',
        className,
      )}
    >
      <span aria-hidden="true" className="mb-5 h-px w-12 bg-brand-700" />
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      {description && <p className="mt-2 text-ink-soft">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
