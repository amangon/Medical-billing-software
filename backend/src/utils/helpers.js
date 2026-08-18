import dayjs from 'dayjs'

export function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDateTime(date) {
  if (!date) return ''
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

export function formatCurrency(amount, currency = 'INR') {
  if (!amount && amount !== 0) return '0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export async function paginate(query, page = 1, limit = 10) {
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([query.skip(skip).take(limit), query.count()])
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}

export function buildSearchFilter(fields, search) {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' }
    }))
  };
}

export function dateRangeFilter(field, startDate, endDate) {
  const filter = {};
  if (startDate) filter[field] = { gte: new Date(startDate) };
  if (endDate) filter[field] = { lte: new Date(endDate) };
  return filter;
}

export function buildWhere(conditions) {
  const where = {}
  Object.entries(conditions).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      where[key] = value
    }
  })
  return where
}

export function calculateTotals(items) {
  return items.reduce(
    (acc, item) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      const discount = Number(item.discount) || 0
      const discountType = item.discountType || 'AMOUNT'
      const itemTotal = price * qty
      const discountAmount = discountType === 'PERCENTAGE' ? (itemTotal * discount) / 100 : discount
      const taxable = itemTotal - discountAmount
      acc.subTotal += taxable
      acc.cgst += (taxable * (Number(item.cgstRate) || 0)) / 100
      acc.sgst += (taxable * (Number(item.sgstRate) || 0)) / 100
      acc.igst += (taxable * (Number(item.igstRate) || 0)) / 100
      return acc
    },
    { subTotal: 0, cgst: 0, sgst: 0, igst: 0 }
  )
}

export function getDateRange(range) {
  const now = dayjs()
  switch (range) {
    case 'today':
      return { start: now.startOf('day').toDate(), end: now.endOf('day').toDate() }
    case 'week':
      return { start: now.startOf('week').toDate(), end: now.endOf('week').toDate() }
    case 'month':
      return { start: now.startOf('month').toDate(), end: now.endOf('month').toDate() }
    case 'year':
      return { start: now.startOf('year').toDate(), end: now.endOf('year').toDate() }
    default:
      return { start: now.startOf('month').toDate(), end: now.endOf('month').toDate() }
  }
}

export default {
  formatDate,
  formatDateTime,
  formatCurrency,
  paginate,
  buildWhere,
  calculateTotals,
  getDateRange,
}
