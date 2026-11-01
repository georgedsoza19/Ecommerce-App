import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { ORDER_STATUSES } from '../../api/types'
import type { AdminOrder } from '../../api/types'
import { OrderStatusBadge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { Select } from '../../components/ui/Select'
import { DataTable, Td, Th } from '../../components/ui/Table'
import { useMoney } from '../../hooks/useSettings'
import { formatDateTime, statusLabel } from '../../lib/format'

export function AdminOrdersPage() {
  const money = useMoney()
  const [status, setStatus] = useState('')
  const query = useQuery({
    queryKey: ['admin', 'orders', { status }],
    queryFn: () => api.get<{ orders: AdminOrder[] }>('/admin/orders', { status }),
    select: (d) => d.orders,
  })

  return (
    <>
      <PageHeader title="Orders" description="The latest 100 orders." />
      <div className="mb-5 w-full sm:w-64">
        <Select label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      <QueryBoundary query={query} errorTitle="Could not load orders">
        {(orders) =>
          orders.length === 0 ? (
            <EmptyState title="No orders found" description={status ? 'No orders have this status.' : 'Orders will appear here once customers check out.'} />
          ) : (
            <DataTable caption="Orders">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Placed</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <Td>
                      <Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-700 hover:underline">
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td>
                      {o.customer ? (
                        <>
                          <span className="block">{o.customer.name}</span>
                          <span className="block text-xs text-ink-faint">{o.customer.email}</span>
                        </>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>{formatDateTime(o.createdAt)}</Td>
                    <Td>
                      <OrderStatusBadge status={o.status} />
                    </Td>
                    <Td className="text-right tabular-nums">{money(o.totalCents)}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )
        }
      </QueryBoundary>
    </>
  )
}
