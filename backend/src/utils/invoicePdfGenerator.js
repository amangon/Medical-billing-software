import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateUPIQR } from './qrGenerator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function formatCurrency(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
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

function safeText(val) {
  if (val === null || val === undefined || val === '') return '-'
  return String(val)
}

export async function generateInvoicePDFFromHtml(invoice, business) {
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

  const logoHtml = b?.logo
    ? `<img src="${b.logo}" alt="logo" style="width:14mm;height:14mm;object-fit:contain;flex-shrink:0;" />`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Invoice ${safeText(invoice?.invoiceNumber)}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    font-size: 10pt;
    line-height: 1.35;
    background: #fff;
  }
  .invoice-page {
    width: 210mm;
    min-height: 297mm;
    padding: 8mm;
    margin: 0 auto;
  }
  table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    font-size: 9pt;
  }
  th, td {
    border: 1px solid #000;
    padding: 2mm;
    vertical-align: top;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    line-height: 1.3;
  }
  thead th {
    font-weight: bold;
    text-align: center;
    white-space: nowrap;
    word-break: normal;
    overflow-wrap: normal;
  }
  td.numeric, th.numeric {
    text-align: right;
    white-space: nowrap;
    word-break: normal;
    overflow-wrap: normal;
  }
  td.item-cell {
    text-align: left;
  }
