import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Category, Settings } from '../api/types'
import { formatMoney } from '../lib/format'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ settings: Settings }>('/settings'),
    select: (d) => d.settings,
    staleTime: 5 * 60_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ categories: Category[] }>('/categories'),
    select: (d) => d.categories,
    staleTime: 5 * 60_000,
  })
}

/** Returns a formatter bound to the store currency. */
export function useMoney() {
  const { data } = useSettings()
  const currency = data?.currency ?? 'USD'
  return (cents: number) => formatMoney(cents, currency)
}
