import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Banner } from '../../api/types'
import { buttonClasses } from '../ui/button-styles'
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/Icons'
import { ProductImage } from '../products/ProductImage'

function BannerLink({ banner }: { banner: Banner }) {
  if (!banner.linkUrl) return null
  const label = 'Shop now'
  const cls = buttonClasses({ variant: 'primary', size: 'md', className: 'mt-5 !bg-white !text-brand-900 !border-white hover:!bg-brand-50' })
  if (/^https?:\/\//.test(banner.linkUrl)) {
    return (
      <a href={banner.linkUrl} className={cls}>
        {label}
      </a>
    )
  }
  return (
    <Link to={banner.linkUrl} className={cls}>
      {label}
    </Link>
  )
}

/** Banner slider. Manual navigation only (no autoplay) to stay accessible. */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)
  if (!banners.length) return null
  const current = banners[Math.min(index, banners.length - 1)]
  const many = banners.length > 1

  return (
    <section aria-roledescription="carousel" aria-label="Featured promotions" className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-brand-800 sm:aspect-[16/7]">
        <ProductImage
          src={current.imageUrl}
          alt=""
          fallbackLabel={current.title}
          loading="eager"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/25 to-transparent" />
        <div
          className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10"
          role="group"
          aria-roledescription="slide"
          aria-label={`${Math.min(index, banners.length - 1) + 1} of ${banners.length}`}
        >
          <h2 className="max-w-xl text-3xl sm:text-5xl">{current.title}</h2>
          {current.subtitle && <p className="mt-2 max-w-lg text-white/85 sm:text-lg">{current.subtitle}</p>}
          <BannerLink banner={current} />
        </div>

        {many && (
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full bg-white/90 text-brand-900 hover:bg-white"
              aria-label="Previous banner"
              onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full bg-white/90 text-brand-900 hover:bg-white"
              aria-label="Next banner"
              onClick={() => setIndex((i) => (i + 1) % banners.length)}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>
      {many && (
        <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Choose banner">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show banner ${i + 1}: ${b.title}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-brand-700' : 'w-2 bg-brand-200 hover:bg-brand-600'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
