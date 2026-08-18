import prisma from '../config/db.js';
import { generateNumber } from '../utils/generateNumber.js';
import { buildSearchFilter, dateRangeFilter } from '../utils/helpers.js';

export async function createPurchase(data, businessId) {
  try {
    const purchaseNumber = await generateNumber('purchase', businessId, 'PUR');
    const purchase = await prisma.purchase.create({
      data: {
        ...data,
        businessId,
        purchaseNumber: purchaseNumber,
        items: { create: data.items }
      },
      include: { items: { include: { product: true } }, supplier: true }
    });
    return purchase;
  } catch (err) {
    throw err;
  }
}

export async function listPurchases(businessId, { page = 1, limit = 10, status, supplierId, startDate, endDate, search }) {
  try {
    const where = { businessId, ...buildSearchFilter(['purchaseNumber', 'notes'], search) };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    Object.assign(where, dateRangeFilter('createdAt', startDate, endDate));

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: { supplier: true, items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchase.count({ where })
    ]);
    return { purchases, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (err) {
    throw err;
  }
}

export async function getPurchase(id, businessId) {
  try {
    return await prisma.purchase.findFirst({
      where: { id, businessId },
      include: {
        items: { include: { product: true, tax: true } },
        supplier: true,
        returns: { include: { items: true } }
      }
    });
  } catch (err) {
    throw err;
  }
}

export async function updatePurchase(id, businessId, data) {
  try {
    const existing = await prisma.purchase.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Purchase not found');
    if (data.items) {
      await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });
      data.items = data.items.map(i => ({ ...i, purchaseId: id }));
    }
    return await prisma.purchase.update({
      where: { id },
      data,
      include: { items: true, supplier: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function deletePurchase(id, businessId) {
  try {
    const existing = await prisma.purchase.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Purchase not found');
    return await prisma.purchase.delete({
      where: { id }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateStatus(id, businessId, status) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.purchase.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Purchase not found');
    
    // Update the purchase status
    const updatedPurchase = await tx.purchase.update({
      where: { id },
      data: { status }
    });

    // If status is being updated to RECEIVED and it wasn't before, update stock and supplier balance
    if (status === 'RECEIVED' && existing.status !== 'RECEIVED') {
      // Increase product stock and create stock movements for each item
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            type: 'IN',
            quantity: item.quantity,
            productId: item.productId,
            businessId,
            note: `Purchase ${updatedPurchase.number}`,
          },
        });
      }

      // Update supplier balance and totalPaid
      await tx.supplier.update({
        where: { id: existing.supplierId },
        data: { 
          currentBalance: { increment: updatedPurchase.totalAmount },
          totalPaid: { increment: 0 } // totalPaid is updated when payments are made, not on receipt
        }
      });
    }

    return updatedPurchase;
  });
}

export async function createReturn(id, businessId, data) {
  return await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: { id, businessId },
      include: { items: true }
    });
    if (!purchase) throw new Error('Purchase not found');

    const purchaseReturn = await tx.purchaseReturn.create({
      data: {
        businessId,
        purchaseId: id,
        reason: data.reason,
        items: { create: data.items }
      },
      include: { items: true }
    });

    for (const item of data.items) {
      // Decrease product stock (since we are returning goods to supplier)
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });

      // Create stock movement record for the return
      await tx.stockMovement.create({
        data: {
          type: 'OUT', // Or we could have a specific type for returns, but we'll use OUT for now
          quantity: item.quantity,
          productId: item.productId,
          businessId,
          note: `Purchase Return ${purchaseReturn.id}`,
        },
      });
    }

    await tx.purchase.update({
      where: { id },
      data: { status: 'returned' }
    });

    return purchaseReturn;
  });
}
