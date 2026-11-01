import { Button } from './Button'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeftIcon width={16} height={16} />
        Previous
      </Button>
      <p className="text-sm text-ink-soft" aria-live="polite">
        Page {page} of {totalPages}
      </p>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
        <ChevronRightIcon width={16} height={16} />
      </Button>
    </nav>
  )
}
