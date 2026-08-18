'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orderSchema, type OrderInput } from '@/lib/validations/schemas'
import { useCreateOrder } from '@/lib/hooks/useOrders'
import { useCustomers } from '@/lib/hooks/useCustomers'
import { useCartStore, CartItem } from '@/lib/stores/cart-store'
import { toast } from 'react-hot-toast'
import { Trash2, ShoppingCart, User, FileText, Calculator, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export default function NewOrderPage() {
  const router = useRouter()
  const createOrder = useCreateOrder()
  const { data: customersData } = useCustomers()
  const cart = useCartStore()

  const customers = customersData?.data || customersData || []
  const items = cart.items

  const subtotal = cart.getSubtotal()
  const tax = cart.getTotalTax()
  const total = cart.getTotal()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
    setError,
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: '',
      items: [],
      discountAmount: 0,
      discountType: 'AMOUNT',
      paymentMethod: '',
      notes: '',
    },
  })

  const customerId = watch('customerId')

  const handleCustomerChange = (value: string) => {
    setValue('customerId', value)
    if (value) {
      clearErrors('customerId')
    }
  }

  const onSubmit = async (data: OrderInput) => {
    if (items.length === 0) {
      toast.error('Add at least one item to the cart')
      return
    }

    if (createOrder.isPending) return

    const payload = {
      customerId: data.customerId || 'walk-in',
      items: items.map((item: CartItem) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        discountType: item.discountType,
        cgstRate: item.cgstRate,
        sgstRate: item.sgstRate,
        igstRate: item.igstRate,
      })),
      discountAmount: data.discountAmount,
      discountType: data.discountType,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    }

    try {
      await createOrder.mutateAsync(payload)
      toast.success('Order created successfully!')
      cart.clearCart()
      router.push('/orders')
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
        toast.error('Failed to create order')
      }
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold text-[#222222]">New Order</h1>
        <p className="text-[#6B7280]">Create a new customer order</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#6B7280]" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer</Label>
                <Select value={customerId} onValueChange={handleCustomerChange}>
                  <SelectTrigger id="customerId" className="bg-white rounded-[24px]">
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    {customers.map((customer: { id: string; name: string }) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p className="text-sm text-destructive">{errors.customerId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Optional notes"
                  className="bg-white rounded-[24px]"
                />
                {errors.notes && (
                  <p className="text-sm text-destructive">{errors.notes.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#6B7280]" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-[#9CA3AF]"
                >
                  <ShoppingCart className="mx-auto h-10 w-10 mb-3 opacity-40" />
                  <p className="font-medium">No items in cart</p>
                  <p className="text-sm mt-1">Add products from the POS page to get started</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {items.map((item: CartItem) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-4 border border-border rounded-[24px] bg-white hover:shadow-card transition-all duration-200"
                    >
                      <div>
                        <p className="font-medium text-[#222222]">{item.name}</p>
                        <p className="text-sm text-[#6B7280]">
                          {item.quantity} x {item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-[#222222]">{(item.quantity * item.unitPrice).toFixed(2)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => cart.removeItem(item.productId)}
                          className="rounded-full hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#6B7280]" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Tax</span>
                  <span>{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border text-[#222222]">
                  <span>Total</span>
                  <span>{total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeInUp} className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || items.length === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Order
        </Button>
      </motion.div>
    </motion.form>
  )
}
