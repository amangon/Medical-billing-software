'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { useOrder } from '@/lib/hooks/useOrder'

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string }
  const { data: order, isLoading, error } = useOrder(id)
  const [isConverting, setIsConverting] = useState(false)

  const handleConvertToInvoice = async () => {
    setIsConverting(true)
    try {
      // Call the API to convert order to invoice
      const res = await fetch(`/api/orders/${id}/convert-to-invoice`, {
        method: 'POST',
      })
      if (!res.ok) {
        throw new Error('Failed to convert order to invoice')
      }
      const data = await res.json()
      toast.success('Order converted to invoice successfully!')
      // Redirect to the invoice detail page
      window.location.href = `/invoices/${data.id}`
    } catch (err) {
      console.error(err)
      toast.error('Failed to convert order to invoice')
    } finally {
      setIsConverting(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20">Loading...</div>
  }
  if (error) {
    return <div className="text-center py-20">Failed to load order</div>
  }
  if (!order) {
    return <div className="text-center py-20">Order not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#222222]">Order Details</h1>
          <p className="text-[#6B7280]">View and manage order #{order.orderNumber}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/orders">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
          {order.orderStatus !== 'INVOICED' && (
            <Button
              onClick={handleConvertToInvoice}
              disabled={isConverting}
              className="hidden md:flex"
            >
              {isConverting ? 'Converting...' : 'Convert to Invoice'}
              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
            </Button>
          )}
        </div>
      </div>

      {/* Order Header */}
      <Card>
        <CardHeader>
          <CardTitle>Order #{order.orderNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <p className="text-muted-foreground">{formatDate(order.orderDate)}</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <p className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                order.orderStatus === 'PENDING' ? 'bg-[#F8D96B] text-[#92400E]' :
                order.orderStatus === 'CONFIRMED' ? 'bg-[#BFD8FF] text-[#1E3A8A]' :
                order.orderStatus === 'PROCESSING' ? 'bg-[#BFD8FF] text-[#1E3A8A]' :
                order.orderStatus === 'COMPLETED' ? 'bg-[#CFECC7] text-[#166534]' :
                order.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                order.orderStatus === 'INVOICED' ? 'bg-[#D9C6FF] text-[#5B21B6]' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.orderStatus}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium">{order.customer?.name || 'Walk-in Customer'}</p>
            {order.customer?.phone && (
              <p className="text-sm text-muted-foreground">Phone: {order.customer.phone}</p>
            )}
            {order.customer?.email && (
              <p className="text-sm text-muted-foreground">Email: {order.customer.email}</p>
            )}
            {order.customer?.address && (
              <p className="text-sm text-muted-foreground">Address: {order.customer.address}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit Price</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount Type</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tax Rate</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item: any, index: number) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="py-4 px-4">{index + 1}</td>
                        <td className="py-4 px-4">{item.product?.name || '-'}</td>
                        <td className="py-4 px-4">{item.product?.sku || '-'}</td>
                        <td className="py-4 px-4 text-right">{item.quantity}</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 px-4 text-right">
                          {item.discountType === 'PERCENTAGE'
                            ? `${item.discount}%`
                            : `₹${formatCurrency(item.discount)}`}
                        </td>
                        <td className="py-4 px-4 text-center">{item.discountType}</td>
                        <td className="py-4 px-4 text-center">
                          {item.cgstRate + item.sgstRate + item.igstRate > 0
                            ? `${item.cgstRate}% CGST + ${item.sgstRate}% SGST + ${item.igstRate}% IGST`
                            : '0%'}
                        </td>
                        <td className="py-4 px-4 text-right">{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border pt-4">
                      <td colSpan={8} className="text-right py-2 px-4 font-semibold text-muted-foreground">
                        Subtotal:
                      </td>
                      <td className="text-left py-2 px-4 font-semibold text-foreground">
                        {formatCurrency(order.subTotal || 0)}
                      </td>
                    </tr>
                    <tr className="border-t border-border pt-2">
                      <td colSpan={8} className="text-right py-2 px-4 font-semibold text-muted-foreground">
                        Discount:
                      </td>
                      <td className="text-left py-2 px-4 font-semibold text-foreground">
                        {formatCurrency(order.discountAmount || 0)}
                      </td>
                    </tr>
                    <tr className="border-t border-border pt-4 font-bold">
                      <td colSpan={8} className="text-right py-2 px-4 font-semibold text-muted-foreground">
                        Total Amount:
                      </td>
                      <td className="text-left py-2 px-4 font-semibold text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No items found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}