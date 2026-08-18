import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FONTS_DIR = path.join(__dirname, 'fonts')

const MM = (mm) => mm * 2.83465
const PAGE_MARGIN = MM(18)
const A4_WIDTH = MM(210)
const A4_HEIGHT = MM(297)
const CONTENT_WIDTH = A4_WIDTH - PAGE_MARGIN * 2
const RIGHT_EDGE = PAGE_MARGIN + CONTENT_WIDTH

const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  background: '#f8fafc',
  success: '#16a34a',
  danger: '#dc2626',
  white: '#ffffff',
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function registerFonts(doc) {
  doc.registerFont('normal', path.join(FONTS_DIR, 'NotoSans-Regular.ttf'))
  doc.registerFont('bold', path.join(FONTS_DIR, 'NotoSans-Bold.ttf'))
}

function safeText(val) {
  if (val === null || val === undefined || val === '') return '-'
  return String(val)
}

function formatCurrency(amount, currency = 'INR') {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n)
}

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function amountToWords(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n) || n === 0) return 'Zero Only'
  const integerPart = Math.floor(n)
  const decimalPart = Math.round((n - integerPart) * 100)
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const convert = (num) => {
    if (num === 0) return ''
    if (num < 20) return ones[num] + ' '
    if (num < 100) return tens[Math.floor(num / 10)] + ' ' + convert(num % 10)
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + convert(num % 100)
    if (num < 100000) return convert(Math.floor(num / 1000)) + 'Thousand ' + convert(num % 1000)
    if (num < 10000000) return convert(Math.floor(num / 100000)) + 'Lakh ' + convert(num % 100000)
    return convert(Math.floor(num / 10000000)) + 'Crore ' + convert(num % 10000000)
  }
  let result = integerPart === 0 ? 'Zero' : convert(integerPart).trim()
  if (decimalPart > 0) {
    result += ' and ' + convert(decimalPart).trim() + ' Paise'
  }
  return result + ' Only'
}

function drawRoundedRect(doc, x, y, w, h, r) {
  doc.moveTo(x + r, y)
  doc.lineTo(x + w - r, y)
  doc.quadraticCurveTo(x + w, y, x + w, y + r)
  doc.lineTo(x + w, y + h - r)
  doc.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  doc.lineTo(x + r, y + h)
  doc.lineTo(x, y + h - r)
  doc.quadraticCurveTo(x, y + h, x, y + h - r)
  doc.lineTo(x, y + r)
  doc.quadraticCurveTo(x, y, x + r, y)
  doc.closePath()
}

function addPageIfNeeded(doc, y, requiredHeight) {
  if (y + requiredHeight > A4_HEIGHT - PAGE_MARGIN) {
    doc.addPage()
    return PAGE_MARGIN
  }
  return y
}

function drawCell(doc, x, y, w, h, text, opts = {}) {
  const fontSize = opts.fontSize || 8
  const font = opts.font || 'normal'
  const color = opts.color || COLORS.text
  const bgColor = opts.bgColor || COLORS.white
  const borderColor = opts.borderColor || COLORS.border
  const align = opts.align || 'center'
  const padding = opts.padding || MM(3)

  if (bgColor) {
    doc.fillColor(bgColor)
    doc.rect(x, y, w, h, 'F')
  }

  doc.strokeColor(borderColor)
  doc.lineWidth(0.5)
  doc.rect(x, y, w, h, 'S')

  if (text !== null && text !== undefined && text !== '') {
    doc.fillColor(color)
    doc.font(font).fontSize(fontSize)
    const lines = doc.splitTextToSize(String(text), w - padding * 2)
    const lineHeight = fontSize * 0.35
    const textBlockHeight = lines.length * lineHeight
    let textY = y + (h - textBlockHeight) / 2 + lineHeight * 0.8
    doc.text(lines, x + padding, textY, { width: w - padding * 2, align, lineBreak: false })
  }
}

