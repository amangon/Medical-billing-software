'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supplierSchema, type SupplierInput } from '@/lib/validations/schemas'
import { useCreateSupplier } from '@/lib/hooks/useSuppliers'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function NewSupplierPage() {
  const router = useRouter()
  const createSupplier = useCreateSupplier()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
  })

  const onSubmit = async (data: SupplierInput) => {
    try {
      await createSupplier.mutateAsync(data)
      toast.success('Supplier created successfully!')
      router.push('/suppliers')
    } catch (error: any) {
      const err = error?.response?.data
      if (err?.fields) {
        Object.entries(err.fields).forEach(([field, fieldErrors]) => {
          const message = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors
          setError(field as any, { type: 'server', message })
        })
        toast.error(err.message || 'Please fix the errors below')
      } else if (err?.message) {
        toast.error(err.message)
      } else {
        toast.error('Failed to create supplier')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#222222]">Add Supplier</h1>
        <p className="text-[#6B7280]">Create a new supplier profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} className="rounded-[24px]" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" {...register('phone')} className="rounded-[24px]" />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} className="rounded-[24px]" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" {...register('gstin')} className="rounded-[24px]" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" {...register('address')} className="rounded-[24px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} className="rounded-[24px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register('state')} className="rounded-[24px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" {...register('pincode')} className="rounded-[24px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input id="creditLimit" type="number" {...register('creditLimit')} className="rounded-[24px]" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-[24px]">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-[24px]">
                {isSubmitting ? 'Creating...' : 'Create Supplier'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
