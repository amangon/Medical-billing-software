'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, amountToWords } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

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

  const customer = invoice.customer || {}
  const items = invoice.items || []
  const subtotal = Number(invoice.subTotal || 0)
  const discountAmount = Number(invoice.discountAmount || 0)
  const cgstAmount = Number(invoice.cgstAmount || 0)
  const sgstAmount = Number(invoice.sgstAmount || 0)
  const igstAmount = Number(invoice.igstAmount || 0)
  const totalAmount = Number(invoice.totalAmount || 0)
  const paidAmount = Number(invoice.paidAmount || 0)
  const balanceAmount = Number(invoice.balanceAmount || 0)
  const totalQty = items.reduce((sum: number, item: any) => sum + Math.trunc(Number(item.quantity) || 0), 0)

  const upiLink =
    business?.upiId &&
    `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(business.name || '')}&am=${totalAmount}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`

  return (
    <div className="min-h-screen bg-gray-100">
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
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm;
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
              <p className="text-xs text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
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
        <div
          id="invoice-print-area"
          className="bg-white shadow-lg border border-gray-300"
          style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}
        >
          {/* Header */}
          <div className="border-b border-black pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                {business?.logo && (
                  <div className="relative h-16 w-16 shrink-0">
                    <Image src={business.logo} alt={business.name} fill className="object-contain" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold">{business?.name || 'Business Name'}</h2>
                  <p className="text-xs text-gray-600">
                    {[business?.address, business?.city, business?.state, business?.pincode].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {business?.phone && <span>Mobile: {business.phone}</span>}
                    {business?.phone && business?.email && <span> | </span>}
                    {business?.email && <span>{business.email}</span>}
                  </p>
                  <p className="text-xs text-gray-600">
                    {business?.gstin && <span>GSTIN: {business.gstin}</span>}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-500">Invoice No.</div>
                <div className="text-sm font-bold">{invoice.invoiceNumber}</div>
                <div className="text-xs font-semibold text-gray-500 mt-2">Invoice Date</div>
                <div className="text-sm">{formatDate(invoice.invoiceDate)}</div>
                <div className="text-xs font-semibold text-gray-500 mt-2">Due Date</div>
                <div className="text-sm">{formatDate(invoice.dueDate)}</div>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <div>
                <span className="text-sm font-bold">TAX INVOICE</span>
              </div>
              <div>
                <span className="text-xs font-semibold">ORIGINAL FOR RECIPIENT</span>
              </div>
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-2 gap-0 border border-black mb-4">
            <div className="border-r border-black p-3">
              <div className="text-xs font-bold mb-2">BILL TO</div>
              <div className="text-xs space-y-1">
                <div className="font-semibold">{customer.name || 'Walk-in Customer'}</div>
                {customer.phone && <div>Mobile: {customer.phone}</div>}
                {customer.email && <div>Email: {customer.email}</div>}
                {customer.gstin && <div>GSTIN: {customer.gstin}</div>}
                <div>
                  {[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || '-'}
                </div>
              </div>
            </div>
            <div className="p-3">
              <div className="text-xs font-bold mb-2">SHIP TO</div>
              <div className="text-xs space-y-1">
                <div className="font-semibold">{customer.name || 'Walk-in Customer'}</div>
                <div>
                  {[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || 'Same as billing address'}
                </div>
                {customer.gstin && <div>GSTIN: {customer.gstin}</div>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-black mb-4">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-black p-2 text-left font-bold w-8">S.NO.</th>
                  <th className="border border-black p-2 text-left font-bold">ITEMS</th>
                  <th className="border border-black p-2 text-center font-bold w-12">HSN</th>
                  <th className="border border-black p-2 text-center font-bold w-16">BATCH NO.</th>
                  <th className="border border-black p-2 text-center font-bold w-16">EXP. DATE</th>
                  <th className="border border-black p-2 text-center font-bold w-10">QTY.</th>
                  <th className="border border-black p-2 text-right font-bold w-14">MRP</th>
                  <th className="border border-black p-2 text-right font-bold w-14">RATE</th>
                  <th className="border border-black p-2 text-right font-bold w-14">SGST</th>
                  <th className="border border-black p-2 text-right font-bold w-14">CGST</th>
                  <th className="border border-black p-2 text-right font-bold w-16">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => {
                  const product = item.product || {}
                  const itemTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0)
                  const discountVal = item.discountType === 'PERCENTAGE'
                    ? (itemTotal * Number(item.discount || 0)) / 100
                    : Number(item.discount || 0)
                  const taxable = itemTotal - discountVal
                  const cgst = Number(item.cgstAmount || 0)
                  const sgst = Number(item.sgstAmount || 0)
                  const total = Number(item.totalAmount || taxable + cgst + sgst)

                  return (
                    <tr key={item.id || index}>
                      <td className="border border-black p-2 text-center">{index + 1}</td>
                      <td className="border border-black p-2">
                        <div className="font-medium">{product.name || item.productId}</div>
                        {product.sku && <div className="text-gray-500">SKU: {product.sku}</div>}
                      </td>
                      <td className="border border-black p-2 text-center">{product.hsnCode || '-'}</td>
                      <td className="border border-black p-2 text-center">-</td>
                      <td className="border border-black p-2 text-center">-</td>
                      <td className="border border-black p-2 text-center">{item.quantity}</td>
                      <td className="border border-black p-2 text-right">{formatCurrency(Number(product.mrp || item.unitPrice || 0))}</td>
                      <td className="border border-black p-2 text-right">{formatCurrency(Number(item.unitPrice || 0))}</td>
                      <td className="border border-black p-2 text-right">{formatCurrency(sgst)}</td>
                      <td className="border border-black p-2 text-right">{formatCurrency(cgst)}</td>
                      <td className="border border-black p-2 text-right font-medium">{formatCurrency(total)}</td>
                    </tr>
                  )
                })}
                <tr className="font-bold bg-gray-50">
                  <td colSpan={5} className="border border-black p-2 text-right">TOTAL</td>
                  <td className="border border-black p-2 text-center">{totalQty}</td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2 text-right">{formatCurrency(sgstAmount)}</td>
                  <td className="border border-black p-2 text-right">{formatCurrency(cgstAmount)}</td>
                  <td className="border border-black p-2 text-right">{formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="border border-black p-3 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold mb-2">Summary</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between"><span>Discount:</span><span>- {formatCurrency(discountAmount)}</span></div>
                  )}
                  <div className="flex justify-between"><span>CGST:</span><span>{formatCurrency(cgstAmount)}</span></div>
                  <div className="flex justify-between"><span>SGST:</span><span>{formatCurrency(sgstAmount)}</span></div>
                  {igstAmount > 0 && (
                    <div className="flex justify-between"><span>IGST:</span><span>{formatCurrency(igstAmount)}</span></div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
                    <span>Grand Total:</span><span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between"><span>Amount Received:</span><span>{formatCurrency(paidAmount)}</span></div>
                  <div className="flex justify-between font-bold">
                    <span>Balance Due:</span><span>{formatCurrency(balanceAmount)}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold mb-2">Amount in Words</div>
                <div className="text-xs bg-gray-50 p-2 border border-gray-200 rounded">
                  {amountToWords(totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment & QR */}
          <div className="border border-black p-3 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-bold mb-1">Payment Details</div>
                <div className="text-xs">Received Amount: {formatCurrency(paidAmount)}</div>
                <div className="text-xs">Payment Method: PhonePe / Google Pay / PayTM / UPI</div>
                {business?.upiId && <div className="text-xs">UPI ID: {business.upiId}</div>}
              </div>
              {upiLink && (
                <div className="flex flex-col items-center">
                  <QRCodeSVG value={upiLink} size={80} level="M" includeMargin={false} />
                  <span className="text-xs mt-1">Scan to Pay</span>
                </div>
              )}
            </div>
          </div>

          {/* Signature */}
          <div className="flex justify-end mb-4">
            <div className="text-right">
              <div className="text-xs font-bold">Authorized Signatory</div>
              <div className="text-xs">{business?.name}</div>
              {business?.signature && (
                <div className="relative h-12 w-24 mt-1 ml-auto">
                  <Image src={business.signature} alt="Signature" fill className="object-contain" />
                </div>
              )}
              {!business?.signature && (
                <div className="h-12 w-24 border-b border-black mt-2"></div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
            <p>Thank you for your business!</p>
            <p>Generated on {formatDate(new Date().toISOString())} | This is a computer-generated invoice</p>
          </div>
        </div>
      </div>
    </div>
  )
}
