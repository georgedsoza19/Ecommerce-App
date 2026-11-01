import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '../api/client'
import type { WishlistItem } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

interface WishlistResponse {
  items: WishlistItem[]
}

const WISHLIST_KEY = ['wishlist']

export function useWishlist() {
  const { user } = useAuth()
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: () => api.get<WishlistResponse>('/wishlist'),
    select: (d) => d.items,
    enabled: !!user,
  })
}

export function useWishlistActions() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data: items } = useWishlist()

  const onSuccess = (data: WishlistResponse) => qc.setQueryData(WISHLIST_KEY, data)
  const onError = (err: unknown) => toast.error(getErrorMessage(err))

  const add = useMutation({
    mutationFn: (productId: string) => api.post<WishlistResponse>('/wishlist', { productId }),
    onSuccess: (data) => {
      onSuccess(data)
      toast.success('Saved to your wishlist')
    },
    onError,
  })

  const remove = useMutation({
    mutationFn: (productId: string) => api.delete<WishlistResponse>(`/wishlist/${productId}`),
    onSuccess,
    onError,
  })

  const isWishlisted = (productId: string) => !!items?.some((i) => i.product.id === productId)

  return { add, remove, isWishlisted, pending: add.isPending || remove.isPending }
}
