import prisma from '../config/db.js';
import { generateNumber } from '../utils/generateNumber.js';
import { buildSearchFilter, dateRangeFilter } from '../utils/helpers.js';

export async function createOrder(data, businessId) {
  try {
    const orderNumber = await generateNumber('order', businessId, 'ORD');
    const order = await prisma.order.create({
      data: {
        ...data,
        businessId,
        orderNumber: orderNumber,
        items: { create: data.items }
      },
      include: { items: { include: { product: true } }, customer: true }
    });
    return order;
  } catch (err) {
    throw err;
  }
}

export async function listOrders(businessId, { page = 1, limit = 10, status, customerId, startDate, endDate, search }) {
  try {
    const where = { businessId, ...buildSearchFilter(['number', 'notes'], search) };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    Object.assign(where, dateRangeFilter('createdAt', startDate, endDate));

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { customer: true, items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (err) {
    throw err;
  }
}

export async function getOrder(id, businessId) {
  try {
    return await prisma.order.findFirst({
      where: { id, businessId },
      include: {
        items: { include: { product: true, tax: true } },
        customer: true,
        invoice: { include: { items: true } }
      }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateOrder(id, businessId, data) {
  try {
    const existing = await prisma.order.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Order not found');
    if (data.items) {
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      data.items = data.items.map(i => ({ ...i, orderId: id }));
    }
    return await prisma.order.update({
      where: { id, businessId },
      data,
      include: { items: true, customer: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteOrder(id, businessId) {
  try {
    const existing = await prisma.order.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Order not found');
    return await prisma.order.delete({
      where: { id, businessId }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateStatus(id, businessId, status) {
  try {
    const existing = await prisma.order.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Order not found');
    return await prisma.order.update({
      where: { id, businessId },
      data: { status }
    });
  } catch (err) {
    throw err;
  }
}

import { createInvoice as createInvoiceService } from './invoiceService.js';

export async function convertToInvoice(id, businessId) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id, businessId },
      include: {
        items: { include: { product: true } },
        customer: true
      }
    });
    if (!order) throw new Error('Order not found');
    const invoiceNumber = await generateNumber('invoice', businessId, 'INV');
    const invoiceData = {
      businessId,
      customerId: order.customerId,
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      invoiceType: 'TAX',
      notes: `Converted from order ${order.number}`,
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        discountType: 'AMOUNT',
        cgstRate: item.cgstRate || 18,
        sgstRate: item.sgstRate || 0,
        igstRate: item.igstRate || 0,
      }))
    };
    const invoice = await createInvoiceService(invoiceData, businessId);
    // Update the order to mark as invoiced and link to the invoice
    await tx.order.update({
      where: { id, businessId },
      data: { status: 'INVOICED', invoiceId: invoice.id }
    });
    return invoice;
  });
}
