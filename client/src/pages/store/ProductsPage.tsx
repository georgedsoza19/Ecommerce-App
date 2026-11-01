import { useSearchParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { api, getErrorMessage } from '../../api/client'
import type { ProductList } from '../../api/types'
import { ProductGrid } from '../../components/products/ProductGrid'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { useCategories } from '../../hooks/useSettings'
import { inputToCents } from '../../lib/format'

const PAGE_SIZE = 12

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
]

export function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const categories = useCategories()

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const min = params.get('min') ?? ''
  const max = params.get('max') ?? ''
  const inStock = params.get('inStock') === '1'
  const sort = params.get('sort') ?? 'newest'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    if (!('page' in patch)) next.delete('page')
    setParams(next)
  }

  const minCents = inputToCents(min)
  const maxCents = inputToCents(max)

  const products = useQuery({
    queryKey: ['products', { q, category, minCents, maxCents, inStock, sort, page }],
    queryFn: () =>
      api.get<ProductList>('/products', {
        q,
        category,
        minPrice: minCents ?? undefined,
        maxPrice: maxCents ?? undefined,
        inStock: inStock ? true : undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const hasFilters = !!(q || category || min || max || inStock)
  const activeCategory = categories.data?.find((c) => c.slug === category)

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    update({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() })
  }

  const onPrice = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    update({ min: String(fd.get('min') ?? '').trim(), max: String(fd.get('max') ?? '').trim() })
  }

  const total = products.data?.pagination.total

  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeader
        eyebrow={activeCategory ? 'Category' : undefined}
        title={q ? `Results for "${q}"` : (activeCategory?.name ?? 'All products')}
        description={activeCategory?.description || undefined}
      />

      <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
        {/* Filters */}
        <aside aria-label="Filters">
          <details className="group lg:hidden" open={hasFilters}>
            <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-md border border-line bg-surface px-4 font-medium">
              Filters {hasFilters && <span className="text-sm text-brand-700">Active</span>}
            </summary>
            <div className="mt-4">{renderFilters()}</div>
          </details>
          <div className="hidden lg:block">{renderFilters()}</div>
        </aside>

        {/* Results */}
        <section aria-live="polite" aria-busy={products.isFetching}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-ink-soft">
              {products.data ? `${total} product${total === 1 ? '' : 's'}` : '\u00a0'}
            </p>
            <div className="w-full sm:w-56">
              <Select
                label="Sort by"
                hideLabel
                value={sort}
                onChange={(e) => update({ sort: e.target.value === 'newest' ? null : e.target.value })}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {products.isPending && <ProductGrid loading skeletonCount={PAGE_SIZE} />}

          {products.isError && (
            <Alert
              variant="error"
              title="Could not load products"
              action={
                <Button size="sm" variant="secondary" onClick={() => products.refetch()}>
                  Try again
                </Button>
              }
            >
              {getErrorMessage(products.error)}
            </Alert>
          )}

          {products.data && products.data.products.length === 0 && (
            <EmptyState
              title="Nothing matches those filters"
              description="Try a different search term, or clear the filters to see everything."
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={() => setParams(new URLSearchParams())}>
                    Clear all filters
                  </Button>
                ) : undefined
              }
            />
          )}

          {products.data && products.data.products.length > 0 && (
            <div className={clsx('transition-opacity', products.isPlaceholderData && 'opacity-60')}>
              <ProductGrid products={products.data.products} />
              <Pagination
                page={products.data.pagination.page}
                totalPages={products.data.pagination.totalPages}
                onChange={(p) => {
                  update({ page: p > 1 ? String(p) : null })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )

  // Plain render helper (not a component) so inputs keep their state across re-renders.
  function renderFilters() {
    return (
      <div className="space-y-7">
        <form role="search" onSubmit={onSearch} key={`q-${q}`}>
          <Input label="Search" name="q" type="search" defaultValue={q} placeholder="Name, SKU, keyword" />
          <Button type="submit" variant="secondary" size="sm" className="mt-2" block>
            Search
          </Button>
        </form>

        <div>
          <h2 className="mb-2 font-sans text-sm font-semibold">Category</h2>
          {categories.isError && <p className="text-sm text-danger">Could not load categories.</p>}
          <ul className="space-y-0.5">
            <li>
              <CategoryOption label="All" active={!category} onClick={() => update({ category: null })} />
            </li>
            {categories.data?.map((c) => (
              <li key={c.id}>
                <CategoryOption label={c.name} active={category === c.slug} onClick={() => update({ category: c.slug })} />
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={onPrice} key={`p-${min}-${max}`}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Price</legend>
            <div className="flex items-end gap-2">
              <Input label="Min" name="min" inputMode="decimal" defaultValue={min} placeholder="0" wrapperClassName="flex-1" />
              <Input label="Max" name="max" inputMode="decimal" defaultValue={max} placeholder="Any" wrapperClassName="flex-1" />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="mt-2" block>
              Apply price
            </Button>
          </fieldset>
        </form>

        <Checkbox
          label="In stock only"
          checked={inStock}
          onChange={(e) => update({ inStock: e.target.checked ? '1' : null })}
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams())}>
            Clear all filters
          </Button>
        )}
      </div>
    )
  }
}

function CategoryOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={clsx(
        'w-full rounded-md px-3 py-2 text-left text-[0.95rem] transition-colors',
        active ? 'bg-brand-50 font-medium text-brand-800' : 'text-ink-soft hover:bg-paper-deep hover:text-ink',
      )}
    >
      {label}
    </button>
  )
}
