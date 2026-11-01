import { useState } from 'react'
import type { Address } from '../../api/types'
import { getErrorMessage } from '../../api/client'
import { AddressForm } from '../../components/account/AddressForm'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { useToast } from '../../context/ToastContext'
import { addressToInput, EMPTY_ADDRESS, useAddressActions, useAddresses } from '../../hooks/useAddresses'
import { useConfirm } from '../../hooks/useConfirm'

type Editing = { mode: 'new' } | { mode: 'edit'; address: Address } | null

export function AccountAddressesPage() {
  const addresses = useAddresses()
  const { create, update, remove } = useAddressActions()
  const toast = useToast()
  const [editing, setEditing] = useState<Editing>(null)
  const [confirm, confirmDialog] = useConfirm()

  const onDelete = async (a: Address) => {
    const ok = await confirm({
      title: 'Delete address',
      message: `Remove the address for ${a.fullName} at ${a.line1}? This cannot be undone.`,
    })
    if (!ok) return
    try {
      await remove.mutateAsync(a.id)
      toast.success('Address deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const makeDefault = async (a: Address) => {
    try {
      await update.mutateAsync({ id: a.id, input: { ...addressToInput(a), isDefault: true } })
      toast.success('Default address updated')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <section aria-labelledby="addr-title">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id="addr-title" className="text-2xl">
          Addresses
        </h2>
        <Button onClick={() => setEditing({ mode: 'new' })}>Add address</Button>
      </div>

      <QueryBoundary query={addresses} errorTitle="Could not load addresses">
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              title="No saved addresses"
              description="Add a shipping address to speed up checkout."
              action={<Button onClick={() => setEditing({ mode: 'new' })}>Add your first address</Button>}
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {list.map((a) => (
                <li key={a.id} className="flex flex-col rounded-lg border border-line bg-surface p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{a.fullName}</p>
                    {a.isDefault && <Badge tone="green">Default</Badge>}
                  </div>
                  <address className="mt-2 flex-1 text-sm not-italic leading-relaxed text-ink-soft">
                    {a.line1}
                    <br />
                    {a.line2 && (
                      <>
                        {a.line2}
                        <br />
                      </>
                    )}
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditing({ mode: 'edit', address: a })}>
                      Edit<span className="sr-only"> address for {a.fullName}</span>
                    </Button>
                    {!a.isDefault && (
                      <Button size="sm" variant="ghost" onClick={() => makeDefault(a)} disabled={update.isPending}>
                        Make default
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => onDelete(a)}>
                      Delete<span className="sr-only"> address for {a.fullName}</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>

      <Modal
        open={!!editing}
        title={editing?.mode === 'edit' ? 'Edit address' : 'New address'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <AddressForm
            key={editing.mode === 'edit' ? editing.address.id : 'new'}
            defaultValues={editing.mode === 'edit' ? addressToInput(editing.address) : EMPTY_ADDRESS}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              if (editing.mode === 'edit') {
                await update.mutateAsync({ id: editing.address.id, input: values })
                toast.success('Address updated')
              } else {
                await create.mutateAsync(values)
                toast.success('Address added')
              }
              setEditing(null)
            }}
          />
        )}
      </Modal>
      {confirmDialog}
    </section>
  )
}
