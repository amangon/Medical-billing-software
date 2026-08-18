'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { invoiceSchema, type InvoiceInput, type InvoiceItemInput, type InvoicePayment } from '@/lib/validations/schemas'
import { useCreateInvoice } from '@/lib/hooks/useInvoices'
import { useProducts } from '@/lib/hooks/useProducts'
import { useCustomers, useCreateCustomer } from '@/lib/hooks/useCustomers'
import { useBusiness } from '@/lib/hooks/useBusiness'
import { toast } from 'react-hot-toast'
import { Trash2, Plus, Search, ShoppingCart, User, Calendar, FileText, MapPin, Mail, Phone, BarChart3, CreditCard, Edit } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
]

const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIAL', label: 'Partial' },
]

interface CustomerOption {
  id: string
  name: string
  phone?: string
  email?: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const createInvoice = useCreateInvoice()
  const createCustomer = useCreateCustomer()
  const { data: productsData } = useProducts()
  const { data: customersData } = useCustomers()
  const { data: businessData, isLoading: businessLoading } = useBusiness()

  const products = useMemo(() => productsData?.data || productsData || [], [productsData])
  const customers: CustomerOption[] = useMemo(() => customersData?.data || customersData || [], [customersData])
  const business = businessData

  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })

  const [addProductId, setAddProductId] = useState<string>('')
  const [addQuantity, setAddQuantity] = useState(1)
  const [addDiscount, setAddDiscount] = useState(0)
  const [addDiscountType, setAddDiscountType] = useState<'AMOUNT' | 'PERCENTAGE'>('AMOUNT')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      isWalkIn: false,
      invoiceDate: new Date().toISOString().split('T')[0],
      invoiceType: 'TAX',
      discountAmount: 0,
      discountType: 'AMOUNT',
      payment: {
        paymentMethod: '',
        paymentStatus: 'PENDING',
        paidAmount: 0,
      },
      notes: '',
      termsConditions: '',
      purchaseOrderNumber: '',
      salespersonId: '',
    },
  })

  useEffect(() => {
    if (business?.termsConditions) {
      setValue('termsConditions', business.termsConditions)
    }
  }, [business, setValue])

  useEffect(() => {
    if (user?.name) {
      setValue('salespersonId', user.name)
    }
  }, [user, setValue])

  const customerId = watch('customerId')
  const isWalkIn = watch('isWalkIn')
  const watchedItems = watch('items')
  const items: InvoiceItemInput[] = watchedItems || []
  const payment = watch('payment')

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products
    const lower = searchTerm.toLowerCase()
    return products.filter((p: { name: string; sku?: string }) =>
      p.name.toLowerCase().includes(lower) || (p.sku || '').toLowerCase().includes(lower)
    )
  }, [searchTerm, products])

  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return customers
    const lower = customerSearchTerm.toLowerCase()
    return customers.filter((c: CustomerOption) =>
      c.name.toLowerCase().includes(lower) || (c.phone || '').toLowerCase().includes(lower)
    )
  }, [customerSearchTerm, customers])

  const selectedCustomer = useMemo(() => {
    if (isWalkIn) return null
    return customers.find((c: CustomerOption) => c.id === customerId) || null
  }, [customerId, isWalkIn, customers])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity
      const discountAmount = item.discountType === 'PERCENTAGE'
        ? (itemTotal * item.discount) / 100
        : item.discount
      return sum + (itemTotal - discountAmount)
    }, 0)
  }, [items])

  const totalTax = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity
      const discountAmount = item.discountType === 'PERCENTAGE'
        ? (itemTotal * item.discount) / 100
        : item.discount
      const taxable = itemTotal - discountAmount
      return sum + taxable * ((Number(item.cgstRate) + Number(item.sgstRate) + Number(item.igstRate)) / 100)
    }, 0)
  }, [items])

  const invoiceDiscount = Number(watch('discountAmount')) || 0
  const grandTotal = useMemo(() => {
    return subtotal + totalTax - invoiceDiscount
  }, [subtotal, totalTax, invoiceDiscount])

  const remainingBalance = useMemo(() => {
    const paid = Number(payment?.paidAmount) || 0
    return Math.max(0, grandTotal - paid)
  }, [grandTotal, payment])

  const addItem = () => {
    if (!addProductId || addQuantity <= 0) {
      toast.error('Please select a product and enter a valid quantity')
      return
    }

    const product = products.find((p: { id: string }) => p.id === addProductId)
    if (!product) {
      toast.error('Product not found')
      return
    }

    const unitPrice = Number(product.sellingPrice) || 0

    const cgstRate = Number(product.cgstRate) || 0
    const sgstRate = Number(product.sgstRate) || 0
    const igstRate = Number(product.igstRate) || 0

    const existingIndex = items.findIndex((i) => i.productId === addProductId)
    if (existingIndex >= 0) {
      const existing = items[existingIndex]
      const updatedQuantity = existing.quantity + addQuantity
      const newItem: InvoiceItemInput = {
        productId: product.id,
        quantity: updatedQuantity,
        unitPrice: existing.unitPrice,
        discount: existing.discount,
        discountType: existing.discountType,
        cgstRate: existing.cgstRate,
        sgstRate: existing.sgstRate,
        igstRate: existing.igstRate,
      }
      const newItems = [...items]
      newItems[existingIndex] = newItem
      setValue('items', newItems)
    } else {
      const newItem: InvoiceItemInput = {
        productId: product.id,
        quantity: addQuantity,
        unitPrice,
        discount: addDiscount,
        discountType: addDiscountType,
        cgstRate,
        sgstRate,
        igstRate,
      }
      setValue('items', [...items, newItem])
    }

    toast.success('Item added')
    setAddProductId('')
    setAddQuantity(1)
    setAddDiscount(0)
    setAddDiscountType('AMOUNT')
  }

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    const qty = Math.max(1, newQuantity)
    setValue(
      'items',
      items.map((item) =>
        item.productId === productId ? { ...item, quantity: qty } : item
      ),
    )
  }

  const updateItemDiscount = (productId: string, discount: number, discountType: 'AMOUNT' | 'PERCENTAGE') => {
    setValue(
      'items',
      items.map((item) =>
        item.productId === productId ? { ...item, discount, discountType } : item
      ),
    )
  }

  const removeItem = (productId: string) => {
    setValue(
      'items',
      items.filter((item) => item.productId !== productId),
    )
  }

  const handleNewCustomerSubmit = async () => {
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      toast.error('Name and phone are required')
      return
    }
    try {
      const newCustomer = await createCustomer.mutateAsync({
        name: newCustomerForm.name,
        phone: newCustomerForm.phone,
        email: newCustomerForm.email,
        address: newCustomerForm.address,
      })
      setValue('customerId', newCustomer.id)
      setValue('isWalkIn', false)
      setNewCustomerOpen(false)
      setNewCustomerForm({ name: '', phone: '', email: '', address: '' })
      toast.success(`${newCustomer.name} added and selected`)
    } catch {
      // Error handled by mutation onError
    }
  }

  const onSubmit = async (data: InvoiceInput) => {
    clearErrors()
    const isWalkInMode = data.isWalkIn

    if (!isWalkInMode && !data.customerId) {
      toast.error('Please select a customer or enable walk-in mode')
      return
    }

    if (!data.items || data.items.length === 0) {
      toast.error('Add at least one item to the invoice')
      return
    }

    if (createInvoice.isPending) return

      const paymentMethod = data.payment?.paymentMethod
      const payload: any = {
        customerId: isWalkInMode ? undefined : data.customerId,
        isWalkIn: isWalkInMode,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate || undefined,
        invoiceType: data.invoiceType,
        notes: data.notes,
        termsConditions: data.termsConditions,
        purchaseOrderNumber: data.purchaseOrderNumber,
        salespersonId: data.salespersonId,
        discountAmount: data.discountAmount,
        discountType: data.discountType,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          discountType: item.discountType,
          cgstRate: item.cgstRate,
          sgstRate: item.sgstRate,
          igstRate: item.igstRate,
        })),
      }

      if (paymentMethod) {
        payload.payment = {
          paymentMethod,
          paymentStatus: data.payment?.paymentStatus || 'PENDING',
          paidAmount: Number(data.payment?.paidAmount) || 0,
          reference: data.payment?.reference,
          notes: data.payment?.notes,
        }
      }

    try {
      await createInvoice.mutateAsync(payload)
      toast.success('Invoice created successfully')
      router.push('/invoices')
    } catch (error: any) {
      const err = error?.response?.data
      if (err?.fieldErrors) {
        let firstErrorField: string | null = null
        Object.entries(err.fieldErrors).forEach(([field, fieldErrors]) => {
          const messages = Array.isArray(fieldErrors)
            ? fieldErrors.filter((m): m is string => typeof m === 'string')
            : [String(fieldErrors)]
          messages.forEach((msg) => {
            setError(field as any, { type: 'server', message: msg })
          })
          if (!firstErrorField && messages.length > 0) {
            firstErrorField = field
          }
        })
        toast.error(err.message || 'Please fix the errors below')
        if (firstErrorField) {
          const el = document.querySelector(`[name="${firstErrorField}"]`)
          if (el) {
            const rect = (el as HTMLElement).getBoundingClientRect()
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            ;(el as HTMLElement).focus()
          }
        }
      } else if (err?.message) {
        toast.error(err.message)
      } else {
        toast.error('Failed to create invoice')
      }
    }
  }

  const isSubmitting = createInvoice.isPending

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold text-foreground">New Invoice</h1>
        <p className="text-muted-foreground">Create a new customer invoice</p>
      </motion.div>

      {/* Business Section */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading business details...</div>
            ) : business ? (
              <div className="space-y-3">
                {business.logo ? (
                  <Image src={business.logo} alt={business.name} width={48} height={48} className="object-contain rounded" />
                ) : null}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{business.name || ''}</p>
                    <p className="text-sm text-muted-foreground">
                      {[business.address, business.city, business.state, business.pincode]
                        .filter((v) => v && String(v).trim() !== '')
                        .join(', ') || 'Address not set'}
                    </p>
                  </div>
                </div>
                {business.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm">{business.email}</p>
                  </div>
                ) : null}
                {business.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm">{business.phone}</p>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm">GSTIN: {business.gstin || 'Not set'}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Business details not available</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Section */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer mode toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="mode-normal"
                  name="customerMode"
                  checked={!isWalkIn}
                  onChange={() => {
                    setValue('isWalkIn', false)
                    setValue('customerId', '')
                  }}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="mode-normal" className="ml-2 text-sm cursor-pointer">
                  Select Customer
                </Label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="mode-walkin"
                  name="customerMode"
                  checked={isWalkIn}
                  onChange={() => {
                    setValue('isWalkIn', true)
                    setValue('customerId', 'walk-in')
                  }}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="mode-walkin" className="ml-2 text-sm cursor-pointer">
                  Walk-in Customer
                </Label>
              </div>
            </div>

            {/* Customer selector (only when not walk-in) */}
            {!isWalkIn && (
              <div className="space-y-2">
                <Label htmlFor="customer-search">Customer</Label>
                <div className="relative">
                  <Input
                    id="customer-search"
                    placeholder="Search customers by name or phone..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="w-full pr-10 bg-white"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Select
                  value={customerId}
                  onValueChange={(val) => {
                    setValue('customerId', val)
                    const customer = customers.find((c) => c.id === val)
                    if (customer) {
                      toast.success(`Selected ${customer.name}`)
                    }
                  }}
                >
                  <SelectTrigger id="customer-select" className="bg-white">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCustomers.length === 0 ? (
                      <SelectItem value="" disabled>
                        No customers found
                      </SelectItem>
                    ) : (
                      filteredCustomers.map((customer: CustomerOption) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p className="text-sm text-destructive">{errors.customerId.message}</p>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewCustomerOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                  </Button>
                </div>
              </div>
            )}

            {isWalkIn && (
              <div className="p-3 bg-muted/30 rounded-md">
                <span className="text-sm font-medium">Walk-in Customer</span>
                <p className="text-xs text-muted-foreground">
                  No customer account — invoice will be created for cash walk-in sales.
                </p>
              </div>
            )}

            {/* Selected customer info */}
            {selectedCustomer && (
              <div className="space-y-3 pt-2 border-t">
                <Label>Customer Information</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{selectedCustomer.name}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{selectedCustomer.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Invoice Details Section */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Invoice Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-date">Invoice Date</Label>
                <Input
                  id="invoice-date"
                  type="date"
                  {...register('invoiceDate')}
                  className="bg-white"
                />
                {errors.invoiceDate && (
                  <p className="text-sm text-destructive">{errors.invoiceDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date (Optional)</Label>
                <Input
                  id="due-date"
                  type="date"
                  {...register('dueDate')}
                  className="bg-white"
                />
                {errors.dueDate && (
                  <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-type">Invoice Type</Label>
                <Select
                  value={watch('invoiceType')}
                  onValueChange={(val) => setValue('invoiceType', val as InvoiceInput['invoiceType'])}
                >
                  <SelectTrigger id="invoice-type" className="bg-white">
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
                <Label htmlFor="po-number">Purchase Order #</Label>
                <Input
                  id="po-number"
                  {...register('purchaseOrderNumber')}
                  placeholder="Optional"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesperson">Salesperson</Label>
                <Input
                  id="salesperson"
                  {...register('salespersonId')}
                  placeholder={user?.name || 'Auto-filled from logged-in user'}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Optional notes"
                  className="bg-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Items Section */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              Invoice Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-white"
                  />
                </div>
                <Select
                  value={addProductId}
                  onValueChange={setAddProductId}
                >
                  <SelectTrigger className="min-w-[180px] bg-white">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.length === 0 ? (
                      <SelectItem value="" disabled>
                        No products found
                      </SelectItem>
                    ) : (
                      filteredProducts.map((product: { id: string; name: string; sku?: string }) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Qty"
                  className="w-24 bg-white"
                />
                <Input
                  type="number"
                  min={0}
                  value={addDiscount}
                  onChange={(e) => setAddDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="Discount"
                  className="w-24 bg-white"
                />
                <Select
                  value={addDiscountType}
                  onValueChange={(val) => setAddDiscountType(val as 'AMOUNT' | 'PERCENTAGE')}
                >
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">Fixed Amount (₹)</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addItem} variant="outline">
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">#</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Product</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Qty</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Rate</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Discount</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Tax</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const product = products.find((p: { id: string; name: string }) => p.id === item.productId)
                        const rate = item.unitPrice
                        const itemTotal = rate * item.quantity
                        const discountAmount =
                          item.discountType === 'PERCENTAGE'
                            ? (itemTotal * item.discount) / 100
                            : item.discount
                        const taxable = itemTotal - discountAmount
                        const taxRate = Number(item.cgstRate) + Number(item.sgstRate) + Number(item.igstRate)
                        const taxAmount = (taxable * taxRate) / 100
                        const total = itemTotal - discountAmount + taxAmount

                        return (
                          <tr key={item.productId} className="border-b border-border/50">
                            <td className="py-4 px-4">{index + 1}</td>
                            <td className="py-4 px-4">{product?.name || item.productId}</td>
                            <td className="py-4 px-4">
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                                className="w-16 bg-white"
                              />
                            </td>
                            <td className="py-4 px-4">₹{rate.toFixed(2)}</td>
                            <td className="py-4 px-4">
                              {item.discountType === 'PERCENTAGE' ? `${item.discount}%` : `₹${item.discount.toFixed(2)}`}
                            </td>
                            <td className="py-4 px-4">{taxRate.toFixed(2)}%</td>
                            <td className="py-4 px-4 text-right">₹{total.toFixed(2)}</td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newDiscount = prompt('Enter discount amount', String(item.discount))
                                    if (newDiscount !== null) {
                                      updateItemDiscount(item.productId, parseFloat(newDiscount) || 0, item.discountType)
                                    }
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.productId)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  <tfoot>
                       <tr className="border-t border-border">
                         <td colSpan={6} className="text-right py-3 px-4 font-semibold text-muted-foreground">Subtotal:</td>
                         <td colSpan={2} className="text-right py-3 px-4 font-semibold">₹{subtotal.toFixed(2)}</td>
                       </tr>
                       <tr className="border-t border-border">
                         <td colSpan={6} className="text-right py-3 px-4 font-semibold text-muted-foreground">Tax:</td>
                         <td colSpan={2} className="text-right py-3 px-4 font-semibold">₹{totalTax.toFixed(2)}</td>
                       </tr>
                       <tr className="border-t border-border pt-4 font-bold">
                         <td colSpan={6} className="text-right py-3 px-4 font-semibold text-muted-foreground">Grand Total:</td>
                         <td colSpan={2} className="text-right py-3 px-4 font-semibold">₹{grandTotal.toFixed(2)}</td>
                       </tr>
                     </tfoot>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Section */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select
                  value={payment?.paymentMethod || ''}
                  onValueChange={(val) => setValue('payment.paymentMethod', val)}
                >
                  <SelectTrigger id="payment-method" className="bg-white">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment?.paymentMethod && (
                  <p className="text-sm text-destructive">{errors.payment.paymentMethod.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-status">Payment Status</Label>
                <Select
                  value={payment?.paymentStatus || 'PENDING'}
                  onValueChange={(val) =>
                    setValue('payment.paymentStatus', val as InvoicePayment['paymentStatus'])
                  }
                >
                  <SelectTrigger id="payment-status" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment?.paymentStatus && (
                  <p className="text-sm text-destructive">{errors.payment.paymentStatus.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid-amount">Amount Received</Label>
                <Input
                  id="paid-amount"
                  type="number"
                  min={0}
                  value={payment?.paidAmount || 0}
                  onChange={(e) => setValue('payment.paidAmount', Number(e.target.value) || 0)}
                  className="bg-white"
                />
                <p className="text-xs text-muted-foreground">
                  Balance: ₹{remainingBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit */}
      <motion.div variants={fadeInUp} className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || items.length === 0}>
          {isSubmitting ? 'Creating...' : 'Create Invoice'}
        </Button>
      </motion.div>

      {/* Add New Customer Dialog */}
      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter customer details to create and select them immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={newCustomerForm.address}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                className="bg-white"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setNewCustomerOpen(false)} disabled={createCustomer.isPending}>
              Cancel
            </Button>
            <Button onClick={handleNewCustomerSubmit} disabled={createCustomer.isPending || !newCustomerForm.name || !newCustomerForm.phone}>
              {createCustomer.isPending ? 'Adding...' : 'Add & Select'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.form>
  )
}
