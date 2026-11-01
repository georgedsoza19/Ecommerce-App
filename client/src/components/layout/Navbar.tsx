import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../hooks/useCart'
import { useCategories } from '../../hooks/useSettings'
import { BRAND } from '../../lib/brand'
import { CartIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../ui/Icons'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'rounded-md px-3 py-2 text-[0.95rem] transition-colors hover:text-brand-700',
    isActive ? 'font-medium text-brand-800' : 'text-ink-soft',
  )

function SearchForm({ onDone, idSuffix }: { onDone?: () => void; idSuffix: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const current = location.pathname === '/products' ? (new URLSearchParams(location.search).get('q') ?? '') : ''

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
    onDone?.()
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative w-full" key={current}>
      <label htmlFor={`site-search-${idSuffix}`} className="sr-only">
        Search products
      </label>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" width={18} height={18} />
      <input
        id={`site-search-${idSuffix}`}
        name="q"
        type="search"
        defaultValue={current}
        placeholder="Search products"
        className="h-10 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm placeholder:text-ink-faint focus-visible:outline-brand-600"
      />
    </form>
  )
}

export function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const { data: cart } = useCart()
  const { data: categories } = useCategories()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const count = cart?.itemCount ?? 0
  const close = () => setOpen(false)

  const onLogout = async () => {
    close()
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4 lg:gap-8">
        <Link to="/" className="font-display text-[1.7rem] font-medium tracking-tight text-brand-800" onClick={close}>
          {BRAND}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          <NavLink to="/products" end className={linkClass}>
            Shop
          </NavLink>
          {categories?.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              className="rounded-md px-3 py-2 text-[0.95rem] text-ink-soft transition-colors hover:text-brand-700"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden w-full max-w-xs md:block">
          <SearchForm idSuffix="desktop" />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {user && (
            <Link
              to="/account/wishlist"
              className="rounded-md p-2.5 text-ink-soft hover:bg-paper-deep hover:text-brand-700"
              aria-label="Wishlist"
            >
              <HeartIcon />
            </Link>
          )}
          <Link
            to="/cart"
            className="relative rounded-md p-2.5 text-ink-soft hover:bg-paper-deep hover:text-brand-700"
            aria-label={count ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'}
          >
            <CartIcon />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-0.5 top-0.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-brand-700 px-1 text-[0.65rem] font-semibold text-white"
              >
                {count}
              </span>
            )}
          </Link>

          <div className="hidden items-center lg:flex">
            {user ? (
              <>
                <Link
                  to="/account"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-[0.95rem] text-ink-soft hover:bg-paper-deep hover:text-brand-700"
                >
                  <UserIcon width={18} height={18} />
                  {user.name.split(' ')[0]}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="rounded-md px-3 py-2 text-[0.95rem] font-medium text-brand-700 hover:bg-brand-50">
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-md px-3 py-2 text-[0.95rem] text-ink-soft hover:bg-paper-deep hover:text-ink"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-md px-3 py-2 text-[0.95rem] text-ink-soft hover:text-brand-700">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="ml-1 rounded-md bg-brand-700 px-4 py-2 text-[0.95rem] font-medium text-white hover:bg-brand-800"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-md p-2.5 text-ink-soft hover:bg-paper-deep lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-paper lg:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            <div className="mb-3 md:hidden">
              <SearchForm idSuffix="mobile" onDone={close} />
            </div>
            <Link to="/products" onClick={close} className="rounded-md px-3 py-2.5 text-ink hover:bg-paper-deep">
              Shop all
            </Link>
            {categories?.map((c) => (
              <Link
                key={c.id}
                to={`/products?category=${c.slug}`}
                onClick={close}
                className="rounded-md px-3 py-2.5 text-ink-soft hover:bg-paper-deep"
              >
                {c.name}
              </Link>
            ))}
            <hr className="my-2 border-line" />
            {user ? (
              <>
                <Link to="/account" onClick={close} className="rounded-md px-3 py-2.5 text-ink hover:bg-paper-deep">
                  My account
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={close} className="rounded-md px-3 py-2.5 font-medium text-brand-700 hover:bg-brand-50">
                    Admin dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-md px-3 py-2.5 text-left text-ink-soft hover:bg-paper-deep"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close} className="rounded-md px-3 py-2.5 text-ink hover:bg-paper-deep">
                  Sign in
                </Link>
                <Link to="/register" onClick={close} className="rounded-md px-3 py-2.5 font-medium text-brand-700 hover:bg-brand-50">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
