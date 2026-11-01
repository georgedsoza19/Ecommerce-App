import type { Product } from '../../api/types'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products?: Product[]
  loading?: boolean
  skeletonCount?: number
}

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4'

export function ProductGrid({ products, loading = false, skeletonCount = 8 }: ProductGridProps) {
  if (loading) {
    return (
      <div className={GRID} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] rounded-md bg-paper-deep" />
            <div className="mt-3 h-3 w-1/3 rounded bg-paper-deep" />
            <div className="mt-2 h-4 w-3/4 rounded bg-paper-deep" />
            <div className="mt-2 h-4 w-1/4 rounded bg-paper-deep" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <ul className={GRID}>
      {products?.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  )
}
