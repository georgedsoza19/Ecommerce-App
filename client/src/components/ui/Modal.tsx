import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { CloseIcon } from './Icons'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const WIDTHS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

/** Accessible modal built on the native <dialog> (focus trap + Esc handled by the browser). */
export function Modal({ open, title, onClose, children, footer, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={`modal m-auto w-[calc(100%-2rem)] ${WIDTHS[size]} rounded-lg bg-surface p-0 text-ink shadow-2xl`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="font-display text-xl">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-ink-soft hover:bg-paper-deep"
              aria-label="Close dialog"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
