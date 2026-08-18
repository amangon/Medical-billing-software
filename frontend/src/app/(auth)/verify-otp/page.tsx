'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { Loader2, LayoutDashboard } from 'lucide-react'

function VerifyOTPContent() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      toast.success('Email verified successfully!')
      router.push('/login')
    } catch (error) {
      toast.error('Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center justify-center w-14 h-14 bg-[#121212] rounded-[24px] mb-8 hover:opacity-90 transition-opacity">
          <LayoutDashboard className="h-7 w-7 text-white" />
        </Link>
        <h1 className="auth-heading">Verify your email</h1>
        <p className="auth-subheading mt-3">
          Enter the 6-digit code sent to <span className="font-medium text-[#121212]">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="otp" className="auth-label">OTP Code</Label>
          <Input
            id="otp"
            type="text"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="auth-input text-center text-2xl tracking-widest"
            required
          />
        </div>
        <Button type="submit" className="w-full auth-pill-btn" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Verify Email
        </Button>
      </form>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  )
}
