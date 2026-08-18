'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Printer,
  Download,
  MessageCircle,
  Mail,
  Copy,
  Edit,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, amountToWords } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateInvoicePDFFromElement } from '@/lib/pdfGenerator'

const PAYMENT_STATUSES: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PAID: {
    label: 'Paid',
    color: 'text-green-700',
    bg: 'bg-green-50',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Unpaid',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    icon: Clock,
  },
  PARTIAL: {
    label: 'Partial',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    icon: AlertCircle,
  },
  OVERDUE: {
    label: 'Overdue',
    color: 'text-red-700',
    bg: 'bg-red-50',
    icon: XCircle,
  },
}

export default function InvoiceDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const queryClient = useQueryClient()

  const [invoice, setInvoice] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareMethod, setShareMethod] = useState<'email' | 'whatsapp'>('email')
  const [shareValue, setShareValue] = useState<string>('')
  const [isSharing, setIsSharing] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  const duplicateInvoice = useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await api.post('/invoices', data)
      return res
    },
    onSuccess: (newInvoice: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice duplicated successfully')
      router.push(`/invoices/${newInvoice.id}`)
    },
    onError: () => {
      toast.error('Failed to duplicate invoice')
    },
  })

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        const res = await fetch(`/api/invoices/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          throw new Error('Failed to fetch invoice')
        }
        const data = await res.json()
        setInvoice(data)
        setBusiness(data.business)
        setLoading(false)
      } catch (err) {
        setError('Failed to load invoice')
        setLoading(false)
        toast.error('Failed to load invoice details')
      }
    }

    if (id) {
      fetchInvoice()
    }
  }, [id])

  const handlePrint = async () => {
    if (!invoiceRef.current) {
      toast.error('Invoice not loaded yet')
      return
    }
    try {
      const pdfBlob = await generateInvoicePDFFromElement(invoiceRef.current, invoice.invoiceNumber)
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoiceNumber}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF generated successfully')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      toast.error('Invoice not loaded yet')
      return
    }
    try {
      const pdfBlob = await generateInvoicePDFFromElement(invoiceRef.current, invoice.invoiceNumber)
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoiceNumber}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Failed to download PDF:', error)
      toast.error('Failed to download PDF')
    }
  }

  const handleShare = async () => {
    if (!shareValue && shareMethod === 'email') {
      toast.error('Please enter an email address')
      return
    }

    setIsSharing(true)
    try {
      let pdfBase64: string | undefined
      if (shareMethod === 'email') {
        if (!invoiceRef.current) {
          toast.error('Invoice not loaded yet')
          setIsSharing(false)
          return
        }
        const pdfBlob = await generateInvoicePDFFromElement(invoiceRef.current, invoice.invoiceNumber)
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve((reader.result as string).split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(pdfBlob)
        })
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const res = await fetch(`/api/invoices/${id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          method: shareMethod,
          email: shareMethod === 'email' ? shareValue : undefined,
          phoneNumber: shareMethod === 'whatsapp' ? shareValue : undefined,
          ...(pdfBase64 ? { pdfBase64 } : {}),
        }),
      })
      if (!res.ok) {
        throw new Error('Failed to share invoice')
      }

      if (shareMethod === 'email') {
        toast.success('Invoice shared via email')
      } else if (shareMethod === 'whatsapp') {
        toast.success('Invoice shared via WhatsApp')
      }

      setShareValue('')
    } catch {
      toast.error('Failed to share invoice')
    } finally {
      setIsSharing(false)
    }
  }

  const handleDuplicate = () => {
    if (!invoice) return
    const items = (invoice.items || []).map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount || 0),
      discountType: item.discountType || 'AMOUNT',
      cgstRate: Number(item.cgstRate || 0),
      sgstRate: Number(item.sgstRate || 0),
      igstRate: Number(item.igstRate || 0),
    }))

    duplicateInvoice.mutate({
      customerId: invoice.customerId,
      isWalkIn: invoice.isWalkIn,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : undefined,
      invoiceType: invoice.invoiceType,
      notes: invoice.notes,
      termsConditions: invoice.termsConditions,
      purchaseOrderNumber: invoice.purchaseOrderNumber,
      salespersonId: invoice.salespersonId,
      discountAmount: Number(invoice.discountAmount || 0),
      discountType: invoice.discountType || 'AMOUNT',
      payment: {
        paymentMethod: invoice.paymentMethod || '',
        paymentStatus: 'PENDING',
        paidAmount: 0,
      },
      items,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-destructive text-lg">{error || 'Invoice not found'}</p>
        <Link href="/invoices">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    )
  }

  const statusConfig = PAYMENT_STATUSES[invoice.paymentStatus] || PAYMENT_STATUSES.PENDING
  const StatusIcon = statusConfig.icon

  const subtotal = Number(invoice.subTotal || 0)
  const discountAmount = Number(invoice.discountAmount || 0)
  const cgstAmount = Number(invoice.cgstAmount || 0)
  const sgstAmount = Number(invoice.sgstAmount || 0)
  const igstAmount = Number(invoice.igstAmount || 0)
  const totalAmount = Number(invoice.totalAmount || 0)
  const paidAmount = Number(invoice.paidAmount || 0)
  const balanceAmount = Number(invoice.balanceAmount || 0)

  const roundOff = Math.round(totalAmount - Math.floor(totalAmount) * 100) / 100
  const grandTotal = totalAmount

  const upiLink =
    business?.upiId &&
    `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(business.name || '')}&am=${totalAmount}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area, #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
          }
          .print-break-after {
            break-after: page;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
        @media print and (max-width: 80mm) {
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          .invoice-paper {
            width: 80mm !important;
            min-width: 80mm !important;
            padding: 8mm !important;
          }
          .invoice-table th,
          .invoice-table td {
            padding: 4px 6px !important;
            font-size: 10px !important;
          }
        }
      `}</style>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 no-print"
      >
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice #{invoice.invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(invoice.invoiceDate)} &middot; {invoice.invoiceType === 'TAX' ? 'Tax Invoice' : invoice.invoiceType === 'NON_TAX' ? 'Non-Tax Invoice' : 'Proforma Invoice'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/invoices/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={duplicateInvoice.isPending}>
            {duplicateInvoice.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="default" size="sm" onClick={() => setShareMethod('email')}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="default" size="sm" onClick={() => setShareMethod('whatsapp')}>
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </motion.div>

      {/* Invoice Paper */}
      <motion.div
        id="invoice-print-area"
        ref={invoiceRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="invoice-paper bg-white rounded-2xl shadow-float border border-border/60 overflow-hidden"
      >
        {/* Header */}
        <div className="print-break-inside-avoid border-b border-border/60 bg-gradient-to-r from-white to-secondary/30">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* Company Info */}
              <div className="flex items-start gap-4">
                {business?.logo && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/60">
                    <Image src={business.logo} alt={business.name} fill className="object-contain p-1" />
                  </div>
                )}
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-foreground">{business?.name || 'Business Name'}</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {[business?.address, business?.city, business?.state, business?.pincode]
                      .filter(Boolean)
                      .join(', ') || 'Address not set'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {business?.phone && <span>{business.phone}</span>}
                    {business?.email && <span>{business.email}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {business?.gstin && (
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-medium">
                        GSTIN: {business.gstin}
                      </span>
                    )}
                    {business?.pan && (
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-medium">
                        PAN: {business.pan}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="md:text-right space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  {invoice.invoiceType === 'TAX' ? 'Tax Invoice' : invoice.invoiceType === 'NON_TAX' ? 'Non-Tax Invoice' : 'Proforma Invoice'}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-x-8 gap-y-2 text-sm">
                  <div className="flex md:justify-between md:gap-4">
                    <span className="text-muted-foreground">Invoice #</span>
                    <span className="font-semibold">{invoice.invoiceNumber}</span>
                  </div>
                  {invoice.purchaseOrderNumber && (
                    <div className="flex md:justify-between md:gap-4">
                      <span className="text-muted-foreground">Order #</span>
                      <span className="font-semibold">{invoice.purchaseOrderNumber}</span>
                    </div>
                  )}
                  <div className="flex md:justify-between md:gap-4">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-semibold">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex md:justify-between md:gap-4">
                      <span className="text-muted-foreground">Due Date</span>
                      <span className="font-semibold">{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                  <div className="flex md:justify-between md:gap-4 items-center">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Section */}
        <div className="print-break-inside-avoid border-b border-border/60 p-6 md:p-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bill To */}
            <Card className="border-border/60 bg-secondary/20">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bill To</p>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{invoice.customer?.name || 'Walk-in Customer'}</p>
                  {invoice.customer?.phone && (
                    <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>
                  )}
                  {invoice.customer?.email && (
                    <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
                  )}
                  {invoice.customer?.gstin && (
                    <p className="text-sm font-mono text-muted-foreground">GSTIN: {invoice.customer.gstin}</p>
                  )}
                  {!invoice.customer?.name && (
                    <p className="text-sm text-muted-foreground italic">No customer details available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card className="border-border/60 bg-secondary/20">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billing Address</p>
                <div className="space-y-1">
                  <p className="text-sm text-foreground">
                    {[invoice.customer?.address, invoice.customer?.city, invoice.customer?.state, invoice.customer?.pincode]
                      .filter(Boolean)
                      .join(', ') || 'Not specified'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="border-border/60 bg-secondary/20">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipping Address</p>
                <div className="space-y-1">
                  {invoice.customer?.address ? (
                    <>
                      <p className="text-sm text-foreground">
                        {[invoice.customer?.address, invoice.customer?.city, invoice.customer?.state, invoice.customer?.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">Same as billing address</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Same as billing address</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Items Table */}
        <div className="print-break-inside-avoid border-b border-border/60 p-6 md:p-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="invoice-table w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider">#</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Item</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider">HSN/SAC</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Batch</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Expiry</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-center">Qty</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">Rate</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">Discount</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">Taxable</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">CGST</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">SGST</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">CESS</th>
                  <th className="pb-3 pr-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item: any, index: number) => {
                  const product = item.product || {}
                  const itemTotal = Number(item.unitPrice) * Number(item.quantity)
                  const discountVal = item.discountType === 'PERCENTAGE'
                    ? (itemTotal * Number(item.discount)) / 100
                    : Number(item.discount || 0)
                  const taxable = itemTotal - discountVal
                  const cgst = Number(item.cgstAmount || 0)
                  const sgst = Number(item.sgstAmount || 0)
                  const igst = Number(item.igstAmount || 0)
                  const total = Number(item.totalAmount || itemTotal - discountVal + cgst + sgst + igst)

                  return (
                    <tr key={item.id || index} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-2 text-muted-foreground">{index + 1}</td>
                      <td className="py-3 pr-2">
                        <div>
                          <p className="font-medium text-foreground">{product.name || item.productId}</p>
                          {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                        </div>
                      </td>
                      <td className="py-3 pr-2 font-mono text-xs text-muted-foreground">{product.hsnCode || '-'}</td>
                      <td className="py-3 pr-2 text-xs text-muted-foreground">-</td>
                      <td className="py-3 pr-2 text-xs text-muted-foreground">-</td>
                      <td className="py-3 pr-2 text-center">{item.quantity}</td>
                      <td className="py-3 pr-2 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                      <td className="py-3 pr-2 text-right">
                        {Number(item.discount || 0) > 0
                          ? `${item.discountType === 'PERCENTAGE' ? `${item.discount}%` : formatCurrency(discountVal)}`
                          : '-'}
                      </td>
                      <td className="py-3 pr-2 text-right">{formatCurrency(taxable)}</td>
                      <td className="py-3 pr-2 text-right">{formatCurrency(cgst)}</td>
                      <td className="py-3 pr-2 text-right">{formatCurrency(sgst)}</td>
                      <td className="py-3 pr-2 text-right">{formatCurrency(igst)}</td>
                      <td className="py-3 pr-2 text-right font-medium">{formatCurrency(total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        <div className="print-break-inside-avoid border-b border-border/60 p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Calculations */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-destructive">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {cgstAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CGST</span>
                    <span className="font-medium">{formatCurrency(cgstAmount)}</span>
                  </div>
                )}
                {sgstAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SGST</span>
                    <span className="font-medium">{formatCurrency(sgstAmount)}</span>
                  </div>
                )}
                {igstAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IGST</span>
                    <span className="font-medium">{formatCurrency(igstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Round Off</span>
                  <span className="font-medium">{formatCurrency(roundOff)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border/60">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Amount Received</span>
                  <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/60">
                  <span>Balance Due</span>
                  <span className={balanceAmount > 0 ? 'text-destructive' : 'text-green-600'}>
                    {formatCurrency(balanceAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Amount in Words, QR, UPI, Payment */}
            <div className="space-y-6">
              {/* Amount in Words */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Amount in Words</h3>
                <p className="text-sm font-medium text-foreground leading-relaxed p-3 bg-secondary/30 rounded-lg">
                  {amountToWords(grandTotal)}
                </p>
              </div>

              {/* Payment Method */}
              {invoice.paymentMethod && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment Method</h3>
                  <p className="text-sm font-medium text-foreground capitalize">{invoice.paymentMethod?.toLowerCase().replace('_', ' ')}</p>
                </div>
              )}

              {/* QR Code & UPI */}
              {upiLink && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex flex-col items-center">
                    <QRCodeSVG
                      value={upiLink}
                      size={100}
                      level="M"
                      includeMargin={false}
                      className="rounded-lg border border-border/60"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Scan to Pay</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">UPI Payment</p>
                    <p className="text-muted-foreground">Scan QR code or use UPI ID</p>
                    {business?.upiId && (
                      <p className="font-mono text-xs bg-secondary/50 px-2 py-1 rounded inline-block">
                        {business.upiId}
                      </p>
                    )}
                    {business?.accountHolderName && (
                      <p className="text-xs text-muted-foreground">
                        {business.accountHolderName} | {business.bankName}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Terms, Signature, Stamp */}
        <div className="print-break-inside-avoid p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Terms & Conditions */}
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Terms & Conditions</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {invoice.termsConditions || business?.termsConditions || 'No terms and conditions specified for this invoice.'}
              </p>
              {invoice.notes && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Signature & Stamp */}
            <div className="flex flex-col items-end justify-end space-y-4">
              {business?.signature && (
                <div className="flex flex-col items-center gap-1">
                  <div className="relative h-16 w-32">
                    <Image src={business.signature} alt="Authorized Signature" fill className="object-contain" />
                  </div>
                  <span className="text-xs text-muted-foreground">Authorized Signature</span>
                </div>
              )}
              <div className="text-center space-y-1">
                <div className="h-12 w-24 border-2 border-dashed border-border/60 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Stamp</span>
                </div>
                <span className="text-xs text-muted-foreground">Company Stamp</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-4 border-t border-border/60 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-muted-foreground">
            <p>Generated on {formatDate(new Date().toISOString())}</p>
            <p>This is a computer-generated invoice and does not require a physical signature.</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
