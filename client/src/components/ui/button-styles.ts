import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 border border-brand-700',
  secondary: 'bg-transparent text-brand-800 border border-brand-700 hover:bg-brand-50',
  ghost: 'bg-transparent text-ink-soft border border-transparent hover:bg-paper-deep hover:text-ink',
  danger: 'bg-danger text-white border border-danger hover:brightness-95',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-13 px-7 text-base',
}

/** Shared class builder so <Link> and <button> look identical. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
} = {}) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-55',
    VARIANTS[variant],
    SIZES[size],
    block && 'w-full',
    className,
  )
}
