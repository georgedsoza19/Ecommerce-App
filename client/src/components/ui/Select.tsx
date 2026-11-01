import { useId } from 'react'
import type { ComponentProps } from 'react'
import clsx from 'clsx'
import { FieldShell } from './Input'
import { controlBorder, controlClasses, describedBy } from './field-styles'

interface SelectProps extends ComponentProps<'select'> {
  label: string
  hint?: string
  error?: string
  hideLabel?: boolean
  wrapperClassName?: string
}

export function Select({
  label,
  hint,
  error,
  hideLabel,
  wrapperClassName,
  className,
  id,
  required,
  children,
  ...props
}: SelectProps) {
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
      <select
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={clsx(controlClasses, controlBorder(error), 'h-11 pr-8', className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
}
