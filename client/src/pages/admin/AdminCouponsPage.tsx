import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, getErrorMessage } from '../../api/client'
import type { Coupon } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { Select } from '../../components/ui/Select'
import { DataTable, Td, Th } from '../../components/ui/Table'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'
import { useCategories, useMoney } from '../../hooks/useSettings'
import { centsToInput, dateInputToIso, formatDate, inputToCents, isMoneyInput, isoToDateInput } from '../../lib/format'

const optionalMoney = z.string().refine((v) => v.trim() === '' || isMoneyInput(v), 'Enter an amount such as 10.00')

const schema = z
  .object({
    code: z.string().trim().min(3, 'Use at least 3 characters'),
    type: z.enum(['PERCENT', 'FIXED']),
    value: z.string().trim().min(1, 'Enter a value'),
    minSubtotal: optionalMoney,
    maxDiscount: optionalMoney,
    startsAt: z.string(),
    endsAt: z.string(),
    usageLimit: z.string().refine((v) => v.trim() === '' || /^[1-9]\d*$/.test(v.trim()), 'Enter a whole number, 1 or more'),
    categoryId: z.string(),
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'PERCENT') {
      const n = Number(v.value)
      if (!/^\d+$/.test(v.value) || n < 1 || n > 100) {
        ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter a whole percentage from 1 to 100' })
      }
    } else if (!isMoneyInput(v.value)) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Enter an amount such as 10.00' })
    }
    if (v.startsAt && v.endsAt && v.endsAt < v.startsAt) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End date must be after the start date' })
    }
  })
type Values = z.infer<typeof schema>

type Editing = { mode: 'new' } | { mode: 'edit'; coupon: Coupon } | null

function CouponForm({ coupon, onDone, onCancel }: { coupon?: Coupon; onDone: () => void; onCancel: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const categories = useCategories()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: coupon?.code ?? '',
      type: coupon?.type ?? 'PERCENT',
      value: coupon ? (coupon.type === 'FIXED' ? centsToInput(coupon.value) : String(coupon.value)) : '',
      minSubtotal: coupon && coupon.minSubtotalCents ? centsToInput(coupon.minSubtotalCents) : '',
      maxDiscount: coupon?.maxDiscountCents != null ? centsToInput(coupon.maxDiscountCents) : '',
      startsAt: isoToDateInput(coupon?.startsAt),
      endsAt: isoToDateInput(coupon?.endsAt),
      usageLimit: coupon?.usageLimit != null ? String(coupon.usageLimit) : '',
      categoryId: coupon?.categoryId ?? '',
      active: coupon?.active ?? true,
    },
  })
  const type = watch('type')

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null)
    const body = {
      code: v.code.toUpperCase(),
      type: v.type,
      value: v.type === 'FIXED' ? inputToCents(v.value) : Number(v.value),
      minSubtotalCents: v.minSubtotal.trim() ? inputToCents(v.minSubtotal) : 0,
      maxDiscountCents: v.maxDiscount.trim() ? inputToCents(v.maxDiscount) : null,
      startsAt: dateInputToIso(v.startsAt),
      endsAt: dateInputToIso(v.endsAt, true),
      usageLimit: v.usageLimit.trim() ? Number(v.usageLimit) : null,
      categoryId: v.categoryId || null,
      active: v.active,
    }
    try {
      if (coupon) await api.patch(`/admin/coupons/${coupon.id}`, body)
      else await api.post('/admin/coupons', body)
      await qc.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      toast.success(coupon ? 'Coupon saved' : 'Coupon created')
      onDone()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && <Alert variant="error">{serverError}</Alert>}
      <Input label="Code" required className="uppercase" error={errors.code?.message} {...register('code')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Discount type" {...register('type')}>
          <option value="PERCENT">Percentage off</option>
          <option value="FIXED">Fixed amount off</option>
        </Select>
        <Input
          label={type === 'PERCENT' ? 'Percent off' : 'Amount off'}
          required
          inputMode="decimal"
          hint={type === 'PERCENT' ? 'Whole number, 1 to 100.' : 'In store currency, e.g. 10.00.'}
          error={errors.value?.message}
          {...register('value')}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Minimum subtotal" inputMode="decimal" hint="Optional." error={errors.minSubtotal?.message} {...register('minSubtotal')} />
        <Input
          label="Maximum discount"
          inputMode="decimal"
          hint="Optional cap, useful for percentages."
          error={errors.maxDiscount?.message}
          {...register('maxDiscount')}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Starts on" type="date" error={errors.startsAt?.message} {...register('startsAt')} />
        <Input label="Ends on" type="date" error={errors.endsAt?.message} {...register('endsAt')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Usage limit" inputMode="numeric" hint="Blank for unlimited." error={errors.usageLimit?.message} {...register('usageLimit')} />
        <Select label="Limit to category" {...register('categoryId')}>
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <Checkbox label="Active" {...register('active')} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {coupon ? 'Save changes' : 'Create coupon'}
        </Button>
      </div>
    </form>
  )
}

