import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, getErrorMessage } from '../../api/client'
import type { Banner } from '../../api/types'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { ProductImage } from '../../components/products/ProductImage'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { DataTable, Td, Th } from '../../components/ui/Table'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'

const schema = z.object({
  title: z.string().trim().min(2, 'Enter a title'),
  subtitle: z.string().trim(),
  imageUrl: z.string().trim().min(1, 'Upload an image or enter an image URL'),
  linkUrl: z.string().trim(),
  placement: z.string().trim().min(1, 'Enter a placement'),
  sortOrder: z.string().regex(/^\d+$/, 'Enter a whole number, 0 or more'),
  active: z.boolean(),
})
type Values = z.infer<typeof schema>

type Editing = { mode: 'new' } | { mode: 'edit'; banner: Banner } | null

function BannerForm({ banner, onDone, onCancel }: { banner?: Banner; onDone: () => void; onCancel: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: banner?.title ?? '',
      subtitle: banner?.subtitle ?? '',
      imageUrl: banner?.imageUrl ?? '',
      linkUrl: banner?.linkUrl ?? '',
      placement: banner?.placement ?? 'home-hero',
      sortOrder: String(banner?.sortOrder ?? 0),
      active: banner?.active ?? true,
    },
  })

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null)
    const body = { ...v, sortOrder: Number(v.sortOrder) }
    try {
      if (banner) await api.patch(`/admin/banners/${banner.id}`, body)
      else await api.post('/admin/banners', body)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
        qc.invalidateQueries({ queryKey: ['banners'] }),
      ])
      toast.success(banner ? 'Banner saved' : 'Banner created')
      onDone()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && <Alert variant="error">{serverError}</Alert>}
      <Input label="Title" required error={errors.title?.message} {...register('title')} />
      <Input label="Subtitle" {...register('subtitle')} />
      <Controller
        control={control}
        name="imageUrl"
        render={({ field }) => (
          <div className="space-y-3">
            <Input
              label="Image URL"
              required
              hint="Upload below or paste a URL."
              error={errors.imageUrl?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
            <ImageUploader
              label="Upload an image"
              previewUrl={field.value || undefined}
              onUploaded={(url) => setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true })}
            />
          </div>
        )}
      />
      <Input label="Link" hint="Where the banner button goes, e.g. /products?category=desk." {...register('linkUrl')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Placement" required list="banner-placements" error={errors.placement?.message} {...register('placement')} />
        <datalist id="banner-placements">
          <option value="home-hero" />
        </datalist>
        <Input label="Sort order" inputMode="numeric" error={errors.sortOrder?.message} {...register('sortOrder')} />
      </div>
      <Checkbox label="Active (visible in the store)" {...register('active')} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {banner ? 'Save changes' : 'Create banner'}
        </Button>
      </div>
    </form>
  )
}

export function AdminBannersPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [confirm, confirmDialog] = useConfirm()
  const [editing, setEditing] = useState<Editing>(null)

  const query = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => api.get<{ banners: Banner[] }>('/admin/banners'),
    select: (d) => d.banners,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/admin/banners/${id}`),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
        qc.invalidateQueries({ queryKey: ['banners'] }),
      ]),
  })

  const onDelete = async (b: Banner) => {
    const ok = await confirm({ title: 'Delete banner', message: `Delete the banner "${b.title}"?` })
    if (!ok) return
    try {
      await remove.mutateAsync(b.id)
      toast.success('Banner deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Banners"
        description="Promotional banners shown on the storefront."
        actions={<Button onClick={() => setEditing({ mode: 'new' })}>New banner</Button>}
      />
      <QueryBoundary query={query} errorTitle="Could not load banners">
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              title="No banners yet"
              description="Add a banner to feature a collection or promotion on the homepage."
              action={<Button onClick={() => setEditing({ mode: 'new' })}>Create banner</Button>}
            />
          ) : (
            <DataTable caption="Banners">
              <thead>
                <tr>
                  <Th>Banner</Th>
                  <Th>Placement</Th>
                  <Th className="text-right">Order</Th>
                  <Th>Status</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <ProductImage src={b.imageUrl} alt="" fallbackLabel={b.title} className="h-12 w-20 shrink-0 rounded object-cover" />
                        <div className="min-w-0">
                          <p className="font-medium">{b.title}</p>
                          {b.subtitle && <p className="line-clamp-1 text-xs text-ink-faint">{b.subtitle}</p>}
                        </div>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs">{b.placement}</Td>
                    <Td className="text-right tabular-nums">{b.sortOrder}</Td>
                    <Td>
                      <Badge tone={b.active ? 'green' : 'neutral'}>{b.active ? 'Active' : 'Hidden'}</Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing({ mode: 'edit', banner: b })}>
                          Edit<span className="sr-only"> {b.title}</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => onDelete(b)}>
                          Delete<span className="sr-only"> {b.title}</span>
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )
        }
      </QueryBoundary>

      <Modal open={!!editing} title={editing?.mode === 'edit' ? 'Edit banner' : 'New banner'} onClose={() => setEditing(null)}>
        {editing && (
          <BannerForm
            key={editing.mode === 'edit' ? editing.banner.id : 'new'}
            banner={editing.mode === 'edit' ? editing.banner : undefined}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
      {confirmDialog}
    </>
  )
}
