'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { InvoiceDocument } from '@/components/invoices/invoice-document'

export default function InvoicePreviewPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

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
        if (!res.ok) throw new Error('Failed to fetch invoice')
        const data = await res.json()
        setInvoice(data)
        setBusiness(data.business)
      } catch (err) {
        toast.error('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchInvoice()
  }, [id])

  const handlePrint = () => {
    if (!invoice) return
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return
    setDownloading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const res = await fetch(`/api/invoices/${id}/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error('Failed to download PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded successfully')
    } catch {
      toast.error('Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-destructive text-lg">Invoice not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
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
            width: 194mm;
            min-height: 279mm;
            padding: 0;
            margin: 0;
            background: white;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Invoice #{invoice.invoiceNumber}</h1>
              <p className="text-xs text-muted-foreground">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloading}>
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Paper */}
      <div className="flex justify-center py-8 px-4">
        <div className="bg-white border border-gray-300" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <InvoiceDocument invoice={invoice} business={business} />
        </div>
      </div>
    </div>
  )
}
