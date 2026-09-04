'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { Loader2, Mail, LayoutDashboard } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
      toast.success('Reset link sent to your email')
    } catch (error) {
      toast.error('Failed to send reset link')
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
        <h1 className="auth-heading">Forgot password?</h1>
        <p className="auth-subheading mt-3">Enter your email and we&apos;ll send you a reset link</p>
      </div>

      {sent ? (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#CFECC7] rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-[#121212]" />
            </div>
          </div>
          <p className="auth-body text-[#6B6B6B]">
            Check your email for a link to reset your password.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full auth-pill-btn border-[#D8CCB8] text-[#121212] hover:bg-[#EFE6D7]">
              Back to login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="auth-label">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <Button type="submit" className="w-full auth-pill-btn" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Send Reset Link
          </Button>
        </form>
      )}

      <div className="mt-8 text-center">
        <p className="auth-body">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-[#121212] hover:opacity-70 transition-opacity">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
