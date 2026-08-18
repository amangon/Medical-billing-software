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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { purchaseSchema, type PurchaseInput } from '@/lib/validations/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { useProducts } from '@/lib/hooks/useProducts'
import { Trash2, Plus } from 'lucide-react'

export default function NewPurchasePage() {
  const router = useRouter()
  const { data: suppliersData } = useSuppliers()
  const { data: productsData } = useProducts()
  const [items, setItems] = useState<PurchaseInput['items']>([])
  const [supplierId, setSupplierId] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENTAGE'>('AMOUNT')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    setItems([...items, {
      productId: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'AMOUNT',
      cgstRate: 18,
      sgstRate: 0,
      igstRate: 0,
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: unknown) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const calculateItemTotal = (item: PurchaseInput['items'][0]) => {
    const itemTotal = item.quantity * item.unitPrice
    const discountAmount = item.discountType === 'PERCENTAGE' ? (itemTotal * item.discount) / 100 : item.discount
    const taxable = itemTotal - discountAmount
    const gst = taxable * ((item.cgstRate + item.sgstRate + item.igstRate) / 100)
    return taxable + gst
  }

  const subTotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice
    const discount = item.discountType === 'PERCENTAGE' ? (itemTotal * item.discount) / 100 : item.discount
    return sum + (itemTotal - discount)
  }, 0)

  const totalTax = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice
    const discount = item.discountType === 'PERCENTAGE' ? (itemTotal * item.discount) / 100 : item.discount
    const taxable = itemTotal - discount
    return sum + taxable * ((item.cgstRate + item.sgstRate + item.igstRate) / 100)
  }, 0)

  const discountVal = discountType === 'PERCENTAGE' ? (subTotal * discountAmount) / 100 : discountAmount
  const totalAmount = subTotal + totalTax - discountVal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId || items.length === 0) {
      toast.error('Please select supplier and add at least one item')
      return
    }
    setLoading(true)
    try {
      await api.post('/purchases', {
        supplierId,
        items,
        discountAmount: discountVal,
        discountType,
        notes,
      })
      toast.success('Purchase created successfully!')
      router.push('/purchases')
    } catch (error) {
      toast.error('Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  const suppliers = suppliersData?.data || suppliersData || []
  const products = productsData?.data || productsData || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#222222]">New Purchase</h1>
        <p className="text-[#6B7280]">Create a new purchase order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="rounded-[24px]">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: unknown) => (
                      <SelectItem key={(supplier as { id: string }).id} value={(supplier as { id: string }).id}>
                        {(supplier as { name: string }).name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className="rounded-[24px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" size="sm" onClick={addItem} className="rounded-[24px]">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-center text-[#9CA3AF] py-4">No items added</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>GST %</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateItem(index, 'productId', value)}
                        >
                          <SelectTrigger className="rounded-[24px]">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product: unknown) => (
                              <SelectItem key={(product as { id: string }).id} value={(product as { id: string }).id}>
                                {(product as { name: string }).name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 rounded-[24px]"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-24 rounded-[24px]"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 rounded-[24px]"
                          value={item.cgstRate}
                          onChange={(e) => updateItem(index, 'cgstRate', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {calculateItemTotal(item).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading || items.length === 0} className="rounded-[24px]">
            {loading ? 'Creating...' : 'Create Purchase'}
          </Button>
        </div>
      </form>
    </div>
  )
}
