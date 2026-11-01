import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BRAND } from '../../lib/brand'
import { CloseIcon, MenuIcon } from '../ui/Icons'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  const onLogout = async () => {
    await logout()
    navigate('/')
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6">
        <Link to="/admin" className="font-display text-3xl text-white">
          {BRAND}
        </Link>
        <p className="mt-0.5 text-xs text-brand-200">Admin console</p>
      </div>
      <div className="flex-1 px-3">
        <AdminSidebar onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-sm">
        <p className="truncate text-brand-100">{user?.email}</p>
        <div className="mt-2 flex gap-4">
          <Link to="/" className="text-brand-200 hover:text-white">
            View store
          </Link>
          <button type="button" onClick={onLogout} className="text-brand-200 hover:text-white">
            Sign out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
      <a href="#admin-main" className="skip-link">
        Skip to main content
      </a>

      <aside className="sticky top-0 hidden h-screen bg-brand-900 lg:block">{sidebar}</aside>

      <div className="flex items-center justify-between border-b border-line bg-brand-900 px-4 py-3 lg:hidden">
        <Link to="/admin" className="font-display text-2xl text-white">
          {BRAND} <span className="font-sans text-xs text-brand-200">Admin</span>
        </Link>
        <button
          type="button"
          className="rounded-md p-2 text-white hover:bg-white/10"
          aria-expanded={open}
          aria-controls="admin-drawer"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      {open && (
        <div id="admin-drawer" className="bg-brand-900 lg:hidden">
          {sidebar}
        </div>
      )}

      <main id="admin-main" tabIndex={-1} className="min-w-0 px-5 py-8 outline-none lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
