'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { invoiceSchema, type InvoiceInput } from '@/lib/validations/schemas'
import { useUpdateInvoice } from '@/lib/hooks/useInvoices'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useProducts } from '@/lib/hooks/useProducts'
import { useCustomers } from '@/lib/hooks/useCustomers'
import { toast } from 'react-hot-toast'
import { Trash2, Plus, ShoppingCart, User, FileText, Calculator, Loader2, Search, Phone, Mail, MapPin, BarChart3, CheckCircle2, Edit } from 'lucide-react'
import { motion } from 'framer-motion'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export default function EditInvoicePage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const updateInvoice = useUpdateInvoice()

  const { data: productsData } = useProducts()
  const { data: customersData } = useCustomers()

  const products = productsData?.data || productsData || []
  const customers = customersData?.data || customersData || []

  const filteredCustomers = customers.filter((customer: { id: string; name: string; phone?: string }) =>
    customer.name.toLowerCase().includes('') || (customer.phone || '').toLowerCase().includes('')
  )

  const [items, setItems] = useState<Array<{
    productId: string
    name: string
    sku?: string
    quantity: number
    unitPrice: number
    discount: number
    discountType: 'AMOUNT' | 'PERCENTAGE'
    cgstRate: number
    sgstRate: number
    igstRate: number
    totalAmount: number
  }>>([])

  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [discount, setDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENTAGE'>('AMOUNT')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProducts = searchTerm
    ? products.filter(
        (p: { name: string; sku?: string }) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    clearErrors,
    setError,
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      isWalkIn: false,
      invoiceDate: '',
      dueDate: '',
      invoiceType: 'TAX',
      notes: '',
      termsConditions: '',
      purchaseOrderNumber: '',
      salespersonId: '',
      discountAmount: 0,
      discountType: 'AMOUNT',
      payment: {
        paymentMethod: '',
        paymentStatus: 'PENDING',
        paidAmount: 0,
      },
    },
  })

  const customerId = watch('customerId')
  const isWalkIn = watch('isWalkIn')

  useEffect(() => {
    if (isWalkIn) {
      setValue('customerId', '')
      clearErrors('customerId')
    }
  }, [isWalkIn, setValue, clearErrors])

  const handleCustomerChange = (value: string) => {
    setValue('customerId', value)
    if (value) {
      setValue('isWalkIn', false)
      clearErrors('customerId')
    }
  }

  const selectedCustomer = customers.find((c: { id: string }) => c.id === customerId)

  const { data: invoiceData, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  useEffect(() => {
    if (invoiceData) {
      reset({
        customerId: invoiceData.customerId || '',
        isWalkIn: invoiceData.isWalkIn || false,
        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toISOString().split('T')[0] : '',
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString().split('T')[0] : '',
        invoiceType: invoiceData.invoiceType || 'TAX',
        notes: invoiceData.notes || '',
        termsConditions: invoiceData.termsConditions || invoiceData.business?.termsConditions || '',
        purchaseOrderNumber: invoiceData.purchaseOrderNumber || '',
        salespersonId: invoiceData.salespersonId || '',
        discountAmount: invoiceData.discountAmount || 0,
        discountType: invoiceData.discountType || 'AMOUNT',
        payment: {
          paymentMethod: invoiceData.paymentMethod || '',
          paymentStatus: invoiceData.paymentStatus || 'PENDING',
          paidAmount: invoiceData.paidAmount || 0,
        },
      })

      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        const invoiceItems = invoiceData.items.map((item: any) => {
          const product = item.product
          return {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            discountType: item.discountType,
            cgstRate: item.cgstRate,
            sgstRate: item.sgstRate,
            igstRate: item.igstRate,
            totalAmount: item.totalAmount,
          }
        })
        setItems(invoiceItems)
      }
    }
  }, [invoiceData, reset])

  const addItemToInvoice = () => {
    if (!selectedProductId || quantity <= 0) {
      toast.error('Please select a product and enter a valid quantity')
      return
    }

    const product = products.find((p: { id: string }) => p.id === selectedProductId)
    if (!product) {
      toast.error('Product not found')
      return
    }

    const sellingPrice = parseFloat(product.sellingPrice)
    const itemTotal = sellingPrice * quantity
    const discountAmount =
      discountType === 'PERCENTAGE'
        ? (itemTotal * discount) / 100
        : discount
    const taxable = itemTotal - discountAmount

    const cgstRate = parseFloat(product.cgstRate ?? '0')
    const sgstRate = parseFloat(product.sgstRate ?? '0')
    const igstRate = parseFloat(product.igstRate ?? '0')

    const cgstAmount = taxable * (cgstRate / 100)
    const sgstAmount = taxable * (sgstRate / 100)
    const igstAmount = taxable * (igstRate / 100)
    const totalTax = cgstAmount + sgstAmount + igstAmount
    const totalAmount = itemTotal - discountAmount + totalTax

    const newItem = {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice: sellingPrice,
      discount,
      discountType,
      cgstRate,
      sgstRate,
      igstRate,
      totalAmount,
    }

    setItems([...items, newItem])
    setSelectedProductId('')
    setQuantity(1)
    setDiscount(0)
    setDiscountType('AMOUNT')
  }

  const removeItem = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId))
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity
      const discountAmount =
        item.discountType === 'PERCENTAGE'
          ? (itemTotal * item.discount) / 100
          : item.discount
      return sum + (itemTotal - discountAmount)
    }, 0)
  }

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity
      const discountAmount =
        item.discountType === 'PERCENTAGE'
          ? (itemTotal * item.discount) / 100
          : item.discount
      const taxable = itemTotal - discountAmount
      return sum + taxable * ((item.cgstRate + item.sgstRate + item.igstRate) / 100)
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax()
  }

  const onSubmit = async (data: InvoiceInput) => {
    if (!id) {
      toast.error('Invoice ID is missing')
      return
    }

    if (items.length === 0) {
      toast.error('Add at least one item to the invoice')
      return
    }

    try {
      await updateInvoice.mutateAsync({
        id,
        data: {
          customerId: data.customerId,
          invoiceType: data.invoiceType,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          notes: data.notes,
          termsConditions: data.termsConditions,
          dueDate: data.dueDate,
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
        },
      })
      toast.success('Invoice updated successfully!')
      router.push(`/invoices/${id}`)
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'Failed to update invoice'
      toast.error(message)

      if (error?.response?.data?.fields) {
        const fields = error.response.data.fields
        Object.entries(fields).forEach(([field, fieldErrors]: [string, any]) => {
          const errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors
          setError(field as any, { type: 'server', message: errorMessage })
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">Failed to load invoice</div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="text-center py-20">Invoice not found</div>
    );
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
        <h1 className="text-3xl font-bold text-[#222222]">Edit Invoice</h1>
        <p className="text-[#6B7280]">Update invoice details</p>
      </motion.div>

      {updateInvoice.isError && (
        <motion.div variants={fadeInUp} className="p-4 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
          {(updateInvoice.error as Error)?.message || 'Something went wrong'}
        </motion.div>
      )}

      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#6B7280]" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1 min-w-0">
                  <Select
                    value={customerId}
                    onValueChange={handleCustomerChange}
                  >
                    <SelectTrigger className="bg-white rounded-[24px]">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCustomers.map((customer: { id: string; name: string }) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customerId && (
                    <p className="text-sm text-destructive mt-1">{errors.customerId.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                Walk-in Customer
              </Label>
              <div className="flex items-center">
                <input
                  id="walkIn"
                  type="checkbox"
                  {...register('isWalkIn')}
                  onChange={(e) => {
                    setValue('isWalkIn', e.target.checked)
                    if (e.target.checked) {
                      setValue('customerId', '')
                      clearErrors('customerId')
                    }
                  }}
                  className="h-4 w-4 text-primary"
                />
                <label htmlFor="walkIn" className="ml-2 text-sm cursor-pointer">
                  {isWalkIn ? 'Enabled for walk-in customers' : 'Disabled - select a customer above'}
                </label>
              </div>
            </div>

            {selectedCustomer && !isWalkIn && (
              <div className="space-y-4">
                <Label>Customer Details</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedCustomer.name}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  )}
                  {selectedCustomer.gstin && (
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span>GSTIN: {selectedCustomer.gstin}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#6B7280]" />
              Invoice Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input id="invoiceDate" type="date" {...register('invoiceDate')} />
                {errors.invoiceDate && (
                  <p className="text-sm text-destructive">{errors.invoiceDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input id="dueDate" type="date" {...register('dueDate')} />
                {errors.dueDate && (
                  <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceType">Invoice Type</Label>
                <Select
                  value={watch('invoiceType')}
                  onValueChange={(value) => setValue('invoiceType', value as InvoiceInput['invoiceType'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TAX">Tax Invoice</SelectItem>
                    <SelectItem value="NON_TAX">Non-Tax Invoice</SelectItem>
                    <SelectItem value="PROFORMA">Proforma Invoice</SelectItem>
                  </SelectContent>
                </Select>
                {errors.invoiceType && (
                  <p className="text-sm text-destructive">{errors.invoiceType.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseOrderNumber">Purchase Order #</Label>
                <Input id="purchaseOrderNumber" {...register('purchaseOrderNumber')} />
                {errors.purchaseOrderNumber && (
                  <p className="text-sm text-destructive">{errors.purchaseOrderNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salespersonId">Salesperson</Label>
                <Input id="salespersonId" {...register('salespersonId')} placeholder="Auto-filled from logged-in user" />
                {errors.salespersonId && (
                  <p className="text-sm text-destructive">{errors.salespersonId.message}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register('notes')} placeholder="Optional notes" className="bg-white rounded-[24px]" />
                {errors.notes && (
                  <p className="text-sm text-destructive">{errors.notes.message}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="termsConditions">Terms & Conditions</Label>
                <Textarea id="termsConditions" {...register('termsConditions')} placeholder="Optional terms and conditions" className="bg-white rounded-[24px]" />
                {errors.termsConditions && (
                  <p className="text-sm text-destructive">{errors.termsConditions.message}</p>
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
              Invoice Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product: { id: string; name: string; sku?: string }) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku || 'No SKU'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Quantity"
                  className="w-24"
                />
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as 'AMOUNT' | 'PERCENTAGE')}
                >
                  <SelectTrigger className="min-w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">Fixed Amount (₹)</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="Discount"
                  className="w-24"
                />
                <Button type="button" onClick={addItemToInvoice}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items added</p>
                  <p className="text-sm">Add products from the list above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit Price</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount Type</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tax Rate</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: any, index: number) => (
                          <tr key={item.productId} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                            <td className="py-4 px-4">{index + 1}</td>
                            <td className="py-4 px-4 truncate max-w-[200px]">{item.name}</td>
                            <td className="py-4 px-4">{item.sku || '-'}</td>
                            <td className="py-4 px-4 text-right">{item.quantity}</td>
                            <td className="py-4 px-4 text-right">₹{Number(item.unitPrice).toFixed(2)}</td>
                            <td className="py-4 px-4 text-right">
                              {item.discountType === 'PERCENTAGE'
                                ? `${item.discount}%`
                                : `₹${Number(item.discount).toFixed(2)}`}
                            </td>
                            <td className="py-4 px-4 text-center">{item.discountType}</td>
                            <td className="py-4 px-4 text-right">
                              {item.cgstRate + item.sgstRate + item.igstRate > 0
                                ? `${item.cgstRate}% + ${item.sgstRate}% + ${item.igstRate}%`
                                : '0%'}
                            </td>
                            <td className="py-4 px-4 text-right">₹{Number(item.totalAmount).toFixed(2)}</td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    toast('Edit item functionality coming soon')
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.productId)}
                                  className="p-0"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border pt-4">
                          <td colSpan={8} className="text-right py-2 px-4 font-semibold text-muted-foreground">
                            Subtotal:
                          </td>
                          <td className="text-left py-2 px-4 font-semibold text-foreground">
                            ₹{calculateSubtotal().toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                        <tr className="border-t border-border">
                          <td colSpan={8} className="text-right py-3 px-4 font-semibold text-muted-foreground">
                            Tax:
                          </td>
                          <td className="text-left py-2 px-4 font-semibold text-foreground">
                            ₹{calculateTotalTax().toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                        <tr className="border-t border-border font-bold">
                          <td colSpan={8} className="text-right py-3 px-4 font-semibold text-muted-foreground">
                            Grand Total:
                          </td>
                          <td className="text-left py-2 px-4 font-semibold text-foreground">
                            ₹{calculateTotal().toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || items.length === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Invoice
        </Button>
      </motion.div>
    </motion.form>
  )
}
