import { useId } from 'react'
import type { ComponentProps } from 'react'
import clsx from 'clsx'

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: string
  hint?: string
}

export function Checkbox({ label, hint, className, id, ...props }: CheckboxProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className={clsx('flex items-start gap-3', className)}>
      <input
        id={fieldId}
        type="checkbox"
        aria-describedby={hint ? `${fieldId}-hint` : undefined}
        className="mt-0.5 size-5 shrink-0 rounded border-line accent-brand-700"
        {...props}
      />
      <label htmlFor={fieldId} className="text-sm leading-snug text-ink">
        {label}
        {hint && (
          <span id={`${fieldId}-hint`} className="block text-ink-faint">
            {hint}
          </span>
        )}
      </label>
    </div>
  )
}
