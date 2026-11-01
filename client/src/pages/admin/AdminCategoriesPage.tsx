import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, getErrorMessage } from '../../api/client'
import type { Category } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryBoundary } from '../../components/ui/QueryBoundary'
import { Select } from '../../components/ui/Select'
import { DataTable, Td, Th } from '../../components/ui/Table'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter a name'),
  slug: z.string().trim(),
  description: z.string().trim(),
  parentId: z.string(),
  sortOrder: z.string().regex(/^\d+$/, 'Enter a whole number, 0 or more'),
  active: z.boolean(),
})
type Values = z.infer<typeof schema>

type Editing = { mode: 'new' } | { mode: 'edit'; category: Category } | null

function CategoryForm({
  category,
  all,
  onDone,
  onCancel,
}: {
  category?: Category
  all: Category[]
  onDone: () => void
  onCancel: () => void
}) {
  const qc = useQueryClient()
  const toast = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      description: category?.description ?? '',
      parentId: category?.parentId ?? '',
      sortOrder: String(category?.sortOrder ?? 0),
      active: category?.active ?? true,
    },
  })

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null)
    const body: Record<string, unknown> = {
      name: v.name,
      description: v.description,
      parentId: v.parentId || null,
      sortOrder: Number(v.sortOrder),
      active: v.active,
    }
    if (v.slug) body.slug = v.slug
    try {
      if (category) await api.patch(`/admin/categories/${category.id}`, body)
      else await api.post('/admin/categories', body)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
        qc.invalidateQueries({ queryKey: ['categories'] }),
      ])
      toast.success(category ? 'Category saved' : 'Category created')
      onDone()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && <Alert variant="error">{serverError}</Alert>}
      <Input label="Name" required error={errors.name?.message} {...register('name')} />
      <Input label="URL slug" hint="Leave blank to generate from the name." {...register('slug')} />
      <Textarea label="Description" rows={3} {...register('description')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Parent category" {...register('parentId')}>
          <option value="">None (top level)</option>
          {all
            .filter((c) => c.id !== category?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </Select>
        <Input label="Sort order" inputMode="numeric" error={errors.sortOrder?.message} {...register('sortOrder')} />
      </div>
      <Checkbox label="Active (visible in the store)" {...register('active')} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {category ? 'Save changes' : 'Create category'}
        </Button>
      </div>
    </form>
  )
}

export function AdminCategoriesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [confirm, confirmDialog] = useConfirm()
  const [editing, setEditing] = useState<Editing>(null)

  const query = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get<{ categories: Category[] }>('/admin/categories'),
    select: (d) => d.categories,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/admin/categories/${id}`),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
        qc.invalidateQueries({ queryKey: ['categories'] }),
      ]),
  })

  const onDelete = async (c: Category) => {
    const ok = await confirm({
      title: 'Delete category',
      message: `Delete "${c.name}"? Products in this category will need a new category.`,
    })
    if (!ok) return
    try {
      await remove.mutateAsync(c.id)
      toast.success('Category deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise the catalogue and control the storefront navigation."
        actions={<Button onClick={() => setEditing({ mode: 'new' })}>New category</Button>}
      />
      <QueryBoundary query={query} errorTitle="Could not load categories">
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              title="No categories yet"
              description="Create a category before adding products."
              action={<Button onClick={() => setEditing({ mode: 'new' })}>Create category</Button>}
            />
          ) : (
            <DataTable caption="Categories">
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Slug</Th>
                  <Th>Parent</Th>
                  <Th className="text-right">Order</Th>
                  <Th>Status</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-medium">{c.name}</Td>
                    <Td className="font-mono text-xs">{c.slug}</Td>
                    <Td>{list.find((p) => p.id === c.parentId)?.name ?? '-'}</Td>
                    <Td className="text-right tabular-nums">{c.sortOrder}</Td>
                    <Td>
                      <Badge tone={c.active ? 'green' : 'neutral'}>{c.active ? 'Active' : 'Hidden'}</Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing({ mode: 'edit', category: c })}>
                          Edit<span className="sr-only"> {c.name}</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => onDelete(c)}>
                          Delete<span className="sr-only"> {c.name}</span>
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

      <Modal open={!!editing} title={editing?.mode === 'edit' ? 'Edit category' : 'New category'} onClose={() => setEditing(null)}>
        {editing && (
          <CategoryForm
            key={editing.mode === 'edit' ? editing.category.id : 'new'}
            category={editing.mode === 'edit' ? editing.category : undefined}
            all={query.data ?? []}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
      {confirmDialog}
    </>
  )
}