export function AdminCouponsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const money = useMoney()
  const [confirm, confirmDialog] = useConfirm()
  const [editing, setEditing] = useState<Editing>(null)

  const query = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => api.get<{ coupons: Coupon[] }>('/admin/coupons'),
    select: (d) => d.coupons,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/admin/coupons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })

  const onDelete = async (c: Coupon) => {
    const ok = await confirm({ title: 'Delete coupon', message: `Delete coupon ${c.code}? Carts using it will lose the discount.` })
    if (!ok) return
    try {
      await remove.mutateAsync(c.id)
      toast.success('Coupon deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const describe = (c: Coupon) => (c.type === 'PERCENT' ? `${c.value}% off` : `${money(c.value)} off`)

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply in their cart."
        actions={<Button onClick={() => setEditing({ mode: 'new' })}>New coupon</Button>}
      />
      <QueryBoundary query={query} errorTitle="Could not load coupons">
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              title="No coupons yet"
              description="Create a code to run a promotion."
              action={<Button onClick={() => setEditing({ mode: 'new' })}>Create coupon</Button>}
            />
          ) : (
            <DataTable caption="Coupons">
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Discount</Th>
                  <Th>Valid</Th>
                  <Th className="text-right">Used</Th>
                  <Th>Status</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const expired = !!c.endsAt && new Date(c.endsAt) < new Date()
                  return (
                    <tr key={c.id}>
                      <Td className="font-mono font-medium">{c.code}</Td>
                      <Td>
                        {describe(c)}
                        {c.minSubtotalCents > 0 && <span className="block text-xs text-ink-faint">Min. {money(c.minSubtotalCents)}</span>}
                      </Td>
                      <Td className="text-xs">
                        {c.startsAt || c.endsAt ? `${c.startsAt ? formatDate(c.startsAt) : 'Any time'} to ${c.endsAt ? formatDate(c.endsAt) : 'no end'}` : 'Always'}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {c.usedCount}
                        {c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
                      </Td>
                      <Td>
                        {expired ? <Badge tone="red">Expired</Badge> : <Badge tone={c.active ? 'green' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge>}
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditing({ mode: 'edit', coupon: c })}>
                            Edit<span className="sr-only"> {c.code}</span>
                          </Button>
                          <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => onDelete(c)}>
                            Delete<span className="sr-only"> {c.code}</span>
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </DataTable>
          )
        }
      </QueryBoundary>

      <Modal open={!!editing} title={editing?.mode === 'edit' ? 'Edit coupon' : 'New coupon'} onClose={() => setEditing(null)}>
        {editing && (
          <CouponForm
            key={editing.mode === 'edit' ? editing.coupon.id : 'new'}
            coupon={editing.mode === 'edit' ? editing.coupon : undefined}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
      {confirmDialog}
    </>
  )
}
