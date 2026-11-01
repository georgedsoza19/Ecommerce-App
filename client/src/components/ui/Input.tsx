import { useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import clsx from 'clsx'
import { controlBorder, controlClasses, describedBy } from './field-styles'

interface FieldShellProps {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  hideLabel?: boolean
  className?: string
  children: ReactNode
}

export function FieldShell({ id, label, hint, error, required, hideLabel, className, children }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={clsx('mb-1.5 block text-sm font-medium text-ink', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends ComponentProps<'input'> {
  label: string
  hint?: string
  error?: string
  hideLabel?: boolean
  wrapperClassName?: string
}

export function Input({
  label,
  hint,
  error,
  hideLabel,
  wrapperClassName,
  className,
  id,
  required,
  ...props
}: InputProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={wrapperClassName}
    >
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={clsx(controlClasses, controlBorder(error), 'h-11', className)}
        {...props}
      />
    </FieldShell>
  )
}

interface TextareaProps extends ComponentProps<'textarea'> {
  label: string
  hint?: string
  error?: string
  wrapperClassName?: string
}

export function Textarea({ label, hint, error, wrapperClassName, className, id, required, ...props }: TextareaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={clsx(controlClasses, controlBorder(error), 'min-h-28 py-2.5', className)}
        {...props}
      />
    </FieldShell>
  )
}
