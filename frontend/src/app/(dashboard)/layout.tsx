'use client'

import { AuthProvider, useAuth } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { useEffect } from 'react'

export const dynamic = 'force-dynamic'

function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return <DashboardShell>{children}</DashboardShell>
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AuthCheck>{children}</AuthCheck>
    </AuthProvider>
  )
}
