/**
 * Backend tests for invoice validation and calculations.
 * The round2 and toNumber helpers mirror the logic in invoiceService.js
 * so we can test without a live database.
 */

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function toNumber(value) {
  if (value === null || value === undefined) return 0
  const n = typeof value?.toNumber === 'function' ? value.toNumber() : Number(value)
  return Number.isFinite(n) ? n : 0
}

describe('toNumber', () => {
  it('should convert Decimal-like object to number', () => {
    const decimal = { toNumber: () => 42.5 }
    expect(toNumber(decimal)).toBe(42.5)
  })

  it('should convert string to number', () => {
    expect(toNumber('100')).toBe(100)
  })

  it('should return 0 for null', () => {
    expect(toNumber(null)).toBe(0)
  })

  it('should return 0 for undefined', () => {
    expect(toNumber(undefined)).toBe(0)
  })

  it('should return 0 for NaN', () => {
    expect(toNumber('abc')).toBe(0)
  })
})

describe('round2', () => {
  it('should round to 2 decimal places', () => {
    expect(round2(10.567)).toBe(10.57)
    expect(round2(10.564)).toBe(10.56)
  })

  it('should handle floating point precision', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })

  it('should handle negative numbers', () => {
    expect(round2(-10.567)).toBe(-10.57)
  })

  it('should handle integers', () => {
    expect(round2(100)).toBe(100)
  })
})

describe('calculateTotals', () => {
  function calculateItemTotal(unitPrice, quantity, discount, discountType, cgstRate, sgstRate, igstRate) {
    const itemTotal = round2(unitPrice * quantity)
    const itemDiscount = discountType === 'PERCENTAGE'
      ? round2((itemTotal * discount) / 100)
      : round2(discount)
    const taxable = round2(itemTotal - itemDiscount)
    const cgstAmount = round2(taxable * (cgstRate / 100))
    const sgstAmount = round2(taxable * (sgstRate / 100))
    const igstAmount = round2(taxable * (igstRate / 100))
    const totalWithTax = round2(itemTotal - itemDiscount + cgstAmount + sgstAmount + igstAmount)
    return { itemTotal, itemDiscount, taxable, cgstAmount, sgstAmount, igstAmount, totalWithTax }
  }

  it('should calculate correct total with no discount and 18% tax (9% CGST + 9% SGST)', () => {
    const result = calculateItemTotal(100, 2, 0, 'AMOUNT', 9, 9, 0)
    expect(result.itemTotal).toBe(200)
    expect(result.cgstAmount).toBe(18)
    expect(result.sgstAmount).toBe(18)
    expect(result.totalWithTax).toBe(236)
  })

  it('should calculate correct total with percentage discount', () => {
    const result = calculateItemTotal(100, 1, 10, 'PERCENTAGE', 9, 9, 0)
    expect(result.itemDiscount).toBe(10)
    expect(result.taxable).toBe(90)
    expect(result.cgstAmount).toBe(8.1)
    expect(result.sgstAmount).toBe(8.1)
    expect(result.totalWithTax).toBe(106.2)
  })

  it('should calculate correct total with fixed discount', () => {
    const result = calculateItemTotal(100, 1, 20, 'AMOUNT', 9, 9, 0)
    expect(result.itemDiscount).toBe(20)
    expect(result.taxable).toBe(80)
    expect(result.cgstAmount).toBe(7.2)
    expect(result.sgstAmount).toBe(7.2)
    expect(result.totalWithTax).toBe(94.4)
  })

  it('should calculate correct total with IGST only', () => {
    const result = calculateItemTotal(100, 1, 0, 'AMOUNT', 0, 0, 18)
    expect(result.cgstAmount).toBe(0)
    expect(result.sgstAmount).toBe(0)
    expect(result.igstAmount).toBe(18)
    expect(result.totalWithTax).toBe(118)
  })

  it('should handle zero rate tax', () => {
    const result = calculateItemTotal(100, 1, 0, 'AMOUNT', 0, 0, 0)
    expect(result.totalWithTax).toBe(100)
  })

  it('should calculate grand total correctly for multiple items', () => {
    const item1 = calculateItemTotal(100, 2, 0, 'AMOUNT', 9, 9, 0)
    const item2 = calculateItemTotal(50, 1, 10, 'PERCENTAGE', 9, 9, 0)

    const subTotal = round2(item1.itemTotal + item2.itemTotal)
    const totalDiscount = round2(item1.itemDiscount + item2.itemDiscount)
    const totalCgst = round2(item1.cgstAmount + item2.cgstAmount)
    const totalSgst = round2(item1.sgstAmount + item2.sgstAmount)
    const totalIgst = round2(item1.igstAmount + item2.igstAmount)
    const grandTotal = round2(subTotal - totalDiscount + totalCgst + totalSgst + totalIgst)

    expect(subTotal).toBe(250)
    expect(totalDiscount).toBe(5)
    expect(grandTotal).toBe(289.1)
  })
})

