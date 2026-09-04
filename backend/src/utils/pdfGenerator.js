import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FONTS_DIR = path.join(__dirname, 'fonts')

const MM = (mm) => mm * 2.83465
const PAGE_MARGIN = MM(15)
const A4_WIDTH = MM(210)
const A4_HEIGHT = MM(297)
const CONTENT_WIDTH = A4_WIDTH - PAGE_MARGIN * 2

const COLORS = {
  text: '#000000',
  muted: '#555555',
  border: '#000000',
  white: '#ffffff',
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function registerFonts(doc) {
  try {
    doc.registerFont('normal', path.join(FONTS_DIR, 'NotoSans-Regular.ttf'))
    doc.registerFont('bold', path.join(FONTS_DIR, 'NotoSans-Bold.ttf'))
  } catch {
    // fonts may not exist in all environments
  }
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
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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

function addPageIfNeeded(doc, y, requiredHeight) {
  if (y + requiredHeight > A4_HEIGHT - PAGE_MARGIN) {
    doc.addPage()
    return PAGE_MARGIN
  }
  return y
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

  const LEFT_COL_W = CONTENT_WIDTH * 0.38
  const RIGHT_COL_W = CONTENT_WIDTH * 0.55
  const META_COL_W = CONTENT_WIDTH - LEFT_COL_W - RIGHT_COL_W - MM(6)

  // ===== HEADER BORDER BOX =====
  const headerBorderPadding = MM(6)
  const headerX = PAGE_MARGIN
  const headerY = y
  const headerW = CONTENT_WIDTH
  let headerContentY = headerY + headerBorderPadding

  doc.font('bold').fontSize(18)
  doc.text('TAX INVOICE', headerX + headerBorderPadding, headerContentY)
  headerContentY += MM(7)

  doc.font('normal').fontSize(9)
  doc.text('ORIGINAL FOR RECIPIENT', headerX + headerBorderPadding, headerContentY)
  headerContentY += MM(10)

  const companyInfoLines = [
    safeText(b.name),
    [b.address, b.city, b.state, b.pincode].filter(Boolean).join(', ') || '-',
    b.gstin ? `GSTIN: ${b.gstin}` : '',
    b.phone ? `Mobile: ${b.phone}` : '',
    b.email ? `Email: ${b.email}` : '',
  ].filter((l) => l)

  companyInfoLines.forEach((line) => {
    doc.font('normal').fontSize(9)
    doc.text(line, headerX + headerBorderPadding, headerContentY, { width: LEFT_COL_W - MM(8), lineBreak: false })
    headerContentY += MM(5)
  })

  if (b.logo) {
    try {
      const logoW = MM(20)
      const logoH = MM(20)
      const logoX = headerX + headerBorderPadding
      const logoY = headerY + headerBorderPadding
      doc.image(b.logo, logoX, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] })
    } catch {}
  }

  const metaX = headerX + LEFT_COL_W + MM(6)
  let metaY = headerY + headerBorderPadding
  doc.font('bold').fontSize(9)
  doc.text('Invoice No.', metaX, metaY, { width: META_COL_W, align: 'right' })
  metaY += MM(4)
  doc.font('normal').fontSize(9)
  doc.text(safeText(invoice.invoiceNumber), metaX, metaY, { width: META_COL_W, align: 'right' })
  metaY += MM(6)

  doc.font('bold').fontSize(9)
  doc.text('Invoice Date', metaX, metaY, { width: META_COL_W, align: 'right' })
  metaY += MM(4)
  doc.font('normal').fontSize(9)
  doc.text(formatDate(invoice.invoiceDate), metaX, metaY, { width: META_COL_W, align: 'right' })
  metaY += MM(6)

  doc.font('bold').fontSize(9)
  doc.text('Due Date', metaX, metaY, { width: META_COL_W, align: 'right' })
  metaY += MM(4)
  doc.font('normal').fontSize(9)
  doc.text(formatDate(invoice.dueDate), metaX, metaY, { width: META_COL_W, align: 'right' })

  const headerBottomY = Math.max(headerContentY, metaY + MM(6)) + MM(4)
  doc.rect(headerX, headerY, headerW, headerBottomY - headerY)
  doc.strokeColor(COLORS.border)
  doc.lineWidth(0.5)
  doc.stroke()

  y = headerBottomY + MM(8)

  // ===== CUSTOMER SECTION =====
  y = addPageIfNeeded(doc, y, MM(50))
  const customer = invoice.customer || {}
  const sectionW = (CONTENT_WIDTH - MM(6)) / 2
  const sectionLabelY = y
  doc.font('bold').fontSize(9)
  doc.text('BILL TO', headerX, sectionLabelY, { width: sectionW })
  doc.text('SHIP TO', headerX + sectionW + MM(6), sectionLabelY, { width: sectionW })

  const billToLines = [
    safeText(customer.name) || 'Walk-in Customer',
    safeText(customer.phone) ? `Mobile: ${customer.phone}` : '',
    safeText(customer.email) ? `Email: ${customer.email}` : '',
    safeText(customer.gstin) ? `GSTIN: ${customer.gstin}` : '',
    [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || '-',
  ].filter((l) => l)

  const shipToLines = [
    safeText(customer.name) || 'Walk-in Customer',
    [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || 'Same as billing address',
    safeText(customer.gstin) ? `GSTIN: ${customer.gstin}` : '',
  ].filter((l) => l)

  let billY = sectionLabelY + MM(6)
  doc.font('normal').fontSize(9)
  billToLines.forEach((line) => {
    doc.text(line, headerX, billY, { width: sectionW - MM(4), lineBreak: false })
    billY += MM(5)
  })

  let shipY = sectionLabelY + MM(6)
  shipToLines.forEach((line) => {
    doc.text(line, headerX + sectionW + MM(6), shipY, { width: sectionW - MM(4), lineBreak: false })
    shipY += MM(5)
  })

  const customerBottomY = Math.max(billY, shipY) + MM(4)
  doc.rect(headerX, sectionLabelY - MM(2), sectionW, customerBottomY - sectionLabelY + MM(2))
  doc.rect(headerX + sectionW + MM(6), sectionLabelY - MM(2), sectionW, customerBottomY - sectionLabelY + MM(2))
  doc.strokeColor(COLORS.border)
  doc.lineWidth(0.5)
  doc.stroke()

  y = customerBottomY + MM(8)

  // ===== PRODUCT TABLE =====
  y = addPageIfNeeded(doc, y, MM(60))

  const colDefs = [
    { key: 'sl', label: 'S.NO.', width: MM(10) },
    { key: 'item', label: 'ITEMS', width: MM(42) },
    { key: 'hsn', label: 'HSN', width: MM(14) },
    { key: 'batch', label: 'BATCH NO.', width: MM(18) },
    { key: 'expiry', label: 'EXP. DATE', width: MM(16) },
    { key: 'qty', label: 'QTY.', width: MM(12) },
    { key: 'mrp', label: 'MRP', width: MM(14) },
    { key: 'rate', label: 'RATE', width: MM(16) },
    { key: 'sgst', label: 'SGST', width: MM(14) },
    { key: 'cgst', label: 'CGST', width: MM(14) },
    { key: 'amount', label: 'AMOUNT', width: MM(20) },
  ]
  const tableX = PAGE_MARGIN
  const headerRowHeight = MM(10)
  const bodyRowPadding = MM(3)
  const bodyLineHeight = MM(4)
  const minBodyRowHeight = MM(8)

  let currentX = tableX
  doc.font('bold').fontSize(8)
  colDefs.forEach((col) => {
    drawCell(doc, currentX, y, col.width, headerRowHeight, col.label, {
      fontSize: 8,
      font: 'bold',
      color: COLORS.white,
      bgColor: COLORS.text,
      borderColor: COLORS.border,
      align: 'center',
    })
    currentX += col.width
  })
  y += headerRowHeight

  items.forEach((item, idx) => {
    if (y + minBodyRowHeight > A4_HEIGHT - PAGE_MARGIN - MM(20)) {
      doc.addPage()
      y = PAGE_MARGIN
      let currentX = tableX
      doc.font('bold').fontSize(8)
      colDefs.forEach((col) => {
        drawCell(doc, currentX, y, col.width, headerRowHeight, col.label, {
          fontSize: 8,
          font: 'bold',
          color: COLORS.white,
          bgColor: COLORS.text,
          borderColor: COLORS.border,
          align: 'center',
        })
        currentX += col.width
      })
      y += headerRowHeight
    }

    const product = item.product || {}
    const itemTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0)
    const discountVal = item.discountType === 'PERCENTAGE'
      ? round2((itemTotal * Number(item.discount || 0)) / 100)
      : Number(item.discount || 0)
    const taxable = round2(itemTotal - discountVal)
    const cgst = Number(item.cgstAmount || 0)
    const sgst = Number(item.sgstAmount || 0)
    const total = Number(item.totalAmount || round2(taxable + cgst + sgst))

    const rowData = [
      String(idx + 1),
      safeText(product.name) || '-',
      safeText(product.hsnCode) || '-',
      '-',
      '-',
      String(item.quantity || 0),
      formatCurrency(Number(product.mrp || item.unitPrice || 0)),
      formatCurrency(Number(item.unitPrice || 0)),
      formatCurrency(sgst),
      formatCurrency(cgst),
      formatCurrency(total),
    ]

    let maxLines = 1
    doc.font('normal').fontSize(8)
    rowData.forEach((text, i) => {
      const colW = colDefs[i].width - bodyRowPadding * 2
      const lines = doc.splitTextToSize(String(text), colW)
      maxLines = Math.max(maxLines, lines.length)
    })

    const rowHeight = Math.max(minBodyRowHeight, maxLines * bodyLineHeight + bodyRowPadding * 2)
    const rowY = y
    const rowBgColor = idx % 2 === 0 ? COLORS.white : '#f5f5f5'

    currentX = tableX
    rowData.forEach((text, i) => {
      const colW = colDefs[i].width
      const align = i === 1 ? 'left' : (i >= 7 ? 'right' : 'center')
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

  // Total row
  const totalQty = items.reduce((sum, item) => sum + Math.trunc(Number(item.quantity) || 0), 0)
  const totalRowData = [
    '',
    'TOTAL',
    '',
    '',
    '',
    String(totalQty),
    '',
    '',
    formatCurrency(sgstAmount),
    formatCurrency(cgstAmount),
    formatCurrency(totalAmount),
  ]
  const totalRowHeight = MM(10)
  currentX = tableX
  doc.font('bold').fontSize(9)
  totalRowData.forEach((text, i) => {
    const colW = colDefs[i].width
    const align = i === 1 ? 'left' : (i >= 7 ? 'right' : 'center')
    drawCell(doc, currentX, y, colW, totalRowHeight, text, {
      fontSize: 9,
      font: 'bold',
      color: COLORS.text,
      bgColor: COLORS.white,
      borderColor: COLORS.border,
      align,
    })
    currentX += colW
  })
  y += totalRowHeight + MM(8)

  // ===== PAYMENT / QR SECTION =====
  y = addPageIfNeeded(doc, y, MM(50))
  const paySectionW = CONTENT_WIDTH * 0.6
  const payX = PAGE_MARGIN

  doc.rect(payX, y, paySectionW, MM(36))
  doc.strokeColor(COLORS.border)
  doc.lineWidth(0.5)
  doc.stroke()

  doc.font('bold').fontSize(9)
  doc.text('Payment', payX + MM(4), y + MM(4))
  doc.font('normal').fontSize(9)
  doc.text(`Received Amount: ${formatCurrency(paidAmount)}`, payX + MM(4), y + MM(10))
  doc.text('Payment Method: PhonePe / Google Pay / PayTM / UPI', payX + MM(4), y + MM(16))

  if (b.upiId) {
    doc.text(`UPI ID: ${b.upiId}`, payX + MM(4), y + MM(22))
  }

  if (b.upiId) {
    try {
      const upiString = `upi://pay?pa=${encodeURIComponent(b.upiId)}&pn=${encodeURIComponent(b.name || '')}&am=${totalAmount}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`
      const qrDataUrl = await QRCode.toDataURL(upiString, { width: 200, margin: 2 })
      doc.image(qrDataUrl, payX + MM(90), y + MM(6), { width: MM(24), height: MM(24) })
    } catch {}
  }

  y += MM(44)

  // ===== SIGNATURE =====
  y = addPageIfNeeded(doc, y, MM(30))
  const sigX = RIGHT_EDGE - MM(70)
  doc.font('bold').fontSize(9)
  doc.text('Authorized Signatory', sigX, y, { width: MM(70), align: 'right' })
  doc.font('normal').fontSize(9)
  doc.text(safeText(b.name), sigX, y + MM(5), { width: MM(70), align: 'right' })

  if (b.signature) {
    try {
      doc.image(b.signature, sigX, y + MM(10), { width: MM(60), height: MM(18), fit: [MM(60), MM(18)] })
    } catch {}
  }

  y += MM(40)

  // ===== FOOTER =====
  const footerY = A4_HEIGHT - PAGE_MARGIN - MM(6)
  doc.font('normal').fontSize(8)
  doc.fillColor(COLORS.muted)
  doc.text('Thank you for your business!', PAGE_MARGIN + CONTENT_WIDTH / 2, footerY, { align: 'center' })
  doc.text(`Generated on ${formatDate(new Date().toISOString())}`, PAGE_MARGIN, footerY, { align: 'left' })
  doc.text('This is a computer-generated invoice and does not require a physical signature.', PAGE_MARGIN + CONTENT_WIDTH - MM(140), footerY, { align: 'right', width: MM(140) })

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

export default { generateInvoicePDF }
