import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, ApiError, getErrorMessage } from '../../api/client'
import type { Order, ReturnRequest } from '../../api/types'
import { Totals } from '../../components/orders/Totals'
import { ProductImage } from '../../components/products/ProductImage'
import { Alert } from '../../components/ui/Alert'
import { OrderStatusBadge, ReturnStatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/button-styles'
import { EmptyState } from '../../components/ui/EmptyState'
import { Textarea } from '../../components/ui/Input'
import { LoadingBlock } from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { useMoney } from '../../hooks/useSettings'
import { formatDateTime } from '../../lib/format'

const returnSchema = z.object({
  reason: z.string().trim().min(10, 'Please give a little more detail (at least 10 characters)').max(1000),
})
type ReturnValues = z.infer<typeof returnSchema>

function ReturnSection({ order }: { order: Order }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const returns = useQuery({
    queryKey: ['returns'],
    queryFn: () => api.get<{ returnRequests: ReturnRequest[] }>('/account/returns'),
    select: (d) => d.returnRequests.filter((r) => r.orderId === order.id),
  })

  const create = useMutation({
    mutationFn: (v: ReturnValues) => api.post<{ returnRequest: ReturnRequest }>(`/orders/${order.id}/returns`, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnValues>({ resolver: zodResolver(returnSchema), defaultValues: { reason: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await create.mutateAsync(values)
      toast.success('Return request submitted')
      setOpen(false)
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  const existing = returns.data ?? []
  const active = existing.some((r) => r.status !== 'REJECTED')

  if (returns.isPending && order.status === 'DELIVERED') return <LoadingBlock className="py-6" />

  return (
    <section aria-labelledby="returns-title" className="mt-10">
      <h2 id="returns-title" className="mb-4 text-2xl">
        Returns
      </h2>
      {existing.length > 0 && (
        <ul className="mb-4 space-y-3">
          {existing.map((r) => (
            <li key={r.id} className="rounded-md border border-line bg-surface p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Requested {formatDateTime(r.createdAt)}</p>
                <ReturnStatusBadge status={r.status} />
              </div>
              <p className="mt-2 text-ink-soft">{r.reason}</p>
              {r.adminNote && (
                <p className="mt-2 border-l-2 border-brand-200 pl-3 text-ink-soft">
                  <span className="font-medium text-ink">Note from our team:</span> {r.adminNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {order.status !== 'DELIVERED' && existing.length === 0 && (
        <p className="text-sm text-ink-soft">Returns can be requested once your order has been delivered.</p>
      )}

      {order.status === 'DELIVERED' && !active && !open && (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Request a return
        </Button>
      )}

      {order.status === 'DELIVERED' && !active && open && (
        <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-4 rounded-lg border border-line bg-surface p-5">
          {serverError && <Alert variant="error">{serverError}</Alert>}
          <Textarea
            label="Why are you returning this order?"
            required
            error={errors.reason?.message}
            {...register('reason')}
          />
          <div className="flex gap-3">
            <Button type="submit" loading={create.isPending}>
              Submit request
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const money = useMoney()
  const placed = (location.state as { placed?: boolean } | null)?.placed === true

  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.get<{ order: Order }>(`/orders/${id}`),
    select: (d) => d.order,
    retry: (count, err) => !(err instanceof ApiError && [403, 404].includes(err.status)) && count < 2,
  })

  if (query.isPending) return <LoadingBlock label="Loading order" className="min-h-[50vh]" />

  if (query.isError) {
    const missing = query.error instanceof ApiError && [403, 404].includes(query.error.status)
    return (
      <div className="container-page py-16">
        {missing ? (
          <EmptyState
            title="Order not found"
            description="We couldn't find that order on your account."
            action={
              <Link to="/account/orders" className={buttonClasses()}>
                View my orders
              </Link>
            }
          />
        ) : (
          <Alert
            variant="error"
            title="Could not load this order"
            action={
              <Button size="sm" variant="secondary" onClick={() => query.refetch()}>
                Try again
              </Button>
            }
          >
            {getErrorMessage(query.error)}
          </Alert>
        )}
      </div>
    )
  }

  const order = query.data
  const a = order.shippingAddress

  return (
    <div className="container-page py-10 sm:py-14">
      <Link to="/account/orders" className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline">
        Back to orders
      </Link>

      {placed && (
        <Alert variant="success" className="mt-5" title="Thank you - your order is confirmed">
          We've received your payment for order {order.orderNumber}. You'll find its progress on this page.
        </Alert>
      )}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Order {order.orderNumber}</h1>
          <p className="mt-1 text-ink-soft">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
        <section aria-labelledby="order-items">
          <h2 id="order-items" className="mb-4 text-2xl">
            Items
          </h2>
          <ul className="divide-y divide-line border-y border-line">
            {order.items.map((i) => (
              <li key={i.productId} className="flex items-center gap-4 py-4">
                <ProductImage src={i.imageUrl} alt={i.name} className="size-16 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-sm text-ink-faint">
                    Qty {i.quantity} x {money(i.unitPriceCents)}
                  </p>
                </div>
                <p className="tabular-nums">{money(i.lineTotalCents)}</p>
              </li>
            ))}
          </ul>
          <ReturnSection order={order} />
        </section>

        <aside className="space-y-8">
          <section aria-labelledby="order-total" className="rounded-lg border border-line bg-surface p-6">
            <h2 id="order-total" className="mb-4 text-xl">
              Summary
            </h2>
            <Totals
              subtotalCents={order.subtotalCents}
              discountCents={order.discountCents}
              shippingCents={order.shippingCents}
              taxCents={order.taxCents}
              totalCents={order.totalCents}
              couponCode={order.couponCode}
            />
            {order.paidAt && <p className="mt-4 text-sm text-ink-faint">Paid {formatDateTime(order.paidAt)}</p>}
          </section>

          <section aria-labelledby="order-ship">
            <h2 id="order-ship" className="mb-2 text-xl">
              Ships to
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
            </address>
          </section>
        </aside>
      </div>
    </div>
  )
}
