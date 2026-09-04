import prisma from '../config/db.js';
import { buildSearchFilter, dateRangeFilter } from '../utils/helpers.js';

export async function createSupplier(data, businessId) {
  try {
    return await prisma.supplier.create({
      data: { ...data, businessId },
      include: { transactions: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function listSuppliers(businessId, { page = 1, limit = 10, search }) {
  try {
    const where = { businessId, ...buildSearchFilter(['name', 'email', 'phone', 'gstin'], search) };
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: { _count: { select: { purchases: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supplier.count({ where })
    ]);
    return { suppliers, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (err) {
    throw err;
  }
}

export async function getSupplier(id, businessId) {
  try {
    return await prisma.supplier.findFirst({
      where: { id, businessId },
      include: {
        transactions: { orderBy: { date: 'desc' }, take: 20 },
        purchases: { include: { items: true } }
      }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateSupplier(id, businessId, data) {
  try {
    const existing = await prisma.supplier.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Supplier not found');
    return await prisma.supplier.update({
      where: { id },
      data
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteSupplier(id, businessId) {
  try {
    const existing = await prisma.supplier.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Supplier not found');
    return await prisma.supplier.delete({
      where: { id }
    });
  } catch (err) {
    throw err;
  }
}

export async function getPurchases(supplierId, businessId, { page = 1, limit = 10 }) {
  try {
    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where: { supplierId, businessId },
        include: { items: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchase.count({ where: { supplierId, businessId } })
    ]);
    return { purchases, total, page, limit };
  } catch (err) {
    throw err;
  }
}

export async function getPayments(supplierId, businessId) {
  try {
    return await prisma.payment.findMany({
      where: { supplierId, businessId },
      include: { purchase: true },
      orderBy: { date: 'desc' }
    });
  } catch (err) {
    throw err;
  }
}

export async function getBalance(supplierId, businessId) {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, businessId },
      include: { transactions: true }
    });
    const total = supplier.transactions.reduce((sum, t) => sum + t.amount, 0);
    return { balance: total };
  } catch (err) {
    throw err;
  }
}
