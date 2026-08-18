'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { api } from './api'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  businessId: string
  isVerified: boolean
  isActive: boolean
  business?: {
    id: string
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
    gstin?: string
    pan?: string
    logo?: string
    gstEnabled: boolean
    cgstRate: number
    sgstRate: number
    igstRate: number
    currency: string
    timezone: string
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  register: (data: SignupData) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

interface SignupData {
  email: string
  password: string
  name: string
  businessName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get('/auth/me')
        setUser(res.data)
      } catch {
        const refresh = localStorage.getItem('refreshToken')
        if (refresh) {
          try {
            const { data } = await api.post('/auth/refresh-token', { refreshToken: refresh })
            localStorage.setItem('accessToken', data.accessToken)
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
            const meRes = await api.get('/auth/me')
            setUser(meRes.data)
          } catch {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
          }
        }
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { user, accessToken, refreshToken } = res.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(user)
  }

  const signup = async (data: SignupData) => {
    const res = await api.post('/auth/register', data)
    const { user, accessToken, refreshToken } = res.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(user)
  }

  const register = async (data: SignupData) => {
    return signup(data)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
    }
  }

  const refreshToken = async () => {
    const refresh = localStorage.getItem('refreshToken')
    if (!refresh) throw new Error('No refresh token')
    const { data } = await api.post('/auth/refresh-token', { refreshToken: refresh })
    localStorage.setItem('accessToken', data.accessToken)
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
