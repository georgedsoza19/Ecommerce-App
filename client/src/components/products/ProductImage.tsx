import { useState } from 'react'
import clsx from 'clsx'

interface ProductImageProps {
  src?: string
  alt: string
  className?: string
  /** Shown in the placeholder when there is no usable image. */
  fallbackLabel?: string
  loading?: 'lazy' | 'eager'
}

export function ProductImage({ src, alt, className, fallbackLabel, loading = 'lazy' }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = !src || failedSrc === src

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={clsx('flex items-center justify-center bg-brand-50 font-display text-brand-600', className)}
      >
        <span aria-hidden="true" className="text-[2em] opacity-60">
          {(fallbackLabel ?? alt).charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return <img src={src} alt={alt} loading={loading} className={className} onError={() => setFailedSrc(src)} />
}