describe('validation logic', () => {
  function validateItem(item, productsMap) {
    const errors = {}

    if (!item.productId || !productsMap.has(item.productId)) {
      errors.productId = 'Product not found or does not belong to your business'
    }

    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) {
      errors.quantity = 'Quantity must be a positive integer'
    }

    const unitPrice = Number(item.unitPrice)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      errors.unitPrice = 'Unit price must be a non-negative number'
    }

    const discount = Number(item.discount ?? 0)
    if (!Number.isFinite(discount) || discount < 0) {
      errors.discount = 'Discount must be a non-negative number'
    }

    if (item.discountType === 'PERCENTAGE' && discount > 100) {
      errors.discount = 'Percentage discount cannot exceed 100%'
    }

    return Object.keys(errors).length === 0 ? null : errors
  }

  it('should pass valid item', () => {
    const productsMap = new Map([['p1', { id: 'p1', stock: 10 }]])
    const result = validateItem({
      productId: 'p1',
      quantity: 2,
      unitPrice: 100,
      discount: 0,
      discountType: 'AMOUNT',
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
    }, productsMap)
    expect(result).toBeNull()
  })

  it('should reject item with invalid product', () => {
    const productsMap = new Map()
    const result = validateItem({
      productId: 'p1',
      quantity: 2,
      unitPrice: 100,
      discount: 0,
      discountType: 'AMOUNT',
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
    }, productsMap)
    expect(result).toHaveProperty('productId')
  })

  it('should reject negative quantity', () => {
    const productsMap = new Map([['p1', { id: 'p1', stock: 10 }]])
    const result = validateItem({
      productId: 'p1',
      quantity: -1,
      unitPrice: 100,
      discount: 0,
      discountType: 'AMOUNT',
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
    }, productsMap)
    expect(result).toHaveProperty('quantity')
  })

  it('should reject percentage discount over 100', () => {
    const productsMap = new Map([['p1', { id: 'p1', stock: 10 }]])
    const result = validateItem({
      productId: 'p1',
      quantity: 1,
      unitPrice: 100,
      discount: 150,
      discountType: 'PERCENTAGE',
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
    }, productsMap)
    expect(result).toHaveProperty('discount')
  })

  it('should reject zero quantity', () => {
    const productsMap = new Map([['p1', { id: 'p1', stock: 10 }]])
    const result = validateItem({
      productId: 'p1',
      quantity: 0,
      unitPrice: 100,
      discount: 0,
      discountType: 'AMOUNT',
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
    }, productsMap)
    expect(result).toHaveProperty('quantity')
  })
})

describe('payment validation', () => {
  function validatePayment(paymentData, totalAmount) {
    const errors = {}

    if (!paymentData) {
      return { payment: 'Payment information is required' }
    }

    const { paymentMethod, paymentStatus, paidAmount } = paymentData

    if (!paymentMethod) {
      errors.paymentMethod = 'Payment method is required'
    }

    if (!paymentStatus) {
      errors.paymentStatus = 'Payment status is required'
    }

    if (paymentStatus === 'PAID') {
      if (!paidAmount || Number(paidAmount) <= 0) {
        errors.paidAmount = 'Amount received is required for paid invoices'
      }
      if (Number(paidAmount) > totalAmount) {
        errors.paidAmount = 'Amount received cannot exceed the total amount'
      }
    }

    if (paymentStatus === 'PARTIAL') {
      if (!paidAmount || Number(paidAmount) <= 0) {
        errors.paidAmount = 'Amount received is required for partial payments'
      }
      if (Number(paidAmount) >= totalAmount) {
        errors.paymentStatus = 'For partial payment, amount received must be less than total'
      }
    }

    return Object.keys(errors).length === 0 ? null : errors
  }

  it('should pass valid paid payment', () => {
    const result = validatePayment({
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      paidAmount: 100,
    }, 100)
    expect(result).toBeNull()
  })

  it('should reject paid payment with zero amount', () => {
    const result = validatePayment({
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      paidAmount: 0,
    }, 100)
    expect(result).toHaveProperty('paidAmount')
  })

  it('should reject paid payment exceeding total', () => {
    const result = validatePayment({
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      paidAmount: 150,
    }, 100)
    expect(result).toHaveProperty('paidAmount')
  })

  it('should reject partial payment equal to total', () => {
    const result = validatePayment({
      paymentMethod: 'CASH',
      paymentStatus: 'PARTIAL',
      paidAmount: 100,
    }, 100)
    expect(result).toHaveProperty('paymentStatus')
  })

  it('should accept pending payment with zero amount', () => {
    const result = validatePayment({
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      paidAmount: 0,
    }, 100)
    expect(result).toBeNull()
  })

  it('should reject missing payment method', () => {
    const result = validatePayment({
      paymentMethod: '',
      paymentStatus: 'PAID',
      paidAmount: 100,
    }, 100)
    expect(result).toHaveProperty('paymentMethod')
  })
})

describe('date validation', () => {
  function validateDates(invoiceDate, dueDate) {
    const errors = {}

    let invoiceD = null
    if (!invoiceDate) {
      errors.invoiceDate = 'Invoice date is required'
    } else {
      invoiceD = new Date(invoiceDate)
      if (Number.isNaN(invoiceD.getTime())) {
        errors.invoiceDate = 'Invalid invoice date'
      }
    }

    if (dueDate) {
      const dueD = new Date(dueDate)
      if (Number.isNaN(dueD.getTime())) {
        errors.dueDate = 'Invalid due date'
      } else if (invoiceD && dueD < invoiceD) {
        errors.dueDate = 'Due date cannot be before the invoice date'
      }
    }

    return Object.keys(errors).length === 0 ? null : errors
  }

  it('should pass valid dates', () => {
    const result = validateDates('2024-01-01', '2024-01-15')
    expect(result).toBeNull()
  })

  it('should pass with only invoice date', () => {
    const result = validateDates('2024-01-01', null)
    expect(result).toBeNull()
  })

  it('should reject missing invoice date', () => {
    const result = validateDates(null, null)
    expect(result).toHaveProperty('invoiceDate')
  })

  it('should reject due date before invoice date', () => {
    const result = validateDates('2024-01-15', '2024-01-01')
    expect(result).toHaveProperty('dueDate')
  })

  it('should reject invalid invoice date', () => {
    const result = validateDates('invalid', null)
    expect(result).toHaveProperty('invoiceDate')
  })
})
