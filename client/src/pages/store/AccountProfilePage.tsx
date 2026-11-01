import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, getErrorMessage } from '../../api/client'
import type { User } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  phone: z.string().trim().max(30, 'Phone number is too long'),
})
type Values = z.infer<typeof schema>

export function AccountProfilePage() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const res = await api.patch<{ user: User }>('/account/profile', values)
      setUser(res.user)
      reset({ name: res.user.name, phone: res.user.phone })
      toast.success('Profile updated')
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  return (
    <section aria-labelledby="profile-title" className="max-w-lg">
      <h2 id="profile-title" className="mb-6 text-2xl">
        Profile
      </h2>
      {serverError && (
        <Alert variant="error" className="mb-5">
          {serverError}
        </Alert>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Input label="Email" value={user?.email ?? ''} readOnly disabled hint="Email cannot be changed." />
        <Input label="Full name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
        <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </section>
  )
}
