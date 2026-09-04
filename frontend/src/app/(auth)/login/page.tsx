'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import { Loader2, Eye, EyeOff, LayoutDashboard } from 'lucide-react'
import { FadeInUp } from '@/components/animations'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FadeInUp>
      <div className="auth-card">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center w-14 h-14 bg-[#121212] rounded-[24px] mb-8 hover:opacity-90 transition-opacity">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </Link>
          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-subheading mt-3">Sign in to your MyBill account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="auth-label">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="auth-label">Password</Label>
              <Link href="/forgot-password" className="text-sm font-medium text-[#121212] hover:opacity-70 transition-opacity">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input pr-12"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-[#6B6B6B]" /> : <Eye className="h-5 w-5 text-[#6B6B6B]" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full auth-pill-btn" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="auth-body">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-[#121212] hover:opacity-70 transition-opacity">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </FadeInUp>
  )
}
