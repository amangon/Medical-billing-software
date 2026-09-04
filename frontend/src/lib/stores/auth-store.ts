'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  user: { id: string; email: string; name: string; role: string; businessId: string } | null
  token: string | null
  setUser: (user: { id: string; email: string; name: string; role: string; businessId: string } | null) => void
  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
