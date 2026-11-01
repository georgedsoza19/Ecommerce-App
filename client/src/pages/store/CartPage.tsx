import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import type { Cart, CartLine } from '../../api/types'
import { Totals } from '../../components/orders/Totals'
import { ProductImage } from '../../components/products/ProductImage'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/button-styles'
import { EmptyState } from '../../components/ui/EmptyState'
import { MinusIcon, PlusIcon, TrashIcon } from '../../components/ui/Icons'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { useCart, useCartActions } from '../../hooks/useCart'
import { useMoney, useSettings } from '../../hooks/useSettings'

function CartLineRow({ line }: { line: CartLine }) {
  const money = useMoney()
  const { updateItem, removeItem } = useCartActions()
  const busy = updateItem.isPending || removeItem.isPending

  return (
    <li className="flex gap-4 py-6 sm:gap-6">
      <Link to={`/products/${line.slug}`} className="block size-24 shrink-0 overflow-hidden rounded-md bg-paper-deep sm:size-28">
        <ProductImage src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <Link to={`/products/${line.slug}`} className="font-medium text-ink hover:text-brand-700">
              {line.name}
            </Link>
            <p className="text-sm text-ink-faint">{money(line.unitPriceCents)} each</p>
          </div>
          <p className="font-medium tabular-nums">{money(line.lineTotalCents)}</p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div role="group" aria-label={`Quantity for ${line.name}`} className="inline-flex h-10 items-center rounded-md border border-line bg-surface">
            <button
              type="button"
              className="flex size-10 items-center justify-center text-ink-soft hover:text-brand-700 disabled:opacity-40"
              aria-label={`Decrease quantity of ${line.name}`}
              disabled={busy}
              onClick={() =>
                line.quantity <= 1
                  ? removeItem.mutate(line.productId)
                  : updateItem.mutate({ productId: line.productId, quantity: line.quantity - 1 })
              }
            >
              <MinusIcon width={16} height={16} />
            </button>
            <output aria-live="polite" className="w-9 text-center text-sm tabular-nums">
              {line.quantity}
            </output>
            <button
              type="button"
              className="flex size-10 items-center justify-center text-ink-soft hover:text-brand-700 disabled:opacity-40"
              aria-label={`Increase quantity of ${line.name}`}
              disabled={busy || line.quantity >= line.stock}
              onClick={() => updateItem.mutate({ productId: line.productId, quantity: line.quantity + 1 })}
            >
              <PlusIcon width={16} height={16} />
            </button>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-ink-soft hover:text-danger disabled:opacity-40"
            disabled={busy}
            onClick={() => removeItem.mutate(line.productId)}
          >
            <TrashIcon width={16} height={16} />
            Remove
            <span className="sr-only"> {line.name}</span>
          </button>
        </div>
        {line.quantity >= line.stock && <p className="mt-2 text-xs text-warning">Maximum available quantity.</p>}
      </div>
    </li>
  )
}

function CouponBox({ cart }: { cart: Cart }) {
  const { applyCoupon, removeCoupon } = useCartActions()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (code.trim().length < 2) {
      setError('Enter a coupon code.')
      return
    }
    try {
      await applyCoupon.mutateAsync(code.trim())
      setCode('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (cart.coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md bg-brand-50 px-4 py-3 text-sm">
        <p>
          <span className="font-semibold text-brand-800">{cart.coupon.code}</span> applied
        </p>
        <Button variant="ghost" size="sm" loading={removeCoupon.isPending} onClick={() => removeCoupon.mutate()}>
          Remove
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex items-start gap-2">
        <Input
          label="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={error ?? undefined}
          autoComplete="off"
          wrapperClassName="flex-1"
          className="uppercase"
        />
        <Button type="submit" variant="secondary" className="mt-[1.7rem]" loading={applyCoupon.isPending}>
          Apply
        </Button>
      </div>
    </form>
  )
}

export function CartPage() {
  const cart = useCart()
  const { data: settings } = useSettings()
  const money = useMoney()

  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeader title="Your cart" />
      <QueryBoundary query={cart} errorTitle="Could not load your cart">
        {(c) =>
          c.items.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Find something you like and it will wait for you here."
              action={
                <Link to="/products" className={buttonClasses()}>
                  Start shopping
                </Link>
              }
            />
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-16">
              <section aria-label="Cart items">
                <ul className="divide-y divide-line border-y border-line">
                  {c.items.map((line) => (
                    <CartLineRow key={line.productId} line={line} />
                  ))}
                </ul>
              </section>

              <aside aria-label="Order summary" className="h-fit rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-24">
                <h2 className="mb-5 text-2xl">Summary</h2>
                <CouponBox cart={c} />
                <Totals
                  className="mt-6"
                  subtotalCents={c.subtotalCents}
                  discountCents={c.discountCents}
                  shippingCents={c.shippingCents}
                  taxCents={c.taxCents}
                  totalCents={c.totalCents}
                  couponCode={c.coupon?.code}
                />
                {settings && c.shippingCents > 0 && (
                  <p className="mt-4 text-sm text-ink-soft">
                    Add {money(Math.max(0, settings.freeShippingThresholdCents - (c.subtotalCents - c.discountCents)))} more for free
                    shipping.
                  </p>
                )}
                <Link to="/checkout" className={buttonClasses({ size: 'lg', block: true, className: 'mt-6' })}>
                  Continue to checkout
                </Link>
              </aside>
            </div>
          )
        }
      </QueryBoundary>
    </div>
  )
}
