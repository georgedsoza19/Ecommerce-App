import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { useWishlistActions } from '../../hooks/useWishlist'
import { HeartIcon } from '../ui/Icons'

interface WishlistButtonProps {
  productId: string
  productName: string
  className?: string
}

export function WishlistButton({ productId, productName, className }: WishlistButtonProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { add, remove, isWishlisted, pending } = useWishlistActions()
  const saved = isWishlisted(productId)

  const onClick = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    if (saved) remove.mutate(productId)
    else add.mutate(productId)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={clsx(
        'flex size-10 items-center justify-center rounded-full bg-surface/90 text-ink-soft shadow-sm transition-colors',
        'hover:text-brand-700 disabled:opacity-60',
        saved && 'text-brand-700',
        className,
      )}
    >
      <HeartIcon filled={saved} />
    </button>
  )
}
