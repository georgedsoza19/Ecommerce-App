import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { Metrics, RecentOrder } from '../../api/types'
import { OrderStatusBadge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { DataTable, Td, Th } from '../../components/ui/Table'
import { formatDate, formatMoney } from '../../lib/format'

interface MetricsResponse {
  metrics: Metrics
  recentOrders: RecentOrder[]
}

function Stat({ label, value, to, note }: { label: string; value: string; to?: string; note?: string }) {
  const body = (
    <>
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-1 font-display text-4xl tabular-nums text-brand-800">{value}</dd>
      {note && <p className="mt-1 text-xs text-ink-faint">{note}</p>}
    </>
  )
  return (
    <div className="border-t-2 border-brand-700 pt-4">
      {to ? (
        <Link to={to} className="block rounded-sm hover:opacity-80">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  )
}

export function AdminOverviewPage() {
  const query = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => api.get<MetricsResponse>('/admin/metrics'),
  })

  return (
    <>
      <PageHeader title="Overview" description="How the store is doing right now." />
      <QueryBoundary query={query} errorTitle="Could not load metrics">
        {({ metrics, recentOrders }) => (
          <>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-5">
              <Stat label="Revenue" value={formatMoney(metrics.revenueCents, metrics.currency)} />
              <Stat label="Orders" value={String(metrics.orderCount)} to="/admin/orders" />
              <Stat label="Customers" value={String(metrics.customerCount)} />
              <Stat
                label="Low stock"
                value={String(metrics.lowStockCount)}
                to="/admin/products"
                note={metrics.lowStockCount ? 'products need restocking' : 'all stocked'}
              />
              <Stat
                label="Open returns"
                value={String(metrics.openReturns)}
                to="/admin/returns"
                note={metrics.openReturns ? 'awaiting a decision' : 'nothing pending'}
              />
            </dl>

            <section className="mt-14" aria-labelledby="recent-title">
              <div className="mb-4 flex items-end justify-between">
                <h2 id="recent-title" className="text-2xl">
                  Recent orders
                </h2>
                <Link to="/admin/orders" className="text-sm font-medium text-brand-700 hover:underline">
                  All orders
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <EmptyState title="No orders yet" description="Orders will appear here as customers check out." />
              ) : (
                <DataTable caption="Recent orders">
                  <thead>
                    <tr>
                      <Th>Order</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Total</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <Td>
                          <Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-700 hover:underline">
                            {o.orderNumber}
                          </Link>
                        </Td>
                        <Td>{formatDate(o.createdAt)}</Td>
                        <Td>
                          <OrderStatusBadge status={o.status} />
                        </Td>
                        <Td className="text-right tabular-nums">{formatMoney(o.totalCents, metrics.currency)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              )}
            </section>
          </>
        )}
      </QueryBoundary>
    </>
  )
}
