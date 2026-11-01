import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/client'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { BRAND } from '../../lib/brand'

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name').max(80),
    email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
    phone: z.string().trim().max(30, 'Phone number is too long'),
    password: z.string().min(8, 'Use at least 8 characters').max(72, 'Use 72 characters or fewer'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
type Values = z.infer<typeof schema>

export function RegisterPage() {
  const { user, register: registerUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirm: '' },
  })

  if (user) return <Navigate to={from ?? '/'} replace />

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await registerUser({ name: values.name, email: values.email, password: values.password, phone: values.phone })
      navigate(from ?? '/', { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  return (
    <div className="container-page flex justify-center py-14 sm:py-20">
      <div className="w-full max-w-md">
        <p className="font-display text-3xl text-brand-800">{BRAND}</p>
        <h1 className="mt-6 text-4xl">Create your account</h1>
        <p className="mt-2 text-ink-soft">Save addresses, track orders and keep a wishlist.</p>

        {serverError && (
          <Alert variant="error" className="mt-6">
            {serverError}
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
          <Input label="Full name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
          <Input label="Phone (optional)" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            hint="At least 8 characters."
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirm?.message}
            {...register('confirm')}
          />
          <Button type="submit" size="lg" block loading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-medium text-brand-700 underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
