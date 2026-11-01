import type { ComponentProps } from 'react'
import { buttonClasses } from './button-styles'
import type { ButtonSize, ButtonVariant } from './button-styles'
import { Spinner } from './Spinner'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  loading?: boolean
}

export function Button({
  variant,
  size,
  block,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, block, className })}
      {...props}
    >
      {loading && <Spinner size={16} label="" />}
      {children}
    </button>
  )
}
