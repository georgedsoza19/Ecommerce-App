import type { ComponentProps, ReactNode } from 'react'
import clsx from 'clsx'

export function DataTable({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={clsx('border-b border-line bg-paper-deep/60 px-4 py-3 text-xs font-semibold text-ink-soft', className)}
      {...props}
    />
  )
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
  return <td className={clsx('border-b border-line/70 px-4 py-3 align-middle text-ink', className)} {...props} />
}
