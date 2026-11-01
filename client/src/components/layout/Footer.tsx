import { Link } from 'react-router-dom'
import { useCategories, useMoney, useSettings } from '../../hooks/useSettings'
import { BRAND, TAGLINE } from '../../lib/brand'

export function Footer() {
  const { data: settings } = useSettings()
  const { data: categories } = useCategories()
  const money = useMoney()

  return (
    <footer className="mt-24 border-t border-line bg-brand-900 text-brand-100">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-4xl text-white">{BRAND}</p>
          <p className="mt-3 max-w-xs text-brand-200">{TAGLINE}</p>
          {settings && (
            <p className="mt-6 text-sm text-brand-200">
              Free shipping on orders over {money(settings.freeShippingThresholdCents)}.
            </p>
          )}
        </div>

        <nav aria-label="Shop">
          <h2 className="font-sans text-sm font-semibold text-white">Shop</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/products" className="hover:text-white">
                All products
              </Link>
            </li>
            {categories?.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link to={`/products?category=${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account and support">
          <h2 className="font-sans text-sm font-semibold text-white">Help</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/account/orders" className="hover:text-white">
                Orders and returns
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-white">
                Your account
              </Link>
            </li>
            {settings?.supportEmail && (
              <li>
                <a href={`mailto:${settings.supportEmail}`} className="hover:text-white">
                  {settings.supportEmail}
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-brand-200">
        &copy; {new Date().getFullYear()} {BRAND}. Demo store - payments are simulated.
      </div>
    </footer>
  )
}
