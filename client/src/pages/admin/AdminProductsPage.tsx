import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '../../api/client'
import type { ProductList } from '../../api/types'
import { ProductImage } from '../../components/products/ProductImage'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/button-styles'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { LoadingBlock } from '../../components/ui/Spinner'
import { DataTable, Td, Th } from '../../components/ui/Table'
import { useToast } from '../../context/ToastContext'
import { useDebounce } from '../../hooks/useDebounce'
import { useConfirm } from '../../hooks/useConfirm'
import { useMoney } from '../../hooks/useSettings'
import { useCategories } from '../../hooks/useSettings'

export function AdminProductsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const money = useMoney()
  const categories = useCategories()
  const [confirm, confirmDialog] = useConfirm()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounce(search.trim(), 350)

  const query = useQuery({
    queryKey: ['admin', 'products', { q, category, page }],
    queryFn: () => api.get<ProductList>('/admin/products', { q, category, page, limit: 20 }),
    placeholderData: keepPreviousData,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/admin/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })

  const onDelete = async (id: string, name: string) => {
    const ok = await confirm({ title: 'Delete product', message: `Delete "${name}"? This cannot be undone.` })
    if (!ok) return
    try {
      await remove.mutateAsync(id)
      toast.success('Product deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your catalogue, pricing and stock."
        actions={
          <Link to="/admin/products/new" className={buttonClasses()}>
            New product
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-[1fr_14rem]">
        <Input
          label="Search products"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Name, SKU or keyword"
        />
        <Select
          label="Category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {query.isPending && <LoadingBlock />}
      {query.isError && (
        <Alert
          variant="error"
          title="Could not load products"
          action={
            <Button size="sm" variant="secondary" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        >
          {getErrorMessage(query.error)}
        </Alert>
      )}
      {query.data && query.data.products.length === 0 && (
        <EmptyState title="No products found" description="Adjust your search or create a new product." />
      )}
      {query.data && query.data.products.length > 0 && (
        <div className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <DataTable caption="Products">
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                <Th>Status</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {query.data.products.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={p.images[0]?.url}
                        alt=""
                        fallbackLabel={p.name}
                        className="size-11 shrink-0 rounded object-cover"
                      />
                      <Link to={`/admin/products/${p.id}`} className="font-medium hover:text-brand-700">
                        {p.name}
                      </Link>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs">{p.sku}</Td>
                  <Td>{p.category?.name ?? '-'}</Td>
                  <Td className="text-right tabular-nums">{money(p.priceCents)}</Td>
                  <Td className="text-right tabular-nums">
                    <span className={p.stock === 0 ? 'font-medium text-danger' : p.stock <= 5 ? 'font-medium text-warning' : undefined}>
                      {p.stock}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={p.active ? 'green' : 'neutral'}>{p.active ? 'Active' : 'Hidden'}</Badge>
                      {p.featured && <Badge tone="amber">Featured</Badge>}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/products/${p.id}`} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                        Edit<span className="sr-only"> {p.name}</span>
                      </Link>
                      <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => onDelete(p.id, p.name)}>
                        Delete<span className="sr-only"> {p.name}</span>
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <Pagination page={query.data.pagination.page} totalPages={query.data.pagination.totalPages} onChange={setPage} />
        </div>
      )}
      {confirmDialog}
    </>
  )
}
