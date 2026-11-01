import { Link } from 'react-router-dom'
import type { Product } from '../../api/types'
import { useMoney } from '../../hooks/useSettings'
import { ProductImage } from './ProductImage'
import { WishlistButton } from './WishlistButton'

export function ProductCard({ product }: { product: Product }) {
  const money = useMoney()
  const image = product.images[0]
  const onSale = product.compareAtCents !== null && product.compareAtCents > product.priceCents

  return (
    <article className="group relative">
      <Link to={`/products/${product.slug}`} className="block rounded-md">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-paper-deep">
          <ProductImage
            src={image?.url}
            alt={image?.alt || product.name}
            fallbackLabel={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {!product.inStock && (
            <span className="absolute bottom-2 left-2 rounded bg-ink px-2 py-1 text-xs font-medium text-white">
              Sold out
            </span>
          )}
          {onSale && product.inStock && (
            <span className="absolute bottom-2 left-2 rounded bg-brand-700 px-2 py-1 text-xs font-medium text-white">
              Sale
            </span>
          )}
        </div>
        <div className="mt-3">
          {product.category && <p className="text-xs text-ink-faint">{product.category.name}</p>}
          <h3 className="mt-0.5 font-sans text-[1rem] font-medium leading-snug text-ink group-hover:text-brand-700">
            {product.name}
          </h3>
          <p className="mt-1 text-[0.95rem]">
            <span className="font-medium text-ink">{money(product.priceCents)}</span>
            {onSale && product.compareAtCents !== null && (
              <span className="ml-2 text-ink-faint line-through">
                <span className="sr-only">Was </span>
                {money(product.compareAtCents)}
              </span>
            )}
          </p>
        </div>
      </Link>
      <WishlistButton productId={product.id} productName={product.name} className="absolute right-2 top-2" />
    </article>
  )
}
