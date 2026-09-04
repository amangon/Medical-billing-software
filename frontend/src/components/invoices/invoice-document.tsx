'use client'

import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { formatCurrency, formatDate, amountToWords } from '@/lib/utils'

type Customer = {
  name?: string
  phone?: string
  email?: string
  gstin?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

type Business = {
  name?: string
  logo?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  phone?: string
  email?: string
  upiId?: string
  signature?: string
}

type InvoiceItem = {
  product?: {
    name?: string
    hsnCode?: string
    mrp?: number
    sku?: string
  }
  productId?: string
  id?: string
  quantity?: number
  unitPrice?: number
  discount?: number
  discountType?: string
  cgstAmount?: number
  sgstAmount?: number
  totalAmount?: number
}

type Invoice = {
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  subTotal?: number
  discountAmount?: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  totalAmount?: number
  paidAmount?: number
  balanceAmount?: number
  paymentStatus?: string
  customer?: Customer
  items?: InvoiceItem[]
  business?: Business
}

export function InvoiceDocument({ invoice, business }: { invoice: Invoice; business?: Business }) {
  const b = business || invoice?.business || {}
  const items = invoice?.items || []
  const customer = invoice?.customer || {}

  const subtotal = Number(invoice?.subTotal || 0)
  const discountAmount = Number(invoice?.discountAmount || 0)
  const cgstAmount = Number(invoice?.cgstAmount || 0)
  const sgstAmount = Number(invoice?.sgstAmount || 0)
  const igstAmount = Number(invoice?.igstAmount || 0)
  const totalAmount = Number(invoice?.totalAmount || 0)
  const paidAmount = Number(invoice?.paidAmount || 0)
  const balanceAmount = Number(invoice?.balanceAmount || 0)
  const totalQty = items.reduce((sum, item) => sum + Math.trunc(Number(item.quantity) || 0), 0)

  const upiLink =
    b?.upiId &&
    `upi://pay?pa=${encodeURIComponent(b.upiId)}&pn=${encodeURIComponent(b.name || '')}&am=${totalAmount}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`

  return (
    <div
      id="invoice-print-area"
      className="bg-white"
      style={{
        width: '194mm',
        minHeight: '279mm',
        padding: '8mm',
        boxSizing: 'border-box',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#000',
        fontSize: '10pt',
        lineHeight: 1.35,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #000',
          paddingBottom: '6mm',
          marginBottom: '4mm',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4mm' }}>
            {b?.logo && (
              <div style={{ width: '16mm', height: '16mm', position: 'relative', flexShrink: 0 }}>
                <Image src={b.logo} alt={b.name || 'Logo'} fill style={{ objectFit: 'contain' }} />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{b?.name || 'Business Name'}</div>
              <div style={{ fontSize: '9pt', color: '#333', marginTop: '1mm' }}>
                {[b?.address, b?.city, b?.state, b?.pincode].filter(Boolean).join(', ') || '-'}
              </div>
              <div style={{ fontSize: '9pt', color: '#333', marginTop: '1mm' }}>
                {b?.phone && <span>Mobile: {b.phone}</span>}
                {b?.phone && b?.email && <span> | </span>}
                {b?.email && <span>{b.email}</span>}
              </div>
              <div style={{ fontSize: '9pt', color: '#333', marginTop: '1mm' }}>
                {b?.gstin && <span>GSTIN: {b.gstin}</span>}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9pt', fontWeight: 600, color: '#555' }}>Invoice No.</div>
            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>{invoice?.invoiceNumber || '-'}</div>
            <div style={{ fontSize: '9pt', fontWeight: 600, color: '#555', marginTop: '3mm' }}>Invoice Date</div>
             <div style={{ fontSize: '10pt' }}>{invoice?.invoiceDate ? formatDate(invoice.invoiceDate) : '-'}</div>
             <div style={{ fontSize: '9pt', fontWeight: 600, color: '#555', marginTop: '3mm' }}>Due Date</div>
             <div style={{ fontSize: '10pt' }}>{invoice?.dueDate ? formatDate(invoice.dueDate) : '-'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3mm' }}>
          <div>
            <span style={{ fontSize: '11pt', fontWeight: 'bold' }}>TAX INVOICE</span>
          </div>
          <div>
            <span style={{ fontSize: '9pt', fontWeight: 600 }}>ORIGINAL FOR RECIPIENT</span>
          </div>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          border: '1px solid #000',
          marginBottom: '4mm',
        }}
      >
        <div style={{ borderRight: '1px solid #000', padding: '3mm' }}>
          <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '2mm' }}>BILL TO</div>
          <div style={{ fontSize: '9pt', lineHeight: 1.4 }}>
            <div style={{ fontWeight: 'bold' }}>{customer?.name || 'Walk-in Customer'}</div>
            {customer?.phone && <div>Mobile: {customer.phone}</div>}
            {customer?.email && <div>Email: {customer.email}</div>}
            {customer?.gstin && <div>GSTIN: {customer.gstin}</div>}
            <div>
              {[customer?.address, customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(', ') || '-'}
            </div>
          </div>
        </div>
        <div style={{ padding: '3mm' }}>
          <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '2mm' }}>SHIP TO</div>
          <div style={{ fontSize: '9pt', lineHeight: 1.4 }}>
            <div style={{ fontWeight: 'bold' }}>{customer?.name || 'Walk-in Customer'}</div>
            <div>
              {[customer?.address, customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(', ') || 'Same as billing address'}
            </div>
            {customer?.gstin && <div>GSTIN: {customer.gstin}</div>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ border: '1px solid #000', marginBottom: '4mm' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            fontSize: '9pt',
          }}
        >
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '32%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: '#000', color: '#fff' }}>
              <th style={thStyle}>S.NO.</th>
              <th style={thStyle}>ITEMS</th>
              <th style={thStyle}>HSN</th>
              <th style={thStyle}>BATCH NO.</th>
              <th style={thStyle}>EXP. DATE</th>
              <th style={thStyle}>QTY.</th>
              <th style={thStyle}>MRP</th>
              <th style={thStyle}>RATE</th>
              <th style={thStyle}>SGST</th>
              <th style={thStyle}>CGST</th>
              <th style={thStyle}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const product = item?.product || {}
              const itemTotal = Number(item?.unitPrice || 0) * Number(item?.quantity || 0)
              const discountVal = item?.discountType === 'PERCENTAGE'
                ? (itemTotal * Number(item?.discount || 0)) / 100
                : Number(item?.discount || 0)
              const taxable = itemTotal - discountVal
              const cgst = Number(item?.cgstAmount || 0)
              const sgst = Number(item?.sgstAmount || 0)
              const total = Number(item?.totalAmount || taxable + cgst + sgst)

              return (
                <tr key={item?.id || index}>
                  <td style={tdCenterStyle}>{index + 1}</td>
                  <td style={tdLeftStyle}>
                    <div style={{ fontWeight: 500 }}>{product?.name || item?.productId || '-'}</div>
                    {product?.sku && <div style={{ color: '#666' }}>SKU: {product.sku}</div>}
                  </td>
                  <td style={tdCenterStyle}>{product?.hsnCode || '-'}</td>
                  <td style={tdCenterStyle}>-</td>
                  <td style={tdCenterStyle}>-</td>
                  <td style={tdCenterStyle}>{item?.quantity || 0}</td>
                  <td style={tdRightStyle}>{formatCurrency(Number(product?.mrp || item?.unitPrice || 0))}</td>
                  <td style={tdRightStyle}>{formatCurrency(Number(item?.unitPrice || 0))}</td>
                  <td style={tdRightStyle}>{formatCurrency(sgst)}</td>
                  <td style={tdRightStyle}>{formatCurrency(cgst)}</td>
                  <td style={tdRightStyle}>{formatCurrency(total)}</td>
                </tr>
              )
            })}
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
              <td colSpan={6} style={{ ...tdRightStyle, textAlign: 'right', padding: '2mm' }}>TOTAL</td>
              <td style={tdRightStyle}>{totalQty}</td>
              <td style={tdRightStyle}></td>
              <td style={tdRightStyle}></td>
              <td style={tdRightStyle}>{formatCurrency(sgstAmount)}</td>
              <td style={tdRightStyle}>{formatCurrency(cgstAmount)}</td>
              <td style={tdRightStyle}>{formatCurrency(totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ border: '1px solid #000', padding: '3mm', marginBottom: '4mm' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm' }}>
          <div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '2mm' }}>Summary</div>
            <div style={{ fontSize: '9pt', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Discount:</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CGST:</span>
                <span>{formatCurrency(cgstAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SGST:</span>
                <span>{formatCurrency(sgstAmount)}</span>
              </div>
              {igstAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IGST:</span>
                  <span>{formatCurrency(igstAmount)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '10pt',
                  borderTop: '1px solid #000',
                  paddingTop: '1mm',
                  marginTop: '1mm',
                }}
              >
                <span>Grand Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2mm' }}>
                <span>Amount Received:</span>
                <span>{formatCurrency(paidAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Balance Due:</span>
                <span>{formatCurrency(balanceAmount)}</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '2mm' }}>Amount in Words</div>
            <div
              style={{
                fontSize: '9pt',
                backgroundColor: '#f5f5f5',
                padding: '2mm',
                border: '1px solid #e5e5e5',
                borderRadius: '2mm',
              }}
            >
              {amountToWords(totalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Payment & QR */}
      <div style={{ border: '1px solid #000', padding: '3mm', marginBottom: '4mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '1mm' }}>Payment Details</div>
            <div style={{ fontSize: '9pt', lineHeight: 1.5 }}>
              <div>Received Amount: {formatCurrency(paidAmount)}</div>
              <div>Payment Method: PhonePe / Google Pay / PayTM / UPI</div>
              {b?.upiId && <div>UPI ID: {b.upiId}</div>}
            </div>
          </div>
          {upiLink && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <QRCodeSVG value={upiLink} size={80} level="M" includeMargin={false} />
              <span style={{ fontSize: '8pt', marginTop: '1mm' }}>Scan to Pay</span>
            </div>
          )}
        </div>
      </div>

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4mm' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>Authorized Signatory</div>
          <div style={{ fontSize: '9pt' }}>{b?.name}</div>
          {b?.signature ? (
            <div style={{ width: '24mm', height: '12mm', position: 'relative', marginTop: '1mm', marginLeft: 'auto' }}>
              <Image src={b.signature} alt="Signature" fill style={{ objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ width: '24mm', height: '12mm', borderBottom: '1px solid #000', marginTop: '2mm', marginLeft: 'auto' }} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '8pt',
          color: '#666',
          marginTop: '6mm',
          paddingTop: '2mm',
          borderTop: '1px solid #e5e5e5',
        }}
      >
        <p>Thank you for your business!</p>
        <p>
          Generated on {formatDate(new Date().toISOString())} | This is a computer-generated invoice and does not require a physical signature.
        </p>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2mm',
  fontWeight: 'bold',
  textAlign: 'center',
  verticalAlign: 'middle',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  whiteSpace: 'normal',
  lineHeight: 1.3,
}

const tdLeftStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2mm',
  textAlign: 'left',
  verticalAlign: 'top',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  whiteSpace: 'normal',
  lineHeight: 1.3,
}

const tdCenterStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2mm',
  textAlign: 'center',
  verticalAlign: 'top',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  whiteSpace: 'normal',
  lineHeight: 1.3,
}

const tdRightStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2mm',
  textAlign: 'right',
  verticalAlign: 'top',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  whiteSpace: 'normal',
  lineHeight: 1.3,
}
