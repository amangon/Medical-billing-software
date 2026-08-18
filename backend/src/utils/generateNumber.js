import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function generateOrderNumber(businessId, prismaInstance) {
  const count = await prismaInstance.order.count({ where: { businessId } })
  return `ORD-${String(count + 1).padStart(5, '0')}`
}

export async function generateInvoiceNumber(businessId, prismaInstance) {
  const business = await prismaInstance.business.findUnique({ where: { id: businessId } })
  const number = (business?.invoiceNumber || 1)
  await prismaInstance.business.update({
    where: { id: businessId },
    data: { invoiceNumber: { increment: 1 } },
  })
  return `${business?.invoicePrefix || 'INV'}-${String(number).padStart(5, '0')}`
}

export async function generatePurchaseNumber(businessId, prismaInstance) {
  const count = await prismaInstance.purchase.count({ where: { businessId } })
  return `PUR-${String(count + 1).padStart(5, '0')}`
}

export async function generateQuoteNumber(businessId, prismaInstance) {
  const business = await prismaInstance.business.findUnique({ where: { id: businessId } })
  const number = (business?.quoteNumber || 1)
  await prismaInstance.business.update({
    where: { id: businessId },
    data: { quoteNumber: { increment: 1 } },
  })
  return `${business?.quotePrefix || 'QT'}-${String(number).padStart(5, '0')}`
}

export async function generateNumber(type, businessId, prefix) {
  if (type === 'order') return generateOrderNumber(businessId, prisma)
  if (type === 'invoice') return generateInvoiceNumber(businessId, prisma)
  if (type === 'purchase') return generatePurchaseNumber(businessId, prisma)
  if (type === 'quote') return generateQuoteNumber(businessId, prisma)
  return `${prefix}-${Date.now()}`
}
