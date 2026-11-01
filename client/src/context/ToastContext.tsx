/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'bg-brand-800 text-white',
  error: 'bg-danger text-white',
  info: 'bg-ink text-white',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, tone, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={clsx(
              'pointer-events-auto max-w-sm rounded-md px-4 py-3 text-sm shadow-lg',
              TONE_CLASSES[t.tone],
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
