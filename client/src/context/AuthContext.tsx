/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, ApiError, setUnauthorizedHandler } from '../api/client'
import type { User } from '../api/types'

export interface RegisterInput {
  name: string
  email: string
  password: string
  phone?: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on first load.
  useEffect(() => {
    let cancelled = false
    api
      .get<{ user: User }>('/auth/me')
      .then((res) => {
        if (!cancelled) setUserState(res.user)
      })
      .catch((err: unknown) => {
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.error('Failed to restore session', err)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // If the session dies mid-use, drop the user and any private cached data.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUserState(null)
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'settings' && q.queryKey[0] !== 'categories' })
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  const resetPrivateCache = useCallback(() => {
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'settings' && q.queryKey[0] !== 'categories' })
  }, [queryClient])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ user: User }>('/auth/login', { email, password })
      resetPrivateCache()
      setUserState(res.user)
      return res.user
    },
    [resetPrivateCache],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const payload: RegisterInput = { ...input }
      if (!payload.phone) delete payload.phone
      const res = await api.post<{ user: User }>('/auth/register', payload)
      resetPrivateCache()
      setUserState(res.user)
      return res.user
    },
    [resetPrivateCache],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Cookies may already be gone; clear local state regardless.
    }
    setUserState(null)
    resetPrivateCache()
  }, [resetPrivateCache])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      setUser: setUserState,
    }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
