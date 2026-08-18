'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { customerSchema, type CustomerInput } from '@/lib/validations/schemas'
import { useCreateCustomer } from '@/lib/hooks/useCustomers'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function NewCustomerPage() {
  const router = useRouter()
  const createCustomer = useCreateCustomer()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
  })

  const onSubmit = async (data: CustomerInput) => {
    try {
      await createCustomer.mutateAsync(data)
      toast.success('Customer created successfully!')
      router.push('/customers')
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
        toast.error('Failed to create customer')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#222222]">Add Customer</h1>
        <p className="text-[#6B7280]">Create a new customer profile</p>
      </div>

      {createCustomer.isError && (
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
          {(createCustomer.error as Error)?.message || 'Something went wrong'}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
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
              <Button type="submit" disabled={isSubmitting || createCustomer.isPending} className="rounded-[24px]">
                {isSubmitting || createCustomer.isPending ? 'Creating...' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
