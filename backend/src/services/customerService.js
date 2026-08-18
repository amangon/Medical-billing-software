import prisma from '../config/db.js';
import { buildSearchFilter, dateRangeFilter } from '../utils/helpers.js';

export async function createCustomer(data, businessId) {
  try {
    return await prisma.customer.create({
      data: { ...data, businessId },
      include: { transactions: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function listCustomers(businessId, { page = 1, limit = 10, search }) {
  try {
    const where = { businessId, ...buildSearchFilter(['name', 'email', 'phone', 'gstin'], search) };
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { orders: true, invoices: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);
    return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (err) {
    throw err;
  }
}

export async function getCustomer(id, businessId) {
  try {
    return await prisma.customer.findFirst({
      where: { id, businessId },
      include: {
        transactions: { orderBy: { date: 'desc' }, take: 20 },
        orders: { include: { items: true } },
        invoices: { include: { items: true } }
      }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateCustomer(id, businessId, data) {
  try {
    const existing = await prisma.customer.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Customer not found');
    return await prisma.customer.update({
      where: { id },
      data
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteCustomer(id, businessId) {
  try {
    const existing = await prisma.customer.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Customer not found');
    return await prisma.customer.delete({
      where: { id }
    });
  } catch (err) {
    throw err;
  }
}

export async function getOrders(customerId, businessId, { page = 1, limit = 10 }) {
  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId, businessId },
        include: { items: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where: { customerId, businessId } })
    ]);
    return { orders, total, page, limit };
  } catch (err) {
    throw err;
  }
}

export async function getPayments(customerId, businessId) {
  try {
    return await prisma.payment.findMany({
      where: { customerId, businessId },
      include: { invoice: true },
      orderBy: { date: 'desc' }
    });
  } catch (err) {
    throw err;
  }
}

export async function getBalance(customerId, businessId) {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
      include: { transactions: true }
    });
    const total = customer.transactions.reduce((sum, t) => sum + t.amount, 0);
    return { balance: total };
  } catch (err) {
    throw err;
  }
}