function drawSectionCard(doc, x, y, w, h, title, lines, opts = {}) {
  const titleColor = opts.titleColor || COLORS.primary
  const titleSize = opts.titleSize || 10
  const textSize = opts.textSize || 8
  const padding = MM(8)
  const lineGap = MM(4)

  doc.fillColor(COLORS.background)
  drawRoundedRect(doc, x, y, w, h, 4)
  doc.fill()

  doc.strokeColor(COLORS.border)
  doc.lineWidth(0.5)
  drawRoundedRect(doc, x, y, w, h, 4)
  doc.stroke()

  doc.fillColor(titleColor)
  doc.font('bold').fontSize(titleSize)
  doc.text(title, x + padding, y + MM(6), { width: w - padding * 2 })

  doc.fillColor(COLORS.text)
  doc.font('normal').fontSize(textSize)
  let lineY = y + MM(6) + titleSize * 0.35 + MM(3)
  lines.forEach((line) => {
    const textLines = doc.splitTextToSize(line, w - padding * 2)
    doc.text(textLines, x + padding, lineY, { width: w - padding * 2, lineBreak: false })
    lineY += textLines.length * (textSize * 0.35 + lineGap)
  })

  return y + h
}

export async function generateInvoicePDF(invoice, business, format = 'a4') {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
  })

  registerFonts(doc)

  const b = business || invoice?.business || {}
  const items = invoice.items || []

  const subtotal = Number(invoice.subTotal || 0)
  const discountAmount = Number(invoice.discountAmount || 0)
  const cgstAmount = Number(invoice.cgstAmount || 0)
  const sgstAmount = Number(invoice.sgstAmount || 0)
  const igstAmount = Number(invoice.igstAmount || 0)
  const totalAmount = Number(invoice.totalAmount || 0)
  const paidAmount = Number(invoice.paidAmount || 0)
  const balanceAmount = Number(invoice.balanceAmount || 0)
  const roundOff = Math.round((totalAmount - Math.floor(totalAmount)) * 100) / 100

  let y = PAGE_MARGIN

  // ===== HEADER =====
  const headerStartY = y
  const leftColW = CONTENT_WIDTH * 0.35
  const centerColW = CONTENT_WIDTH * 0.30
  const rightColW = CONTENT_WIDTH * 0.35
  const headerMinHeight = MM(32)

  let leftY = headerStartY + MM(6)
  let centerY = headerStartY + MM(6)
  let rightY = headerStartY + MM(6)

  // Calculate header height
  let headerHeight = headerMinHeight

  // Left column content
  let leftContentHeight = 0
  if (b.logo) {
    leftContentHeight += MM(18) + MM(4)
  }
  doc.font('bold').fontSize(11)
  const nameLines = doc.splitTextToSize(safeText(b.name) || 'Company Name', leftColW - MM(12))
  leftContentHeight += nameLines.length * MM(5) + MM(2)
  doc.font('normal').fontSize(8)
  const addressLine = [b.address, b.city, b.state, b.pincode].filter(Boolean).join(', ') || '-'
  const addressLines = doc.splitTextToSize(addressLine, leftColW - MM(12))
  leftContentHeight += addressLines.length * MM(4) + MM(2)
  const gstinPan = [b.gstin ? `GSTIN: ${b.gstin}` : '', b.pan ? `PAN: ${b.pan}` : ''].filter(Boolean).join('  |  ')
  if (gstinPan) {
    leftContentHeight += MM(4) + MM(2)
  }
  const contactLine = [b.phone, b.email].filter(Boolean).join(' | ')
  if (contactLine) {
    leftContentHeight += MM(4)
  }
  headerHeight = Math.max(headerHeight, leftContentHeight + MM(12))

  // Right column content
  let rightContentHeight = 0
  const metaItems = [
    { label: 'Invoice Number', value: safeText(invoice.invoiceNumber) },
    { label: 'Invoice Date', value: formatDate(invoice.invoiceDate) },
    { label: 'Due Date', value: formatDate(invoice.dueDate) },
    { label: 'Reference Number', value: safeText(invoice.purchaseOrderNumber) || '-' },
    { label: 'Payment Status', value: safeText(invoice.paymentStatus) },
  ]
  rightContentHeight = metaItems.length * MM(10) + MM(16) + MM(4)
  headerHeight = Math.max(headerHeight, rightContentHeight + MM(12))

  // Draw header background
  doc.fillColor(COLORS.primary)
  doc.rect(PAGE_MARGIN, headerStartY, CONTENT_WIDTH, headerHeight, 'F')

  // Center: TAX INVOICE
  doc.fillColor(COLORS.white)
  doc.font('bold').fontSize(20)
  const invoiceTypeText = invoice.invoiceType === 'TAX' ? 'TAX INVOICE' : invoice.invoiceType === 'NON_TAX' ? 'NON-TAX INVOICE' : 'PROFORMA INVOICE'
  doc.text(invoiceTypeText, PAGE_MARGIN + leftColW + (centerColW - doc.widthOfString(invoiceTypeText)) / 2, headerStartY + headerHeight / 2 - MM(6), { width: centerColW })

  // Left: Company Info
  leftY = headerStartY + MM(8)
  if (b.logo) {
    try {
      doc.image(b.logo, PAGE_MARGIN + MM(6), leftY, { width: MM(16), height: MM(16), fit: [MM(16), MM(16)] })
    } catch {}
    leftY += MM(18)
  }
  doc.fillColor(COLORS.white)
  doc.font('bold').fontSize(10)
  doc.text(safeText(b.name) || 'Company Name', PAGE_MARGIN + MM(6), leftY, { width: leftColW - MM(12), lineBreak: false })
  leftY += MM(5)
  doc.font('normal').fontSize(8)
  doc.text(addressLine, PAGE_MARGIN + MM(6), leftY, { width: leftColW - MM(12), lineBreak: false })
  leftY += MM(4)
  if (gstinPan) {
    doc.text(gstinPan, PAGE_MARGIN + MM(6), leftY, { width: leftColW - MM(12), lineBreak: false })
    leftY += MM(4)
  }
  if (contactLine) {
    doc.text(contactLine, PAGE_MARGIN + MM(6), leftY, { width: leftColW - MM(12), lineBreak: false })
  }

  // Right: Invoice Meta
  const metaStartX = PAGE_MARGIN + leftColW + centerColW
  const metaW = rightColW - MM(6)
  rightY = headerStartY + MM(8)

  doc.font('normal').fontSize(8)
  metaItems.forEach((item) => {
    doc.fillColor(COLORS.white)
    doc.font('normal').fontSize(7)
    doc.text(item.label + ':', metaStartX + MM(6), rightY, { width: metaW - MM(12), align: 'right' })
    doc.font('bold').fontSize(8)
    doc.text(item.value, metaStartX + MM(6), rightY + MM(4), { width: metaW - MM(12), align: 'right' })
    rightY += MM(10)
  })

  doc.font('bold').fontSize(10)
  doc.text(formatCurrency(totalAmount), metaStartX + MM(6), rightY, { width: metaW - MM(12), align: 'right' })
  doc.font('normal').fontSize(7)
  doc.text('Total Amount', metaStartX + MM(6), rightY + MM(4), { width: metaW - MM(12), align: 'right' })

  y = headerStartY + headerHeight + MM(8)

  // ===== CUSTOMER SECTION =====
  y = addPageIfNeeded(doc, y, MM(60))
  const cardGap = MM(6)
  const cardWidth = (CONTENT_WIDTH - cardGap * 2) / 3
  const cardMinHeight = MM(36)

  const customer = invoice.customer || {}
  const customerCards = [
    {
      title: 'Customer Details',
      lines: [
        safeText(customer.name) || 'Walk-in Customer',
        safeText(customer.phone) ? `Phone: ${customer.phone}` : '',
        safeText(customer.email) ? `Email: ${customer.email}` : '',
        safeText(customer.gstin) ? `GSTIN: ${customer.gstin}` : '',
      ].filter((l) => l),
    },
    {
      title: 'Billing Address',
      lines: [
        [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || '-',
      ],
    },
    {
      title: 'Shipping Address',
      lines: [
        [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || 'Same as billing address',
      ],
    },
  ]

  let maxCardHeight = cardMinHeight
  const cardHeights = customerCards.map((card) => {
    let h = MM(16) // title space
    doc.font('normal').fontSize(8)
    card.lines.forEach((line) => {
      const textLines = doc.splitTextToSize(line, cardWidth - MM(16))
      h += textLines.length * MM(10) + MM(3)
    })
    maxCardHeight = Math.max(maxCardHeight, h)
    return h
  })

  customerCards.forEach((card, i) => {
    const cx = PAGE_MARGIN + i * (cardWidth + cardGap)
    const cy = y
    drawSectionCard(doc, cx, cy, cardWidth, maxCardHeight, card.title, card.lines)
  })

  y += maxCardHeight + MM(8)

  // ===== PRODUCT TABLE =====
  y = addPageIfNeeded(doc, y, MM(60))

  const colDefs = [
    { key: 'sl', label: '#', width: MM(5) },
    { key: 'item', label: 'Item', width: MM(28) },
    { key: 'hsn', label: 'HSN/SAC', width: MM(13) },
    { key: 'batch', label: 'Batch', width: MM(12) },
    { key: 'expiry', label: 'Expiry', width: MM(11) },
    { key: 'qty', label: 'Qty', width: MM(9) },
    { key: 'rate', label: 'Rate', width: MM(15) },
    { key: 'discount', label: 'Discount', width: MM(15) },
    { key: 'taxable', label: 'Taxable', width: MM(17) },
    { key: 'cgst', label: 'CGST', width: MM(11) },
    { key: 'sgst', label: 'SGST', width: MM(11) },
    { key: 'cess', label: 'CESS', width: MM(10) },
    { key: 'total', label: 'Total', width: MM(18) },
  ]
  const totalTableWidth = colDefs.reduce((sum, c) => sum + c.width, 0)
  const tableX = PAGE_MARGIN

  // Header row
  const headerRowHeight = MM(10)
  let currentX = tableX
  doc.font('bold').fontSize(8)
  colDefs.forEach((col, i) => {
    const cellText = col.label
    drawCell(doc, currentX, y, col.width, headerRowHeight, cellText, {
      fontSize: 8,
      font: 'bold',
      color: COLORS.white,
      bgColor: COLORS.primary,
      borderColor: COLORS.primary,
      align: 'center',
    })
    currentX += col.width
  })
  y += headerRowHeight

  // Body rows
  const bodyRowPadding = MM(3)
  const bodyLineHeight = MM(4)
  const minBodyRowHeight = MM(8)

  items.forEach((item, idx) => {
    const product = item.product || {}
    const itemTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0)
    const discountVal = item.discountType === 'PERCENTAGE'
      ? round2((itemTotal * Number(item.discount || 0)) / 100)
      : Number(item.discount || 0)
    const taxable = round2(itemTotal - discountVal)
    const cgst = Number(item.cgstAmount || 0)
    const sgst = Number(item.sgstAmount || 0)
    const igst = Number(item.igstAmount || 0)
    const total = Number(item.totalAmount || round2(taxable + cgst + sgst + igst))

    const rowData = [
      String(idx + 1),
      safeText(product.name) || '-',
      safeText(product.hsnCode) || '-',
      safeText(product.batchNumber) || '-',
      product.expiryDate ? formatDate(product.expiryDate) : '-',
      String(item.quantity || 0),
      formatCurrency(Number(item.unitPrice || 0)),
      Number(item.discount || 0) > 0 ? (item.discountType === 'PERCENTAGE' ? `${item.discount}%` : formatCurrency(discountVal)) : '-',
      formatCurrency(taxable),
      formatCurrency(cgst),
      formatCurrency(sgst),
      '-',
      formatCurrency(total),
    ]

    // Calculate row height
    let maxLines = 1
    doc.font('normal').fontSize(8)
    rowData.forEach((text, i) => {
      const colW = colDefs[i].width - bodyRowPadding * 2
      const lines = doc.splitTextToSize(String(text), colW)
      maxLines = Math.max(maxLines, lines.length)
    })

    const rowHeight = Math.max(minBodyRowHeight, maxLines * bodyLineHeight + bodyRowPadding * 2)
    const rowY = y

    const rowBgColor = idx % 2 === 0 ? COLORS.white : COLORS.background
    currentX = tableX
    rowData.forEach((text, i) => {
      const colW = colDefs[i].width
      const align = i === 1 ? 'left' : 'center'
      drawCell(doc, currentX, rowY, colW, rowHeight, text, {
        fontSize: 8,
        font: 'normal',
        color: COLORS.text,
        bgColor: rowBgColor,
        borderColor: COLORS.border,
        align,
      })
      currentX += colW
    })

    y = rowY + rowHeight
  })

  y += MM(6)

  // ===== TOTALS SECTION =====
  y = addPageIfNeeded(doc, y, MM(80))
  const totalsBlockW = MM(130)
  const totalsX = RIGHT_EDGE - totalsBlockW
  const totalsY = y

  doc.font('bold').fontSize(11)
  doc.fillColor(COLORS.text)
  doc.text('Summary', totalsX, totalsY)

  let rowY = totalsY + MM(8)
  const totals = [
    { label: 'Subtotal', value: formatCurrency(subtotal) },
    { label: 'Discount', value: '-' + formatCurrency(discountAmount), color: COLORS.danger },
    { label: 'CGST', value: formatCurrency(cgstAmount) },
    { label: 'SGST', value: formatCurrency(sgstAmount) },
    { label: 'IGST', value: formatCurrency(igstAmount) },
    { label: 'Round Off', value: formatCurrency(roundOff) },
    { label: 'Grand Total', value: formatCurrency(totalAmount), bold: true, color: COLORS.primary },
    { label: 'Amount Received', value: formatCurrency(paidAmount), color: COLORS.success },
    { label: 'Balance Due', value: formatCurrency(balanceAmount), bold: true, color: balanceAmount > 0 ? COLORS.danger : COLORS.success },
  ]

  totals.forEach((row) => {
    doc.font(row.bold ? 'bold' : 'normal').fontSize(9)
    doc.fillColor(COLORS.muted)
    doc.text(row.label, totalsX, rowY, { width: totalsBlockW - MM(60) })
    doc.fillColor(row.color || COLORS.text)
    doc.text(row.value, totalsX + totalsBlockW - MM(60), rowY, { width: MM(60), align: 'right' })
    rowY += MM(7)
  })

  y = totalsY + totals.length * MM(7) + MM(10)

  // ===== AMOUNT IN WORDS =====
  y = addPageIfNeeded(doc, y, MM(25))
  doc.font('bold').fontSize(9)
  doc.fillColor(COLORS.text)
  doc.text('Amount in Words:', PAGE_MARGIN, y)
  y += MM(5)
  doc.font('normal').fontSize(9)
  doc.fillColor(COLORS.muted)
  const wordsLines = doc.splitTextToSize(amountToWords(totalAmount), CONTENT_WIDTH)
  doc.text(wordsLines, PAGE_MARGIN, y)
  y += wordsLines.length * MM(5) + MM(10)

  // ===== PAYMENT SECTION =====
  y = addPageIfNeeded(doc, y, MM(60))
  const leftCardW = CONTENT_WIDTH * 0.50
  const rightCardW = CONTENT_WIDTH * 0.42
  const payCardH = MM(52)
  const payGap = MM(8)

  // Left card: QR + UPI
  const leftCardLines = []
  if (b.upiId) {
    leftCardLines.push(`UPI ID: ${b.upiId}`)
    leftCardLines.push('Scan QR code or use UPI ID to pay')
  } else {
    leftCardLines.push('UPI ID not configured')
  }

  const leftCardH = b.upiId ? MM(52) : MM(36)
  drawSectionCard(doc, PAGE_MARGIN, y, leftCardW, leftCardH, 'Scan and Pay', leftCardLines, { titleSize: 10, textSize: 8 })

  // QR code inside left card
  if (b.upiId) {
    try {
      const upiString = `upi://pay?pa=${encodeURIComponent(b.upiId)}&pn=${encodeURIComponent(b.name || '')}&am=${totalAmount}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`
      const qrDataUrl = await QRCode.toDataURL(upiString, { width: 200, margin: 2 })
      doc.image(qrDataUrl, PAGE_MARGIN + MM(8), y + MM(18), { width: MM(28), height: MM(28) })
    } catch {}
  }

  // Right card: Payment Details
  const rightCardX = PAGE_MARGIN + leftCardW + payGap
  const paymentLines = [
    `Method: ${invoice.paymentMethod ? invoice.paymentMethod.replace(/_/g, ' ').toLowerCase() : '-'}`,
    `Status: ${safeText(invoice.paymentStatus)}`,
    `Received: ${formatCurrency(paidAmount)}`,
  ]
  drawSectionCard(doc, rightCardX, y, rightCardW, payCardH, 'Payment Details', paymentLines, { titleSize: 10, textSize: 8 })

  y += Math.max(leftCardH, payCardH) + MM(10)

  // ===== TERMS & CONDITIONS =====
  y = addPageIfNeeded(doc, y, MM(40))
  const termsText = invoice.termsConditions || b.termsConditions
  if (termsText) {
    doc.font('bold').fontSize(9)
    doc.fillColor(COLORS.text)
    doc.text('Terms & Conditions:', PAGE_MARGIN, y, { width: CONTENT_WIDTH })
    y += MM(5)
    doc.font('normal').fontSize(8)
    doc.fillColor(COLORS.muted)
    const termsLines = doc.splitTextToSize(safeText(termsText), CONTENT_WIDTH)
    doc.text(termsLines, PAGE_MARGIN, y)
    y += termsLines.length * MM(4) + MM(8)
  }

  if (invoice.notes) {
    doc.font('bold').fontSize(9)
    doc.fillColor(COLORS.text)
    doc.text('Notes:', PAGE_MARGIN, y, { width: CONTENT_WIDTH })
    y += MM(5)
    doc.font('normal').fontSize(8)
    doc.fillColor(COLORS.muted)
    const notesLines = doc.splitTextToSize(safeText(invoice.notes), CONTENT_WIDTH)
    doc.text(notesLines, PAGE_MARGIN, y)
    y += notesLines.length * MM(4) + MM(10)
  }

  // ===== SIGNATURE & STAMP =====
  y = addPageIfNeeded(doc, y, MM(40))
  const sigX = RIGHT_EDGE - MM(80)
  if (b.signature) {
    try {
      doc.image(b.signature, sigX, y, { width: MM(60), height: MM(20), fit: [MM(60), MM(20)] })
    } catch {}
  }
  doc.font('normal').fontSize(8)
  doc.fillColor(COLORS.muted)
  doc.text('Authorized Signature', sigX, y + MM(22), { width: MM(80), align: 'center' })
  doc.text('Company Stamp', sigX, y + MM(32), { width: MM(80), align: 'center' })

  // ===== FOOTER =====
  const footerY = A4_HEIGHT - PAGE_MARGIN - MM(6)
  doc.font('normal').fontSize(8)
  doc.fillColor(COLORS.muted)
  doc.text('Thank you for your business!', PAGE_MARGIN + CONTENT_WIDTH / 2, footerY, { align: 'center' })
  doc.text(`Generated on ${formatDate(new Date().toISOString())}`, PAGE_MARGIN, footerY, { align: 'left' })
  doc.text('This is a computer-generated invoice.', PAGE_MARGIN + CONTENT_WIDTH - MM(130), footerY, { align: 'right', width: MM(130) })

  const chunks = []
  return new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      resolve({ pdfBuffer, invoice })
    })
    doc.on('error', reject)
    doc.end()
  })
}

export default { generateInvoicePDF }
