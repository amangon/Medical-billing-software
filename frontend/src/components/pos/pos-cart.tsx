'use client'

import { useState } from 'react'
import { useCartStore, CartItem } from '@/lib/stores/cart-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Minus, Plus, ShoppingCart, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useCustomers } from '@/lib/hooks/useCustomers'
import { useCreateInvoice } from '@/lib/hooks/useInvoices'

export function POSCart() {
  const { items, customerId, setCustomer, updateQuantity, removeItem, updateDiscount, clearCart, getSubtotal, getTotalTax, getTotal } = useCartStore()
  const router = useRouter()
  const { data: customers } = useCustomers()
  const createInvoice = useCreateInvoice()

  const handleCheckout = async () => {
    try {
      const invoiceData = {
        customerId: customerId || 'walk-in',
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceType: 'TAX',
        notes: 'POS Invoice',
        discountAmount: 0,
        discountType: 'AMOUNT',
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountType: item.discountType,
          cgstRate: item.cgstRate,
          sgstRate: item.sgstRate,
          igstRate: item.igstRate,
        })),
      }
      const { data } = await api.post('/invoices', invoiceData)
      toast.success('Invoice created successfully!')
      clearCart()
      router.push(`/invoices/${data.id}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to create invoice')
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Cart ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer</label>
          <Select value={customerId || ''} onValueChange={(value) => setCustomer(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Walk-in Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">Walk-in Customer</SelectItem>
              {customers?.data?.map((customer: unknown) => (
                <SelectItem key={(customer as { id: string }).id} value={(customer as { id: string }).id}>
                  {(customer as { name: string }).name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Cart is empty</p>
            <p className="text-sm">Click products to add them</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item: CartItem) => (
              <div key={item.productId} className="border rounded-lg p-2 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.productId)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-medium text-sm">
                    {(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

{items.length > 0 && (
        <div className="border-t p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{getTotalTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>Total</span>
              <span>{getTotal().toFixed(2)}</span>
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={handleCheckout}>
            Checkout ({getTotal().toFixed(2)})
          </Button>
        </div>
      )}
    </Card>
  )
}
