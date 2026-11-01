import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const LINKS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/returns', label: 'Returns' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/banners', label: 'Banners' },
  { to: '/admin/settings', label: 'Settings' },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'rounded-md px-3 py-2.5 text-[0.95rem] transition-colors',
              isActive ? 'bg-white/12 font-medium text-white' : 'text-brand-100 hover:bg-white/8 hover:text-white',
            )
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
