import type { ReactNode } from 'react'
import clsx from 'clsx'
import type { OrderStatus, ReturnStatus } from '../../api/types'
import { statusLabel } from '../../lib/format'

type Tone = 'neutral' | 'green' | 'amber' | 'red'

const TONES: Record<Tone, string> = {
  neutral: 'bg-paper-deep text-ink-soft',
  green: 'bg-brand-50 text-brand-800',
  amber: 'bg-warning-bg text-warning',
  red: 'bg-danger-bg text-danger',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone])}>
      {children}
    </span>
  )
}

const ORDER_TONES: Record<OrderStatus, Tone> = {
  PENDING_PAYMENT: 'amber',
  PAID: 'green',
  PROCESSING: 'green',
  SHIPPED: 'green',
  DELIVERED: 'green',
  CANCELLED: 'red',
}

const RETURN_TONES: Record<ReturnStatus, Tone> = {
  REQUESTED: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  REFUNDED: 'neutral',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONES[status] ?? 'neutral'}>{statusLabel(status)}</Badge>
}

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return <Badge tone={RETURN_TONES[status] ?? 'neutral'}>{statusLabel(status)}</Badge>
}
