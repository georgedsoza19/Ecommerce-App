import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
}

/**
 * Promise-based confirmation dialog.
 * const [confirm, dialog] = useConfirm(); ... if (await confirm({...})) {...}; render {dialog}
 */
export function useConfirm(): [(opts: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const settle = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setOpts(null)
  }

  const dialog = (
    <Modal
      open={!!opts}
      title={opts?.title ?? ''}
      size="sm"
      onClose={() => settle(false)}
      footer={
        <>
          <Button variant="ghost" onClick={() => settle(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => settle(true)}>
            {opts?.confirmLabel ?? 'Delete'}
          </Button>
        </>
      }
    >
      <p className="text-ink-soft">{opts?.message}</p>
    </Modal>
  )

  return [confirm, dialog]
}
