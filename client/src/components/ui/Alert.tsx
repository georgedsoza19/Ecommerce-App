import type { ReactNode } from 'react'
import clsx from 'clsx'
import { AlertIcon, CheckIcon } from './Icons'

type AlertVariant = 'error' | 'success' | 'info' | 'warning'

const STYLES: Record<AlertVariant, string> = {
  error: 'border-danger/40 bg-danger-bg text-danger',
  success: 'border-brand-200 bg-brand-50 text-brand-800',
  info: 'border-line bg-paper-deep text-ink-soft',
  warning: 'border-warning/40 bg-warning-bg text-warning',
}

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}

export function Alert({ variant = 'info', title, children, action, className }: AlertProps) {
  const Icon = variant === 'success' ? CheckIcon : AlertIcon
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={clsx('flex items-start gap-3 rounded-md border px-4 py-3 text-sm', STYLES[variant], className)}
    >
      <Icon className="mt-0.5 shrink-0" width={18} height={18} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : undefined}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
