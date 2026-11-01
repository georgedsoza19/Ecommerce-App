import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '../api/client'
import type { Cart } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

interface CartResponse {
  cart: Cart
}

const CART_KEY = ['cart']

export function useCart() {
  const { user } = useAuth()
  return useQuery({
    queryKey: CART_KEY,
    queryFn: () => api.get<CartResponse>('/cart'),
    select: (d) => d.cart,
    enabled: !!user,
  })
}

export function useCartActions() {
  const qc = useQueryClient()
  const toast = useToast()

  const onSuccess = (data: CartResponse) => qc.setQueryData(CART_KEY, data)
  const onError = (err: unknown) => toast.error(getErrorMessage(err))

  const addItem = useMutation({
    mutationFn: (v: { productId: string; quantity: number }) => api.post<CartResponse>('/cart/items', v),
    onSuccess,
    onError,
  })

  const updateItem = useMutation({
    mutationFn: (v: { productId: string; quantity: number }) =>
      api.patch<CartResponse>(`/cart/items/${v.productId}`, { quantity: v.quantity }),
    onSuccess,
    onError,
  })

  const removeItem = useMutation({
    mutationFn: (productId: string) => api.delete<CartResponse>(`/cart/items/${productId}`),
    onSuccess,
    onError,
  })

  // Coupon errors are shown inline by the caller, so no global onError.
  const applyCoupon = useMutation({
    mutationFn: (code: string) => api.post<CartResponse>('/cart/coupon', { code }),
    onSuccess,
  })

  const removeCoupon = useMutation({
    mutationFn: () => api.delete<CartResponse>('/cart/coupon'),
    onSuccess,
    onError,
  })

  return { addItem, updateItem, removeItem, applyCoupon, removeCoupon }
}
