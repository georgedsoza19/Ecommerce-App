import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Address, AddressInput } from '../api/types'
import { useAuth } from '../context/AuthContext'

const ADDRESSES_KEY = ['addresses']

export function useAddresses() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: () => api.get<{ addresses: Address[] }>('/account/addresses'),
    select: (d) => d.addresses,
    enabled: !!user,
  })
}

export function addressToInput(a: Address): AddressInput {
  return {
    fullName: a.fullName,
    line1: a.line1,
    line2: a.line2 ?? '',
    city: a.city,
    region: a.region,
    postalCode: a.postalCode,
    country: a.country,
    phone: a.phone ?? '',
    isDefault: a.isDefault,
  }
}

export function useAddressActions() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ADDRESSES_KEY })

  const create = useMutation({
    mutationFn: (input: AddressInput) => api.post<{ address: Address }>('/account/addresses', input),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddressInput }) =>
      api.patch<{ address: Address }>(`/account/addresses/${id}`, input),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/account/addresses/${id}`),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

export const EMPTY_ADDRESS: AddressInput = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'US',
  phone: '',
  isDefault: false,
}
