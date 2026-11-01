import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { api, ApiError, getErrorMessage } from '../../api/client'
import type { Product } from '../../api/types'
import { ProductGrid } from '../../components/products/ProductGrid'
import { ProductImage } from '../../components/products/ProductImage'
import { WishlistButton } from '../../components/products/WishlistButton'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/button-styles'
import { EmptyState } from '../../components/ui/EmptyState'
import { MinusIcon, PlusIcon } from '../../components/ui/Icons'
import { LoadingBlock } from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useCart, useCartActions } from '../../hooks/useCart'
import { useMoney } from '../../hooks/useSettings'
import { LOW_STOCK_NOTICE } from '../../lib/brand'

interface ProductResponse {
  product: Product
  related: Product[]
}

/** Keyed by slug so gallery/quantity state resets when navigating between products. */
export function ProductDetailPage() {
  const { slug = '' } = useParams()
  return <ProductDetailView key={slug} slug={slug} />
}

function ProductDetailView({ slug }: { slug: string }) {
  const money = useMoney()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { data: cart } = useCart()
  const { addItem } = useCartActions()

  const [selected, setSelected] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const query = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get<ProductResponse>(`/products/${slug}`),
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  })

  if (query.isPending) return <LoadingBlock label="Loading product" className="min-h-[50vh]" />

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404
    return (
      <div className="container-page py-16">
        {notFound ? (
          <EmptyState
            title="We couldn't find that product"
            description="It may have been removed or the link is out of date."
            action={
              <Link to="/products" className={buttonClasses()}>
                Browse all products
              </Link>
            }
          />
        ) : (
          <Alert
            variant="error"
            title="Could not load this product"
            action={
              <Button size="sm" variant="secondary" onClick={() => query.refetch()}>
                Try again
              </Button>
            }
          >
            {getErrorMessage(query.error)}
          </Alert>
        )}
      </div>
    )
  }

  const { product, related } = query.data
  const images = product.images
  const current = images[Math.min(selected, Math.max(images.length - 1, 0))]
  const inCart = cart?.items.find((l) => l.productId === product.id)?.quantity ?? 0
  const remaining = Math.max(0, product.stock - inCart)
  const onSale = product.compareAtCents !== null && product.compareAtCents > product.priceCents

  const onAdd = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    addItem.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          toast.success(`${quantity} x ${product.name} added to your cart`)
          setQuantity(1)
        },
      },
    )
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-faint">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link to="/products" className="hover:text-brand-700">
              Shop
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={`/products?category=${product.category.slug}`} className="hover:text-brand-700">
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-soft">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-paper-deep">
            <ProductImage
              key={current?.url ?? 'none'}
              src={current?.url}
              alt={current?.alt || product.name}
              fallbackLabel={product.name}
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <ul className="mt-3 grid grid-cols-5 gap-3" aria-label="Product images">
              {images.map((img, i) => (
                <li key={img.url + i}>
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    aria-label={`Show image ${i + 1}`}
                    aria-current={i === selected}
                    className={clsx(
                      'block aspect-square w-full overflow-hidden rounded-md border-2 bg-paper-deep',
                      i === selected ? 'border-brand-700' : 'border-transparent hover:border-line',
                    )}
                  >
                    <ProductImage src={img.url} alt="" fallbackLabel={product.name} className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && <p className="text-sm font-medium text-brand-700">{product.category.name}</p>}
          <h1 className="mt-1 text-4xl sm:text-5xl">{product.name}</h1>

          <p className="mt-5 flex items-baseline gap-3 text-2xl">
            <span className="font-medium">{money(product.priceCents)}</span>
            {onSale && product.compareAtCents !== null && (
              <span className="text-lg text-ink-faint line-through">
                <span className="sr-only">Was </span>
                {money(product.compareAtCents)}
              </span>
            )}
          </p>

          <p className="mt-3 text-sm" aria-live="polite">
            {product.stock === 0 ? (
              <span className="font-medium text-danger">Sold out</span>
            ) : product.stock <= LOW_STOCK_NOTICE ? (
              <span className="font-medium text-warning">Only {product.stock} left in stock</span>
            ) : (
              <span className="font-medium text-brand-700">In stock</span>
            )}
            <span className="ml-3 text-ink-faint">SKU {product.sku}</span>
          </p>

          <div className="mt-6 max-w-prose whitespace-pre-line text-ink-soft">{product.description}</div>

          <div className="mt-8 border-t border-line pt-8">
            {product.stock > 0 ? (
              <>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <p id="qty-label" className="mb-1.5 text-sm font-medium">
                      Quantity
                    </p>
                    <div role="group" aria-labelledby="qty-label" className="inline-flex h-11 items-center rounded-md border border-line bg-surface">
                      <button
                        type="button"
                        className="flex size-11 items-center justify-center text-ink-soft hover:text-brand-700 disabled:opacity-40"
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        <MinusIcon width={16} height={16} />
                      </button>
                      <output aria-live="polite" className="w-10 text-center tabular-nums">
                        {quantity}
                      </output>
                      <button
                        type="button"
                        className="flex size-11 items-center justify-center text-ink-soft hover:text-brand-700 disabled:opacity-40"
                        aria-label="Increase quantity"
                        disabled={quantity >= remaining}
                        onClick={() => setQuantity((q) => Math.min(remaining, q + 1))}
                      >
                        <PlusIcon width={16} height={16} />
                      </button>
                    </div>
                  </div>

                  <Button size="lg" className="min-w-48 flex-1 sm:flex-none" onClick={onAdd} loading={addItem.isPending} disabled={remaining === 0}>
                    {remaining === 0 ? 'Maximum in cart' : 'Add to cart'}
                  </Button>
                  <WishlistButton productId={product.id} productName={product.name} className="size-13 border border-line" />
                </div>
                {inCart > 0 && (
                  <p className="mt-3 text-sm text-ink-soft">
                    {inCart} already in your cart.{' '}
                    <Link to="/cart" className="font-medium text-brand-700 underline underline-offset-2">
                      View cart
                    </Link>
                  </p>
                )}
                {!user && <p className="mt-3 text-sm text-ink-faint">You will be asked to sign in before adding to your cart.</p>}
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Button size="lg" disabled>
                  Sold out
                </Button>
                <WishlistButton productId={product.id} productName={product.name} className="size-13 border border-line" />
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-8 text-3xl">
            You might also like
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
