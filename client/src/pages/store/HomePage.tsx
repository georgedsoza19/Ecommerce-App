import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, getErrorMessage } from '../../api/client'
import type { Banner, ProductList } from '../../api/types'
import { BannerCarousel } from '../../components/home/BannerCarousel'
import { ProductGrid } from '../../components/products/ProductGrid'
import { Alert } from '../../components/ui/Alert'
import { buttonClasses } from '../../components/ui/button-styles'
import { Button } from '../../components/ui/Button'
import { ArrowRightIcon } from '../../components/ui/Icons'
import { useCategories, useMoney, useSettings } from '../../hooks/useSettings'
import { BRAND, TAGLINE } from '../../lib/brand'

export function HomePage() {
  const money = useMoney()
  const { data: settings } = useSettings()
  const categories = useCategories()

  const banners = useQuery({
    queryKey: ['banners', 'home-hero'],
    queryFn: () => api.get<{ banners: Banner[] }>('/banners', { placement: 'home-hero' }),
    select: (d) => d.banners,
  })

  const featured = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => api.get<ProductList>('/products', { featured: true, limit: 8 }),
  })

  return (
    <>
      {/* Brand hero */}
      <section className="container-page pb-10 pt-10 sm:pt-16">
        <p className="text-sm font-medium text-brand-700">{TAGLINE}</p>
        <h1 className="-ml-1 mt-2 font-display text-[clamp(5.5rem,24vw,17rem)] font-medium leading-[0.82] tracking-[-0.04em] text-brand-800">
          {BRAND}
        </h1>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-brand-800/20 pt-6">
          <p className="max-w-md text-lg text-ink-soft">
            Thoughtfully chosen pieces for your home, desk and everyday carry. Fewer things, made better.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/products" className={buttonClasses({ size: 'lg' })}>
              Shop all products
              <ArrowRightIcon width={18} height={18} />
            </Link>
            <a href="#categories" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
              Browse categories
            </a>
          </div>
        </div>
      </section>

      {/* Banners */}
      {banners.data && banners.data.length > 0 && (
        <div className="container-page">
          <BannerCarousel banners={banners.data} />
        </div>
      )}

      {/* Category navigation */}
      <section id="categories" className="container-page scroll-mt-24 pt-20" aria-labelledby="categories-title">
        <h2 id="categories-title" className="text-3xl sm:text-4xl">
          Shop by category
        </h2>
        {categories.isPending && <p className="mt-6 text-ink-faint">Loading categories...</p>}
        {categories.isError && (
          <Alert variant="error" className="mt-6" title="Could not load categories">
            {getErrorMessage(categories.error)}
          </Alert>
        )}
        {categories.data && categories.data.length === 0 && (
          <p className="mt-6 text-ink-soft">Categories will appear here soon.</p>
        )}
        {categories.data && categories.data.length > 0 && (
          <ul className="mt-8 grid border-b border-line sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-10">
            {categories.data.map((c) => (
              <li key={c.id} className="border-t border-line">
                <Link
                  to={`/products?category=${c.slug}`}
                  className="group flex items-center justify-between gap-4 py-5"
                >
                  <span>
                    <span className="block font-display text-2xl text-ink group-hover:text-brand-700">{c.name}</span>
                    {c.description && <span className="mt-0.5 block line-clamp-1 text-sm text-ink-faint">{c.description}</span>}
                  </span>
                  <ArrowRightIcon className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand-700" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Featured products */}
      <section className="container-page pt-20" aria-labelledby="featured-title">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="featured-title" className="text-3xl sm:text-4xl">
            Featured
          </h2>
          <Link to="/products" className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline">
            View all products
          </Link>
        </div>

        {featured.isPending && <ProductGrid loading skeletonCount={4} />}
        {featured.isError && (
          <Alert
            variant="error"
            title="Could not load featured products"
            action={
              <Button size="sm" variant="secondary" onClick={() => featured.refetch()}>
                Try again
              </Button>
            }
          >
            {getErrorMessage(featured.error)}
          </Alert>
        )}
        {featured.data && featured.data.products.length === 0 && (
          <p className="rounded-md border border-dashed border-line px-6 py-10 text-center text-ink-soft">
            No featured products yet.{' '}
            <Link to="/products" className="font-medium text-brand-700 underline">
              Browse the full catalogue
            </Link>
            .
          </p>
        )}
        {featured.data && featured.data.products.length > 0 && <ProductGrid products={featured.data.products} />}
      </section>

      {/* Promises */}
      {settings && (
        <section className="container-page pt-24" aria-label="Store promises">
          <dl className="grid gap-8 border-t border-brand-800/20 pt-8 md:grid-cols-3">
            <div>
              <dt className="font-display text-xl text-ink">Free shipping</dt>
              <dd className="mt-1 text-ink-soft">On every order over {money(settings.freeShippingThresholdCents)}.</dd>
            </div>
            <div>
              <dt className="font-display text-xl text-ink">Easy returns</dt>
              <dd className="mt-1 text-ink-soft">Not right? Request a return from your order page once it arrives.</dd>
            </div>
            <div>
              <dt className="font-display text-xl text-ink">Real people</dt>
              <dd className="mt-1 text-ink-soft">
                Questions? Write to{' '}
                <a className="underline underline-offset-2" href={`mailto:${settings.supportEmail}`}>
                  {settings.supportEmail}
                </a>
                .
              </dd>
            </div>
          </dl>
        </section>
      )}
    </>
  )
}
