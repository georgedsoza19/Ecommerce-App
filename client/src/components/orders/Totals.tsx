import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useMoney } from '../../hooks/useSettings'

interface TotalsProps {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  couponCode?: string | null
  className?: string
}

function Row({ label, children, strong }: { label: ReactNode; children: ReactNode; strong?: boolean }) {
  return (
    <div className={clsx('flex items-baseline justify-between gap-4', strong && 'border-t border-line pt-3 text-lg font-semibold')}>
      <dt className={clsx(!strong && 'text-ink-soft')}>{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}

export function Totals({ subtotalCents, discountCents, shippingCents, taxCents, totalCents, couponCode, className }: TotalsProps) {
  const money = useMoney()
  return (
    <dl className={clsx('space-y-2.5 text-[0.95rem]', className)}>
      <Row label="Subtotal">{money(subtotalCents)}</Row>
      {discountCents > 0 && (
        <Row label={couponCode ? `Discount (${couponCode})` : 'Discount'}>
          <span className="text-brand-700">-{money(discountCents)}</span>
        </Row>
      )}
      <Row label="Shipping">{shippingCents === 0 ? 'Free' : money(shippingCents)}</Row>
      <Row label="Tax">{money(taxCents)}</Row>
      <Row label="Total" strong>
        {money(totalCents)}
      </Row>
    </dl>
  )
}
