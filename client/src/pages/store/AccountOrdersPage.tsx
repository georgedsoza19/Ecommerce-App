import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { Order } from '../../api/types'
import { OrderStatusBadge } from '../../components/ui/Badge'
import { buttonClasses } from '../../components/ui/button-styles'
import { EmptyState } from '../../components/ui/EmptyState'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { DataTable, Td, Th } from '../../components/ui/Table'
import { useMoney } from '../../hooks/useSettings'
import { formatDate } from '../../lib/format'

export function AccountOrdersPage() {
  const money = useMoney()
  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<{ orders: Order[] }>('/orders'),
    select: (d) => d.orders,
  })

  return (
    <section aria-labelledby="orders-title">
      <h2 id="orders-title" className="mb-6 text-2xl">
        Orders
      </h2>
      <QueryBoundary query={orders} errorTitle="Could not load your orders">
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="When you place an order it will show up here."
              action={
                <Link to="/products" className={buttonClasses()}>
                  Start shopping
                </Link>
              }
            />
          ) : (
            <DataTable caption="Your orders">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Date</Th>
                  <Th>Items</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="hover:bg-paper/60">
                    <Td>
                      <Link to={`/account/orders/${o.id}`} className="font-medium text-brand-700 underline-offset-2 hover:underline">
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td>{formatDate(o.createdAt)}</Td>
                    <Td>{o.items.reduce((n, i) => n + i.quantity, 0)}</Td>
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
    </section>
  )
}
