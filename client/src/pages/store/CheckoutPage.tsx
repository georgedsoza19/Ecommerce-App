import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { api, getErrorMessage } from '../../api/client'
import type { Address, Order } from '../../api/types'
import { AddressForm } from '../../components/account/AddressForm'
import { Totals } from '../../components/orders/Totals'
import { ProductImage } from '../../components/products/ProductImage'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/button-styles'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { useAddressActions, useAddresses } from '../../hooks/useAddresses'
import { useCart } from '../../hooks/useCart'
import { useMoney } from '../../hooks/useSettings'

function AddressOption({ address, checked, onSelect }: { address: Address; checked: boolean; onSelect: () => void }) {
  return (
    <label
      className={clsx(
        'flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600',
        checked ? 'border-brand-700 bg-brand-50' : 'border-line bg-surface hover:border-ink-faint',
      )}
    >
      <input
        type="radio"
        name="address"
        value={address.id}
        checked={checked}
        onChange={onSelect}
        className="mt-1 size-4 accent-brand-700"
      />
      <span className="text-sm leading-relaxed">
        <span className="block font-medium text-ink">
          {address.fullName}
          {address.isDefault && <span className="ml-2 text-xs font-normal text-brand-700">Default</span>}
        </span>
        <span className="block text-ink-soft">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ''}
        </span>
        <span className="block text-ink-soft">
          {address.city}, {address.region} {address.postalCode}, {address.country}
        </span>
      </span>
    </label>
  )
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const money = useMoney()
  const cart = useCart()
  const addresses = useAddresses()
  const { create } = useAddressActions()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = addresses.data ?? []
  const addressId =
    (selectedId && list.some((a) => a.id === selectedId) ? selectedId : null) ??
    list.find((a) => a.isDefault)?.id ??
    list[0]?.id ??
    null

  const selectAddress = (id: string) => {
    setSelectedId(id)
    setPendingOrderId(null) // a different address means a fresh order
  }

  const placeOrder = async () => {
    if (!addressId) return
    setError(null)
    setPlacing(true)
    try {
      let orderId = pendingOrderId
      if (!orderId) {
        const res = await api.post<{ order: Order }>('/checkout', { addressId })
        orderId = res.order.id
        setPendingOrderId(orderId)
      }
      await api.post<{ order: Order }>(`/checkout/${orderId}/confirm`)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cart'] }),
        qc.invalidateQueries({ queryKey: ['orders'] }),
        qc.invalidateQueries({ queryKey: ['products'] }),
      ])
      navigate(`/account/orders/${orderId}`, { replace: true, state: { placed: true } })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeader title="Checkout" />

      <QueryBoundary query={cart} errorTitle="Could not load your cart">
        {(c) =>
          c.items.length === 0 ? (
            <EmptyState
              title="Nothing to check out"
              description="Your cart is empty."
              action={
                <Link to="/products" className={buttonClasses()}>
                  Browse products
                </Link>
              }
            />
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-16">
              <div className="space-y-12">
                {/* Shipping address */}
                <section aria-labelledby="ship-title">
                  <h2 id="ship-title" className="mb-4 text-2xl">
                    1. Shipping address
                  </h2>
                  <QueryBoundary query={addresses} errorTitle="Could not load your addresses">
                    {(data) => (
                      <>
                        {data.length === 0 && !showForm && (
                          <Alert variant="info" className="mb-4">
                            You have no saved addresses yet. Add one to continue.
                          </Alert>
                        )}
                        {data.length > 0 && (
                          <fieldset className="space-y-3">
                            <legend className="sr-only">Choose a shipping address</legend>
                            {data.map((a) => (
                              <AddressOption key={a.id} address={a} checked={a.id === addressId} onSelect={() => selectAddress(a.id)} />
                            ))}
                          </fieldset>
                        )}

                        {showForm || data.length === 0 ? (
                          <div className="mt-5 rounded-lg border border-line bg-surface p-5">
                            <h3 className="mb-4 font-display text-xl">New address</h3>
                            <AddressForm
                              submitLabel="Save and use this address"
                              onCancel={data.length > 0 ? () => setShowForm(false) : undefined}
                              onSubmit={async (values) => {
                                const res = await create.mutateAsync(values)
                                selectAddress(res.address.id)
                                setShowForm(false)
                              }}
                            />
                          </div>
                        ) : (
                          <Button variant="secondary" className="mt-4" onClick={() => setShowForm(true)}>
                            Add a new address
                          </Button>
                        )}
                      </>
                    )}
                  </QueryBoundary>
                </section>

                {/* Items */}
                <section aria-labelledby="items-title">
                  <h2 id="items-title" className="mb-4 text-2xl">
                    2. Review items
                  </h2>
                  <ul className="divide-y divide-line border-y border-line">
                    {c.items.map((l) => (
                      <li key={l.productId} className="flex items-center gap-4 py-4">
                        <ProductImage src={l.imageUrl} alt={l.name} className="size-16 shrink-0 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{l.name}</p>
                          <p className="text-sm text-ink-faint">
                            Qty {l.quantity} x {money(l.unitPriceCents)}
                          </p>
                        </div>
                        <p className="tabular-nums">{money(l.lineTotalCents)}</p>
                      </li>
                    ))}
                  </ul>
                  <Link to="/cart" className="mt-3 inline-block text-sm font-medium text-brand-700 underline underline-offset-2">
                    Edit cart
                  </Link>
                </section>

                <section aria-labelledby="pay-title">
                  <h2 id="pay-title" className="mb-4 text-2xl">
                    3. Payment
                  </h2>
                  <Alert variant="info" title="Demo payment">
                    Payments are simulated in this demo. No card details are needed - confirming will mark the order as paid.
                  </Alert>
                </section>
              </div>

              <aside aria-label="Order summary" className="h-fit rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-24">
                <h2 className="mb-5 text-2xl">Order total</h2>
                <Totals
                  subtotalCents={c.subtotalCents}
                  discountCents={c.discountCents}
                  shippingCents={c.shippingCents}
                  taxCents={c.taxCents}
                  totalCents={c.totalCents}
                  couponCode={c.coupon?.code}
                />
                {error && (
                  <Alert variant="error" className="mt-5" title={pendingOrderId ? 'Payment did not go through' : 'Could not place order'}>
                    {error}
                    {pendingOrderId && ' Your order is saved; you can retry payment.'}
                  </Alert>
                )}
                <Button size="lg" block className="mt-6" onClick={placeOrder} loading={placing} disabled={!addressId}>
                  {pendingOrderId ? 'Retry payment' : `Pay ${money(c.totalCents)}`}
                </Button>
                {!addressId && <p className="mt-3 text-sm text-ink-faint">Select or add an address to continue.</p>}
              </aside>
            </div>
          )
        }
      </QueryBoundary>
    </div>
  )
}
