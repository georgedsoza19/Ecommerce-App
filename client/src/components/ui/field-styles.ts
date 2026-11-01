export const controlClasses =
  'block w-full rounded-md border bg-surface px-3.5 text-ink placeholder:text-ink-faint/70 ' +
  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-600 ' +
  'disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-ink-faint'

export function controlBorder(error?: string) {
  return error ? 'border-danger' : 'border-line hover:border-ink-faint'
}

export function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}
