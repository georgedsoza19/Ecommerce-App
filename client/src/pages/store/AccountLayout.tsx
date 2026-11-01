import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

const TABS = [
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/addresses', label: 'Addresses' },
  { to: '/account/wishlist', label: 'Wishlist' },
  { to: '/account/orders', label: 'Orders' },
]

export function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeader
        title="Your account"
        description={user ? `Signed in as ${user.email}` : undefined}
        actions={
          <Button
            variant="ghost"
            onClick={async () => {
              await logout()
              navigate('/')
            }}
          >
            Sign out
          </Button>
        }
      />
      <nav aria-label="Account sections" className="-mx-1 mb-10 overflow-x-auto border-b border-line">
        <ul className="flex min-w-max gap-1 px-1">
          {TABS.map((t) => (
            <li key={t.to}>
              <NavLink
                to={t.to}
                className={({ isActive }) =>
                  clsx(
                    '-mb-px block border-b-2 px-4 py-3 text-[0.95rem] transition-colors',
                    isActive
                      ? 'border-brand-700 font-medium text-brand-800'
                      : 'border-transparent text-ink-soft hover:text-ink',
                  )
                }
              >
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  )
}
