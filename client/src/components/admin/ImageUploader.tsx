import { useId, useRef, useState } from 'react'
import { api, getErrorMessage } from '../../api/client'
import { ProductImage } from '../products/ProductImage'
import { Button } from '../ui/Button'
import { UploadIcon } from '../ui/Icons'

interface ImageUploaderProps {
  label: string
  onUploaded: (url: string) => void
  /** Optional preview of the current value. */
  previewUrl?: string
}

/** Uploads an image via POST /admin/uploads and reports the resulting URL. */
export function ImageUploader({ label, onUploaded, previewUrl }: ImageUploaderProps) {
  const inputId = useId()
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Images must be 5 MB or smaller.')
      return
    }
    setUploading(true)
    try {
      const res = await api.upload<{ url: string }>('/admin/uploads', file)
      onUploaded(res.url)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-4">
        {previewUrl && <ProductImage src={previewUrl} alt="Current image preview" className="size-16 rounded-md object-cover" />}
        <input
          ref={ref}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onChange(e.target.files)}
        />
        <Button variant="secondary" size="sm" loading={uploading} onClick={() => ref.current?.click()}>
          <UploadIcon width={16} height={16} />
          {uploading ? 'Uploading' : 'Upload image'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
