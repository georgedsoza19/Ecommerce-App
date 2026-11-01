import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/client'
import type { AddressInput } from '../../api/types'
import { EMPTY_ADDRESS } from '../../hooks/useAddresses'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { Input } from '../ui/Input'

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter the recipient name').max(80),
  line1: z.string().trim().min(3, 'Enter a street address').max(120),
  line2: z.string().trim().max(120),
  city: z.string().trim().min(2, 'Enter a city').max(80),
  region: z.string().trim().min(2, 'Enter a state or region').max(80),
  postalCode: z.string().trim().min(3, 'Enter a postal code').max(20),
  country: z.string().trim().length(2, 'Use a 2-letter country code, e.g. US'),
  phone: z.string().trim().max(30),
  isDefault: z.boolean(),
})

interface AddressFormProps {
  defaultValues?: AddressInput
  submitLabel?: string
  onSubmit: (values: AddressInput) => Promise<void>
  onCancel?: () => void
}

export function AddressForm({ defaultValues = EMPTY_ADDRESS, submitLabel = 'Save address', onSubmit, onCancel }: AddressFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({ resolver: zodResolver(schema), defaultValues })

  const submit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await onSubmit({ ...values, country: values.country.toUpperCase() })
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {serverError && <Alert variant="error">{serverError}</Alert>}
      <Input label="Full name" autoComplete="name" required error={errors.fullName?.message} {...register('fullName')} />
      <Input label="Address line 1" autoComplete="address-line1" required error={errors.line1?.message} {...register('line1')} />
      <Input label="Address line 2" autoComplete="address-line2" error={errors.line2?.message} {...register('line2')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="City" autoComplete="address-level2" required error={errors.city?.message} {...register('city')} />
        <Input label="State / region" autoComplete="address-level1" required error={errors.region?.message} {...register('region')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Postal code" autoComplete="postal-code" required error={errors.postalCode?.message} {...register('postalCode')} />
        <Input label="Country code" autoComplete="country" maxLength={2} required error={errors.country?.message} {...register('country')} />
      </div>
      <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <Checkbox label="Use as my default address" {...register('isDefault')} />
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
