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

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  if (user) return <Navigate to={from ?? (user.role === 'ADMIN' ? '/admin' : '/')} replace />

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const u = await login(values.email, values.password)
      navigate(from ?? (u.role === 'ADMIN' ? '/admin' : '/'), { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  return (
    <div className="container-page flex justify-center py-14 sm:py-20">
      <div className="w-full max-w-md">
        <p className="font-display text-3xl text-brand-800">{BRAND}</p>
        <h1 className="mt-6 text-4xl">Welcome back</h1>
        <p className="mt-2 text-ink-soft">Sign in to see your cart, wishlist and orders.</p>

        {from && !serverError && (
          <Alert variant="info" className="mt-6">
            Please sign in to continue.
          </Alert>
        )}
        {serverError && (
          <Alert variant="error" className="mt-6">
            {serverError}
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
          <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" size="lg" block loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          New to {BRAND}?{' '}
          <Link to="/register" state={location.state} className="font-medium text-brand-700 underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
