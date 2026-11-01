import { Link } from 'react-router-dom'
import { ProductImage } from '../../components/products/ProductImage'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/button-styles'
import { EmptyState } from '../../components/ui/EmptyState'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { useToast } from '../../context/ToastContext'
import { useCartActions } from '../../hooks/useCart'
import { useMoney } from '../../hooks/useSettings'
import { useWishlist, useWishlistActions } from '../../hooks/useWishlist'

export function AccountWishlistPage() {
  const wishlist = useWishlist()
  const { remove } = useWishlistActions()
  const { addItem } = useCartActions()
  const money = useMoney()
  const toast = useToast()

  return (
    <section aria-labelledby="wish-title">
      <h2 id="wish-title" className="mb-6 text-2xl">
        Wishlist
      </h2>
      <QueryBoundary query={wishlist} errorTitle="Could not load your wishlist">
        {(items) =>
          items.length === 0 ? (
            <EmptyState
              title="Your wishlist is empty"
              description="Tap the heart on any product to save it for later."
              action={
                <Link to="/products" className={buttonClasses()}>
                  Browse products
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {items.map(({ id, product }) => (
                <li key={id} className="flex flex-wrap items-center gap-4 py-5 sm:flex-nowrap">
                  <Link to={`/products/${product.slug}`} className="block size-20 shrink-0 overflow-hidden rounded-md bg-paper-deep">
                    <ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${product.slug}`} className="font-medium hover:text-brand-700">
                      {product.name}
                    </Link>
                    <p className="text-sm text-ink-soft">{money(product.priceCents)}</p>
                    {!product.inStock && <p className="text-sm font-medium text-danger">Sold out</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!product.inStock}
                      loading={addItem.isPending && addItem.variables?.productId === product.id}
                      onClick={() =>
                        addItem.mutate(
                          { productId: product.id, quantity: 1 },
                          { onSuccess: () => toast.success(`${product.name} added to your cart`) },
                        )
                      }
                    >
                      Add to cart
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(product.id)}
                    >
                      Remove<span className="sr-only"> {product.name}</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </section>
  )
}