</style>
</head>
<body>
  <div class="invoice-page">
    <div style="border-bottom:1px solid #000;padding-bottom:4mm;margin-bottom:4mm;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4mm;">
        <div style="display:flex;align-items:flex-start;gap:3mm;flex:1;min-width:0;">
          ${logoHtml}
          <div>
            <div style="font-weight:bold;font-size:11pt;">${safeText(b?.name)}</div>
            <div style="font-size:9pt;color:#333;margin-top:0.5mm;">${safeText([b?.address, b?.city, b?.state, b?.pincode].filter(Boolean).join(', ') || '-')}</div>
            <div style="font-size:9pt;color:#333;margin-top:0.5mm;">
              ${b?.phone ? `<span>Mobile: ${b.phone}</span>` : ''}
              ${b?.phone && b?.email ? '<span> | </span>' : ''}
              ${b?.email ? `<span>${b.email}</span>` : ''}
            </div>
            <div style="font-size:9pt;color:#333;margin-top:0.5mm;">
              ${b?.gstin ? `<span>GSTIN: ${b.gstin}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:9pt;font-weight:600;color:#555;">Invoice No.</div>
          <div style="font-size:10pt;font-weight:bold;">${safeText(invoice?.invoiceNumber)}</div>
          <div style="font-size:9pt;font-weight:600;color:#555;margin-top:2mm;">Invoice Date</div>
          <div style="font-size:10pt;">${invoice?.invoiceDate ? formatDate(invoice.invoiceDate) : '-'}</div>
          <div style="font-size:9pt;font-weight:600;color:#555;margin-top:2mm;">Due Date</div>
          <div style="font-size:10pt;">${invoice?.dueDate ? formatDate(invoice.dueDate) : '-'}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:3mm;">
        <div><span style="font-size:11pt;font-weight:bold;">TAX INVOICE</span></div>
        <div><span style="font-size:9pt;font-weight:600;">ORIGINAL FOR RECIPIENT</span></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #000;margin-bottom:4mm;">
      <div style="border-right:1px solid #000;padding:3mm;">
        <div style="font-size:9pt;font-weight:bold;margin-bottom:1.5mm;">BILL TO</div>
        <div style="font-size:9pt;line-height:1.4;">
          <div style="font-weight:bold;">${safeText(customer?.name || 'Walk-in Customer')}</div>
          ${customer?.phone ? `<div>Mobile: ${customer.phone}</div>` : ''}
          ${customer?.email && customer.email !== 'undefined' ? `<div>Email: ${customer.email}</div>` : ''}
          ${customer?.gstin ? `<div>GSTIN: ${customer.gstin}</div>` : ''}
          <div>${safeText([customer?.address, customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(', ') || '-')}</div>
        </div>
      </div>
      <div style="padding:3mm;">
        <div style="font-size:9pt;font-weight:bold;margin-bottom:1.5mm;">SHIP TO</div>
        <div style="font-size:9pt;line-height:1.4;">
          <div style="font-weight:bold;">${safeText(customer?.name || 'Walk-in Customer')}</div>
          <div>${safeText([customer?.address, customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(', ') || 'Same as billing address')}</div>
          ${customer?.gstin ? `<div>GSTIN: ${customer.gstin}</div>` : ''}
        </div>
      </div>
    </div>

    <div style="border:1px solid #000;margin-bottom:4mm;">
      <table>
        <colgroup>
          <col style="width:8mm" />
          <col style="width:42mm" />
          <col style="width:13mm" />
          <col style="width:16mm" />
          <col style="width:16mm" />
          <col style="width:10mm" />
          <col style="width:14mm" />
          <col style="width:14mm" />
          <col style="width:14mm" />
          <col style="width:14mm" />
          <col style="width:19mm" />
        </colgroup>
        <thead>
          <tr>
            <th>S.No.</th>
            <th>ITEMS</th>
            <th>HSN</th>
            <th>BATCH</th>
            <th>EXP.</th>
            <th>QTY</th>
            <th>MRP</th>
            <th>RATE</th>
            <th>SGST</th>
            <th>CGST</th>
            <th>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => {
            const product = item?.product || {}
            const itemTotal = Number(item?.unitPrice || 0) * Number(item?.quantity || 0)
            const discountVal = item?.discountType === 'PERCENTAGE'
              ? (itemTotal * Number(item?.discount || 0)) / 100
              : Number(item?.discount || 0)
            const taxable = itemTotal - discountVal
            const cgst = Number(item?.cgstAmount || 0)
            const sgst = Number(item?.sgstAmount || 0)
            const total = Number(item?.totalAmount || taxable + cgst + sgst)
            return `<tr>
              <td style="text-align:center;white-space:nowrap;">${index + 1}</td>
              <td class="item-cell">
                <div style="font-weight:500;">${safeText(product?.name || item?.productId || '-')}</div>
                ${product?.sku ? `<div style="color:#666;font-size:8pt;">SKU: ${product.sku}</div>` : ''}
              </td>
              <td style="text-align:center;white-space:nowrap;">${safeText(product?.hsnCode || '-')}</td>
              <td style="text-align:center;white-space:nowrap;">-</td>
              <td style="text-align:center;white-space:nowrap;">-</td>
              <td style="text-align:center;white-space:nowrap;">${item?.quantity || 0}</td>
              <td class="numeric">${formatCurrency(Number(product?.mrp || item?.unitPrice || 0))}</td>
              <td class="numeric">${formatCurrency(Number(item?.unitPrice || 0))}</td>
              <td class="numeric">${formatCurrency(sgst)}</td>
              <td class="numeric">${formatCurrency(cgst)}</td>
              <td class="numeric">${formatCurrency(total)}</td>
            </tr>`
          }).join('')}
          <tr style="font-weight:bold;background-color:#f5f5f5;">
            <td colspan="6" style="text-align:right;white-space:nowrap;">TOTAL</td>
            <td class="numeric">${totalQty}</td>
            <td></td>
            <td></td>
            <td class="numeric">${formatCurrency(sgstAmount)}</td>
            <td class="numeric">${formatCurrency(cgstAmount)}</td>
            <td class="numeric">${formatCurrency(totalAmount)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="border:1px solid #000;padding:3mm;margin-bottom:4mm;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm;">
        <div>
          <div style="font-size:9pt;font-weight:bold;margin-bottom:1.5mm;">Summary</div>
          <div style="font-size:9pt;line-height:1.5;">
            <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>
            ${discountAmount > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Discount:</span><span>- ${formatCurrency(discountAmount)}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;"><span>CGST:</span><span>${formatCurrency(cgstAmount)}</span></div>
            <div style="display:flex;justify-content:space-between;"><span>SGST:</span><span>${formatCurrency(sgstAmount)}</span></div>
            ${igstAmount > 0 ? `<div style="display:flex;justify-content:space-between;"><span>IGST:</span><span>${formatCurrency(igstAmount)}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:10pt;border-top:1px solid #000;padding-top:1mm;margin-top:1mm;">
              <span>Grand Total:</span><span>${formatCurrency(totalAmount)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1.5mm;"><span>Amount Received:</span><span>${formatCurrency(paidAmount)}</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:bold;"><span>Balance Due:</span><span>${formatCurrency(balanceAmount)}</span></div>
          </div>
        </div>
        <div>
          <div style="font-size:9pt;font-weight:bold;margin-bottom:1.5mm;">Amount in Words</div>
          <div style="font-size:9pt;background-color:#f5f5f5;padding:2mm;border:1px solid #e5e5e5;border-radius:2mm;">${amountToWords(totalAmount)}</div>
        </div>
      </div>
    </div>

    <div style="border:1px solid #000;padding:3mm;margin-bottom:4mm;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:9pt;font-weight:bold;margin-bottom:1mm;">Payment Details</div>
          <div style="font-size:9pt;line-height:1.5;">
            <div>Received Amount: ${formatCurrency(paidAmount)}</div>
            <div>Payment Method: PhonePe / Google Pay / PayTM / UPI</div>
            ${b?.upiId ? `<div>UPI ID: ${b.upiId}</div>` : ''}
          </div>
        </div>
        ${upiLink ? `<div style="display:flex;flex-direction:column;align-items:center;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}" alt="QR" style="width:24mm;height:24mm;" />
          <span style="font-size:8pt;margin-top:1mm;">Scan to Pay</span>
        </div>` : ''}
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-bottom:4mm;">
      <div style="text-align:right;">
        <div style="font-size:9pt;font-weight:bold;">Authorized Signatory</div>
        <div style="font-size:9pt;">${safeText(b?.name)}</div>
        ${b?.signature ? `<div style="width:24mm;height:12mm;margin-top:1mm;margin-left:auto;"><img src="${b.signature}" alt="signature" style="width:100%;height:100%;object-fit:contain;" /></div>` : `<div style="width:24mm;height:12mm;border-bottom:1px solid #000;margin-top:2mm;margin-left:auto;"></div>`}
      </div>
    </div>

    <div style="text-align:center;font-size:8pt;color:#666;margin-top:6mm;padding-top:2mm;border-top:1px solid #e5e5e5;">
      <p>Thank you for your business!</p>
      <p>Generated on ${formatDate(new Date().toISOString())} | This is a computer-generated invoice and does not require a physical signature.</p>
    </div>
  </div>
</body>
</html>`

  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    })
    return { pdfBuffer, invoice }
  } finally {
    await browser.close()
  }
}
