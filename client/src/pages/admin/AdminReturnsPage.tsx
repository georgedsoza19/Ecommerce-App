import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '../../api/client'
import { RETURN_STATUSES } from '../../api/types'
import type { AdminReturnRequest, ReturnStatus } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { ReturnStatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { Select } from '../../components/ui/Select'
import { DataTable, Td, Th } from '../../components/ui/Table'
import { useToast } from '../../context/ToastContext'
import { formatDate, statusLabel } from '../../lib/format'

type Decision = 'APPROVED' | 'REJECTED' | 'REFUNDED'

const DECISION_LABEL: Record<Decision, string> = {
  APPROVED: 'Approve return',
  REJECTED: 'Reject return',
  REFUNDED: 'Mark as refunded',
}

function nextActions(status: ReturnStatus): Decision[] {
  if (status === 'REQUESTED') return ['APPROVED', 'REJECTED']
  if (status === 'APPROVED') return ['REFUNDED']
  return []
}

export function AdminReturnsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [deciding, setDeciding] = useState<{ ret: AdminReturnRequest; decision: Decision } | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin', 'returns', { status }],
    queryFn: () => api.get<{ returnRequests: AdminReturnRequest[] }>('/admin/returns', { status }),
    select: (d) => d.returnRequests,
  })

  const decide = useMutation({
    mutationFn: (v: { id: string; status: Decision; adminNote?: string }) =>
      api.patch(`/admin/returns/${v.id}`, { status: v.status, ...(v.adminNote ? { adminNote: v.adminNote } : {}) }),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'returns'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'metrics'] }),
      ]),
  })

  const open = (ret: AdminReturnRequest, decision: Decision) => {
    setDeciding({ ret, decision })
    setNote(ret.adminNote ?? '')
    setError(null)
  }

  const submit = async () => {
    if (!deciding) return
    setError(null)
    try {
      await decide.mutateAsync({ id: deciding.ret.id, status: deciding.decision, adminNote: note.trim() })
      toast.success(`Return ${statusLabel(deciding.decision).toLowerCase()}`)
      setDeciding(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <>
      <PageHeader title="Returns" description="Review customer return requests." />
      <div className="mb-5 w-full sm:w-64">
        <Select label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {RETURN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      <QueryBoundary query={query} errorTitle="Could not load returns">
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="No return requests" description="Nothing to review right now." />
          ) : (
            <DataTable caption="Return requests">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Reason</Th>
                  <Th>Requested</Th>
                  <Th>Status</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id}>
                    <Td>
                      <Link to={`/admin/orders/${r.orderId}`} className="font-medium text-brand-700 hover:underline">
                        {r.orderNumber ?? 'View order'}
                      </Link>
                    </Td>
                    <Td>
                      {r.customer ? (
                        <>
                          <span className="block">{r.customer.name}</span>
                          <span className="block text-xs text-ink-faint">{r.customer.email}</span>
                        </>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td className="max-w-xs">
                      <p className="line-clamp-3">{r.reason}</p>
                      {r.adminNote && <p className="mt-1 text-xs text-ink-faint">Note: {r.adminNote}</p>}
                    </Td>
                    <Td>{formatDate(r.createdAt)}</Td>
                    <Td>
                      <ReturnStatusBadge status={r.status} />
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        {nextActions(r.status).map((d) => (
                          <Button key={d} size="sm" variant={d === 'REJECTED' ? 'ghost' : 'secondary'} onClick={() => open(r, d)}>
                            {d === 'APPROVED' ? 'Approve' : d === 'REJECTED' ? 'Reject' : 'Refunded'}
                            <span className="sr-only"> return for {r.orderNumber}</span>
                          </Button>
                        ))}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )
        }
      </QueryBoundary>

      <Modal
        open={!!deciding}
        title={deciding ? DECISION_LABEL[deciding.decision] : ''}
        size="sm"
        onClose={() => setDeciding(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              variant={deciding?.decision === 'REJECTED' ? 'danger' : 'primary'}
              loading={decide.isPending}
              onClick={submit}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {deciding && (
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-ink">{deciding.ret.orderNumber}</span>: {deciding.ret.reason}
            </p>
          )}
          {error && <Alert variant="error">{error}</Alert>}
          <Textarea
            label="Note to customer (optional)"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </Modal>
    </>
  )
}
