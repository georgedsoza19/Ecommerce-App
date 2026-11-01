import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, getErrorMessage } from '../../api/client'
import type { AdminSettings } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { useToast } from '../../context/ToastContext'
import { centsToInput, inputToCents, isMoneyInput } from '../../lib/format'

const schema = z.object({
  storeName: z.string().trim().min(1, 'Enter a store name'),
  supportEmail: z.string().trim().email('Enter a valid email address'),
  currency: z.string().trim().length(3, 'Use a 3-letter currency code, e.g. USD'),
  flatShipping: z.string().refine(isMoneyInput, 'Enter an amount such as 7.99'),
  freeShippingThreshold: z.string().refine(isMoneyInput, 'Enter an amount such as 75.00'),
  taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a percentage such as 8.25'),
  lowStockThreshold: z.string().regex(/^\d+$/, 'Enter a whole number, 0 or more'),
})
type Values = z.infer<typeof schema>

function SettingsForm({ settings }: { settings: AdminSettings }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(settings),
  })

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null)
    try {
      const res = await api.patch<{ settings: AdminSettings }>('/admin/settings', {
        storeName: v.storeName,
        supportEmail: v.supportEmail,
        currency: v.currency.toUpperCase(),
        flatShippingCents: inputToCents(v.flatShipping),
        freeShippingThresholdCents: inputToCents(v.freeShippingThreshold),
        taxRateBps: Math.round(Number(v.taxRate) * 100),
        lowStockThreshold: Number(v.lowStockThreshold),
      })
      reset(toValues(res.settings))
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
        qc.invalidateQueries({ queryKey: ['settings'] }),
        qc.invalidateQueries({ queryKey: ['cart'] }),
      ])
      toast.success('Settings saved')
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-2xl space-y-10">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <section aria-labelledby="store-title" className="space-y-5">
        <h2 id="store-title" className="text-2xl">
          Store
        </h2>
        <Input label="Store name" required error={errors.storeName?.message} {...register('storeName')} />
        <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
          <Input label="Support email" type="email" required error={errors.supportEmail?.message} {...register('supportEmail')} />
          <Input label="Currency" maxLength={3} required className="uppercase" error={errors.currency?.message} {...register('currency')} />
        </div>
      </section>

      <section aria-labelledby="ship-title" className="space-y-5">
        <h2 id="ship-title" className="text-2xl">
          Shipping and tax
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Input label="Flat shipping" inputMode="decimal" required error={errors.flatShipping?.message} {...register('flatShipping')} />
          <Input
            label="Free shipping over"
            inputMode="decimal"
            required
            error={errors.freeShippingThreshold?.message}
            {...register('freeShippingThreshold')}
          />
          <Input label="Tax rate (%)" inputMode="decimal" required error={errors.taxRate?.message} {...register('taxRate')} />
        </div>
      </section>

      <section aria-labelledby="inv-title" className="space-y-5">
        <h2 id="inv-title" className="text-2xl">
          Inventory
        </h2>
        <Input
          label="Low stock threshold"
          inputMode="numeric"
          required
          hint="Products at or below this count are flagged as low stock."
          wrapperClassName="max-w-xs"
          error={errors.lowStockThreshold?.message}
          {...register('lowStockThreshold')}
        />
      </section>

      <div className="border-t border-line pt-6">
        <Button type="submit" size="lg" loading={isSubmitting} disabled={!isDirty}>
          Save settings
        </Button>
      </div>
    </form>
  )
}

function toValues(s: AdminSettings): Values {
  return {
    storeName: s.storeName,
    supportEmail: s.supportEmail,
    currency: s.currency,
    flatShipping: centsToInput(s.flatShippingCents),
    freeShippingThreshold: centsToInput(s.freeShippingThresholdCents),
    taxRate: String(s.taxRateBps / 100),
    lowStockThreshold: String(s.lowStockThreshold ?? 5),
  }
}

export function AdminSettingsPage() {
  const query = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get<{ settings: AdminSettings }>('/admin/settings'),
    select: (d) => d.settings,
  })

  return (
    <>
      <PageHeader title="Settings" description="Store details, shipping and tax." />
      <QueryBoundary query={query} errorTitle="Could not load settings">
        {(settings) => <SettingsForm settings={settings} />}
      </QueryBoundary>
    </>
  )
}
