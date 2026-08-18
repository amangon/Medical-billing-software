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
import { Loader2, LayoutDashboard } from 'lucide-react'
import { FadeInUp } from '@/components/animations'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    businessType: '',
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Send only the fields expected by the backend
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName
      }
      await register(registrationData)
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      // Display backend validation errors
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
        errorMessages.forEach((msg: string) => toast.error(msg))
      } else {
        toast.error('Registration failed')
      }
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
          <h1 className="auth-heading">Create an account</h1>
          <p className="auth-subheading mt-3">Start your free trial today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="auth-label">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="auth-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="auth-label">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="auth-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="auth-label">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="auth-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessName" className="auth-label">Business Name</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="auth-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessType" className="auth-label">Business Type</Label>
            <Input
              id="businessType"
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              placeholder="e.g., Retail, Restaurant, Service"
              className="auth-input"
              required
            />
          </div>
          <Button type="submit" className="w-full auth-pill-btn" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Create Account
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="auth-body">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#121212] hover:opacity-70 transition-opacity">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </FadeInUp>
  )
}
