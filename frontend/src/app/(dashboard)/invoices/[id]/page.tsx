'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  Eye,
} from 'lucide-react'
import { formatCurrency, formatDate, amountToWords } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument'

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
    if (!invoice) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const res = await fetch(`/api/invoices/${id}/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error('Failed to generate PDF')
      const pdfBlob = await res.blob()
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
    if (!invoice) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const res = await fetch(`/api/invoices/${id}/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error('Failed to download PDF')
      const pdfBlob = await res.blob()
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
        if (!invoice) {
          toast.error('Invoice not loaded yet')
          setIsSharing(false)
          return
        }
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        const pdfRes = await fetch(`/api/invoices/${id}/pdf`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!pdfRes.ok) throw new Error('Failed to generate PDF')
        const pdfBlob = await pdfRes.blob()
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
          @page {
            size: A4 portrait;
            margin: 0;
          }
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
            width: 210mm;
            min-height: 297mm;
            padding: 8mm;
            margin: 0;
            background: white;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
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
          <Button variant="outline" size="sm" onClick={() => router.push(`/invoices/${id}/preview`)}>
            <Eye className="mr-2 h-4 w-4" />
            View Invoice
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="invoice-paper bg-white rounded-2xl shadow-float border border-border/60 overflow-hidden"
      >
        <InvoiceDocument invoice={invoice} business={business} />
      </motion.div>
    </div>
  )
}
