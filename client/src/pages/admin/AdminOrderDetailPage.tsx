import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '../../api/client'
import { ORDER_STATUSES } from '../../api/types'
import type { AdminOrder, OrderStatus } from '../../api/types'
import { Totals } from '../../components/orders/Totals'
import { ProductImage } from '../../components/products/ProductImage'
import { OrderStatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../context/ToastContext'
import { useMoney } from '../../hooks/useSettings'
import { formatDateTime, statusLabel } from '../../lib/format'

function StatusEditor({ order }: { order: AdminOrder }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [status, setStatus] = useState<OrderStatus>(order.status)

  const update = useMutation({
    mutationFn: (next: OrderStatus) => api.patch<{ order: AdminOrder }>(`/admin/orders/${order.id}/status`, { status: next }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'orders'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'order', order.id] }),
        qc.invalidateQueries({ queryKey: ['admin', 'metrics'] }),
      ])
      toast.success(`Order marked ${statusLabel(status).toLowerCase()}`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select
        label="Order status"
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        wrapperClassName="w-56"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </Select>
      <Button onClick={() => update.mutate(status)} loading={update.isPending} disabled={status === order.status}>
        Update status
      </Button>
    </div>
  )
}

export function AdminOrderDetailPage() {
  const { id = '' } = useParams()
  const money = useMoney()
  const query = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => api.get<{ order: AdminOrder }>(`/admin/orders/${id}`),
    select: (d) => d.order,
  })

  return (
    <>
      <Link to="/admin/orders" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:underline">
        Back to orders
      </Link>
      <QueryBoundary query={query} errorTitle="Could not load this order">
        {(order) => {
          const a = order.shippingAddress
          return (
            <>
              <PageHeader
                title={`Order ${order.orderNumber}`}
                description={`Placed ${formatDateTime(order.createdAt)}`}
                actions={<OrderStatusBadge status={order.status} />}
              />

              <div className="grid gap-10 xl:grid-cols-[1fr_22rem]">
                <div className="space-y-10">
                  <section aria-labelledby="status-title" className="rounded-lg border border-line bg-surface p-5">
                    <h2 id="status-title" className="mb-4 text-xl">
                      Fulfilment
                    </h2>
                    <StatusEditor key={order.status} order={order} />
                  </section>

                  <section aria-labelledby="items-title">
                    <h2 id="items-title" className="mb-4 text-xl">
                      Items
                    </h2>
                    <ul className="divide-y divide-line border-y border-line">
                      {order.items.map((i) => (
                        <li key={i.productId} className="flex items-center gap-4 py-3">
                          <ProductImage src={i.imageUrl} alt="" fallbackLabel={i.name} className="size-14 shrink-0 rounded-md object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{i.name}</p>
                            <p className="text-xs text-ink-faint">
                              SKU {i.sku} - {i.quantity} x {money(i.unitPriceCents)}
                            </p>
                          </div>
                          <p className="tabular-nums">{money(i.lineTotalCents)}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <aside className="space-y-8">
                  <section aria-labelledby="totals-title" className="rounded-lg border border-line bg-surface p-5">
                    <h2 id="totals-title" className="mb-4 text-xl">
                      Totals
                    </h2>
                    <Totals
                      subtotalCents={order.subtotalCents}
                      discountCents={order.discountCents}
                      shippingCents={order.shippingCents}
                      taxCents={order.taxCents}
                      totalCents={order.totalCents}
                      couponCode={order.couponCode}
                    />
                    {order.paymentRef && <p className="mt-4 break-all text-xs text-ink-faint">Payment ref: {order.paymentRef}</p>}
                    {order.paidAt && <p className="text-xs text-ink-faint">Paid {formatDateTime(order.paidAt)}</p>}
                  </section>

                  <section aria-labelledby="customer-title">
                    <h2 id="customer-title" className="mb-2 text-xl">
                      Customer
                    </h2>
                    {order.customer ? (
                      <p className="text-sm text-ink-soft">
                        {order.customer.name}
                        <br />
                        <a className="underline underline-offset-2" href={`mailto:${order.customer.email}`}>
                          {order.customer.email}
                        </a>
                      </p>
                    ) : (
                      <p className="text-sm text-ink-faint">Customer account removed.</p>
                    )}
                  </section>

                  <section aria-labelledby="ship-title">
                    <h2 id="ship-title" className="mb-2 text-xl">
                      Ship to
                    </h2>
                    <address className="text-sm not-italic leading-relaxed text-ink-soft">
                      {a.fullName}
                      <br />
                      {a.line1}
                      {a.line2 && (
                        <>
                          <br />
                          {a.line2}
                        </>
                      )}
                      <br />
                      {a.city}, {a.region} {a.postalCode}
                      <br />
                      {a.country}
                      {a.phone && (
                        <>
                          <br />
                          {a.phone}
                        </>
                      )}
                    </address>
                  </section>
                </aside>
              </div>
            </>
          )
        }}
      </QueryBoundary>
    </>
  )
}
