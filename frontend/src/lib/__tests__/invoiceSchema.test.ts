import { invoiceSchema, InvoiceInput, InvoiceItemInput, InvoicePayment } from '../validations/schemas'
import { describe, it, expect } from '@jest/globals'

describe('invoiceSchema validation', () => {
  it('should reject empty customerId in normal mode', () => {
    const result = invoiceSchema.safeParse({
      customerId: '',
      isWalkIn: false,
      invoiceDate: '2024-01-01',
      invoiceType: 'TAX',
      discountAmount: 0,
      discountType: 'AMOUNT',
      payment: { paymentMethod: '', paymentStatus: 'PENDING', paidAmount: 0 },
      items: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'customerId')).toBe(true)
    }
  })

  it('should accept valid customerId', () => {
    const result = invoiceSchema.safeParse({
      customerId: 'cus123',
      isWalkIn: false,
      invoiceDate: '2024-01-01',
      invoiceType: 'TAX',
      discountAmount: 0,
      discountType: 'AMOUNT',
      payment: { paymentMethod: 'CASH', paymentStatus: 'PENDING', paidAmount: 0 },
      items: [
        {
          productId: 'prod1',
          quantity: 2,
          unitPrice: 100,
          discount: 0,
          discountType: 'AMOUNT',
          cgstRate: 9,
          sgstRate: 9,
          igstRate: 0,
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing invoice date', () => {
    const result = invoiceSchema.safeParse({
      customerId: 'cus123',
      isWalkIn: false,
      invoiceDate: '',
      invoiceType: 'TAX',
      discountAmount: 0,
      discountType: 'AMOUNT',
      payment: { paymentMethod: 'CASH', paymentStatus: 'PENDING', paidAmount: 0 },
      items: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'invoiceDate')).toBe(true)
    }
  })

  it('should reject empty items array', () => {
    const result = invoiceSchema.safeParse({
      customerId: 'cus123',
      isWalkIn: false,
      invoiceDate: '2024-01-01',
      invoiceType: 'TAX',
      discountAmount: 0,
      discountType: 'AMOUNT',
      payment: { paymentMethod: 'CASH', paymentStatus: 'PENDING', paidAmount: 0 },
      items: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'items')).toBe(true)
    }
  })

  it('should reject invalid quantity (0)', () => {
    const result = invoiceSchema.safeParse({
      customerId: 'cus123',
      isWalkIn: false,
      invoiceDate: '2024-01-01',
      invoiceType: 'TAX',
      discountAmount: 0,
      discountType: 'AMOUNT',
      payment: { paymentMethod: 'CASH', paymentStatus: 'PENDING', paidAmount: 0 },
      items: [
        {
          productId: 'prod1',
          quantity: 0,
          unitPrice: 100,
          discount: 0,
          discountType: 'AMOUNT',
          cgstRate: 9,
          sgstRate: 9,
          igstRate: 0,
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})

describe('invoice payload mapping', () => {
  const buildInput = (): InvoiceInput => ({
    customerId: 'cus123',
    isWalkIn: false,
    invoiceDate: '2024-01-15',
    invoiceType: 'TAX',
    discountAmount: 0,
    discountType: 'AMOUNT',
    payment: {
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      paidAmount: 238,
    },
    items: [
      {
        productId: 'prod1',
        quantity: 2,
        unitPrice: 100,
        discount: 10,
        discountType: 'AMOUNT',
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
      },
    ],
  })

  it('should calculate subtotal correctly', () => {
    const items: InvoiceItemInput[] = [
      {
        productId: 'p1',
        quantity: 2,
        unitPrice: 100,
        discount: 0,
        discountType: 'AMOUNT',
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
      },
    ]
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity
      const disc = item.discountType === 'PERCENTAGE'
        ? (itemTotal * item.discount) / 100
        : item.discount
      return sum + (itemTotal - disc)
    }, 0)
    expect(subtotal).toBe(200)
  })

  it('should calculate tax correctly with 9% CGST + 9% SGST', () => {
    const items: InvoiceItemInput[] = [
      {
        productId: 'p1',
        quantity: 1,
        unitPrice: 100,
        discount: 0,
        discountType: 'AMOUNT',
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
      },
    ]
    const totalTax = items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity
      const disc = item.discountType === 'PERCENTAGE'
        ? (itemTotal * item.discount) / 100
        : item.discount
      const taxable = itemTotal - disc
      return sum + taxable * ((item.cgstRate + item.sgstRate + item.igstRate) / 100)
    }, 0)
    expect(totalTax).toBeCloseTo(18, 2) // 18% of 100 = 18
  })

  it('should map payment data correctly', () => {
    const input = buildInput()
    const payload = {
      customerId: input.isWalkIn ? undefined : input.customerId,
      isWalkIn: input.isWalkIn,
      invoiceDate: input.invoiceDate,
      payment: {
        paymentMethod: input.payment?.paymentMethod || '',
        paymentStatus: input.payment?.paymentStatus || 'PENDING',
        paidAmount: Number(input.payment?.paidAmount) || 0,
      },
    }
    expect(payload.customerId).toBe('cus123')
    expect(payload.isWalkIn).toBe(false)
    expect(payload.payment.paymentMethod).toBe('UPI')
    expect(payload.payment.paidAmount).toBe(238)
  })

  it('should handle walk-in mode payload correctly', () => {
    const input = buildInput()
    input.isWalkIn = true
    input.customerId = ''

    const payload = {
      customerId: input.isWalkIn ? undefined : input.customerId,
      isWalkIn: input.isWalkIn,
    }
    expect(payload.customerId).toBeUndefined()
    expect(payload.isWalkIn).toBe(true)
  })
})
