import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, ApiError, getErrorMessage } from '../../api/client'
import type { Product } from '../../api/types'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { ProductImage } from '../../components/products/ProductImage'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/button-styles'
import { Checkbox } from '../../components/ui/Checkbox'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input, Textarea } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { LoadingBlock } from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { useCategories } from '../../hooks/useSettings'
import { centsToInput, inputToCents, isMoneyInput } from '../../lib/format'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter a product name'),
  slug: z.string().trim(),
  sku: z.string().trim().min(2, 'Enter a SKU'),
  categoryId: z.string().min(1, 'Choose a category'),
  price: z.string().refine(isMoneyInput, 'Enter a price such as 19.99'),
  compareAt: z.string().refine((v) => v.trim() === '' || isMoneyInput(v), 'Enter a price such as 29.99, or leave blank'),
  stock: z.string().regex(/^\d+$/, 'Enter a whole number, 0 or more'),
  description: z.string().trim().min(10, 'Describe the product in at least 10 characters'),
  active: z.boolean(),
  featured: z.boolean(),
})
type Values = z.infer<typeof schema>

interface ImageDraft {
  url: string
  alt: string
}

function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const categories = useCategories()
  const [serverError, setServerError] = useState<string | null>(null)
  const [images, setImages] = useState<ImageDraft[]>(product?.images.map((i) => ({ url: i.url, alt: i.alt })) ?? [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      sku: product?.sku ?? '',
      categoryId: product?.categoryId ?? '',
      price: centsToInput(product?.priceCents),
      compareAt: centsToInput(product?.compareAtCents),
      stock: String(product?.stock ?? 0),
      description: product?.description ?? '',
      active: product?.active ?? true,
      featured: product?.featured ?? false,
    },
  })

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null)
    const body: Record<string, unknown> = {
      name: v.name,
      sku: v.sku,
      categoryId: v.categoryId,
      description: v.description,
      priceCents: inputToCents(v.price),
      compareAtCents: v.compareAt.trim() ? inputToCents(v.compareAt) : null,
      stock: Number(v.stock),
      active: v.active,
      featured: v.featured,
      images: images.map((img, i) => ({ url: img.url, alt: img.alt.trim(), sortOrder: i })),
    }
    if (v.slug) body.slug = v.slug
    try {
      if (product) await api.patch(`/admin/products/${product.id}`, body)
      else await api.post('/admin/products', body)
      await qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      await qc.invalidateQueries({ queryKey: ['products'] })
      await qc.invalidateQueries({ queryKey: ['product'] })
      toast.success(product ? 'Product saved' : 'Product created')
      navigate('/admin/products')
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  const move = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-10">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <section aria-labelledby="basics" className="space-y-5">
        <h2 id="basics" className="text-2xl">
          Basics
        </h2>
        <Input label="Name" required error={errors.name?.message} {...register('name')} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="SKU" required error={errors.sku?.message} {...register('sku')} />
          <Input
            label="URL slug"
            hint="Leave blank to generate from the name."
            error={errors.slug?.message}
            {...register('slug')}
          />
        </div>
        <Select label="Category" required error={errors.categoryId?.message} {...register('categoryId')}>
          <option value="">Choose a category</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          {/* Keep the current (possibly inactive) category selectable. */}
          {product && !categories.data?.some((c) => c.id === product.categoryId) && (
            <option value={product.categoryId}>{product.category?.name ?? 'Current category'}</option>
          )}
        </Select>
        <Textarea label="Description" required rows={6} error={errors.description?.message} {...register('description')} />
      </section>

      <section aria-labelledby="pricing" className="space-y-5">
        <h2 id="pricing" className="text-2xl">
          Pricing and stock
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Input label="Price" inputMode="decimal" required error={errors.price?.message} {...register('price')} />
          <Input
            label="Compare-at price"
            inputMode="decimal"
            hint="Optional; shows as the original price."
            error={errors.compareAt?.message}
            {...register('compareAt')}
          />
          <Input label="Stock" inputMode="numeric" required error={errors.stock?.message} {...register('stock')} />
        </div>
        <div className="flex flex-wrap gap-8">
          <Checkbox label="Visible in the store" {...register('active')} />
          <Checkbox label="Featured on the homepage" {...register('featured')} />
        </div>
      </section>

      <section aria-labelledby="images" className="space-y-4">
        <h2 id="images" className="text-2xl">
          Images
        </h2>
        {images.length === 0 && <p className="text-sm text-ink-soft">No images yet. The first image is used as the main photo.</p>}
        <ul className="space-y-3">
          {images.map((img, i) => (
            <li key={img.url + i} className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface p-3 sm:flex-nowrap">
              <ProductImage src={img.url} alt="" className="size-16 shrink-0 rounded object-cover" />
              <Input
                label={`Alt text for image ${i + 1}`}
                value={img.alt}
                onChange={(e) => setImages((prev) => prev.map((p, idx) => (idx === i ? { ...p, alt: e.target.value } : p)))}
                wrapperClassName="min-w-0 flex-1"
              />
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move image ${i + 1} earlier`}>
                  Up
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={i === images.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move image ${i + 1} later`}
                >
                  Down
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`Remove image ${i + 1}`}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <ImageUploader label="Add an image" onUploaded={(url) => setImages((prev) => [...prev, { url, alt: '' }])} />
      </section>

      <div className="flex gap-3 border-t border-line pt-6">
        <Button type="submit" size="lg" loading={isSubmitting}>
          {product ? 'Save changes' : 'Create product'}
        </Button>
        <Link to="/admin/products" className={buttonClasses({ variant: 'ghost', size: 'lg' })}>
          Cancel
        </Link>
      </div>
    </form>
  )
}

export function AdminProductFormPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'

  const query = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => api.get<{ product: Product }>(`/admin/products/${id}`),
    enabled: !isNew,
    gcTime: 0,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  })

  return (
    <>
      <PageHeader title={isNew ? 'New product' : 'Edit product'} eyebrow="Products" />
      {isNew ? (
        <ProductForm />
      ) : query.isPending ? (
        <LoadingBlock />
      ) : query.isError ? (
        query.error instanceof ApiError && query.error.status === 404 ? (
          <EmptyState
            title="Product not found"
            action={
              <Link to="/admin/products" className={buttonClasses()}>
                Back to products
              </Link>
            }
          />
        ) : (
          <Alert variant="error" title="Could not load product">
            {getErrorMessage(query.error)}
          </Alert>
        )
      ) : (
        <ProductForm key={query.data.product.id} product={query.data.product} />
      )}
    </>
  )
}
