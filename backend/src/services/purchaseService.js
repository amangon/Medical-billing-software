import prisma from '../config/db.js';
import { generateNumber } from '../utils/generateNumber.js';
import { buildSearchFilter, dateRangeFilter } from '../utils/helpers.js';
import { ApiError } from '../middleware/errorHandler.js';

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function createPurchase(data, businessId) {
  try {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new ApiError('At least one item is required', 400);
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: data.supplierId, businessId },
    });
    if (!supplier) {
      throw new ApiError('Invalid supplier', 400, { supplierId: ['Supplier not found'] });
    }

    const productIds = data.items.map((item) => item.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, businessId },
      select: { id: true, stock: true, purchasePrice: true, sellingPrice: true, mrp: true, cgstRate: true, sgstRate: true, igstRate: true, gstRate: true, hsnCode: true },
    });
    const productsMap = new Map(products.map((p) => [p.id, p]));

    const fieldErrors = {};
    const itemsToCreate = [];
    let subTotal = 0;
    let totalDiscountAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    data.items.forEach((item, index) => {
      const itemErrors = {};
      const product = productsMap.get(item.productId);

      if (!item.productId || !product) {
        itemErrors.productId = ['Product not found'];
      }

      const quantity = Math.trunc(Number(item.quantity) || 0);
      if (!Number.isInteger(quantity) || quantity < 1) {
        itemErrors.quantity = ['Quantity must be at least 1'];
      }

      const unitPrice = round2(Number(item.unitPrice) || 0);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        itemErrors.unitPrice = ['Unit price must be a non-negative number'];
      }

      const discount = round2(Number(item.discount ?? 0));
      if (!Number.isFinite(discount) || discount < 0) {
        itemErrors.discount = ['Discount must be a non-negative number'];
      }

      if (item.discountType !== 'AMOUNT' && item.discountType !== 'PERCENTAGE') {
        itemErrors.discountType = ['Invalid discount type'];
      }

      if (item.discountType === 'PERCENTAGE' && discount > 100) {
        itemErrors.discount = ['Percentage discount cannot exceed 100%'];
      }

      let cgstRate = round2(Number(item.cgstRate ?? 0));
      let sgstRate = round2(Number(item.sgstRate ?? 0));
      let igstRate = round2(Number(item.igstRate ?? 0));

      if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && product) {
        if (product.cgstRate) cgstRate = round2(Number(product.cgstRate));
        if (product.sgstRate) sgstRate = round2(Number(product.sgstRate));
        if (product.igstRate) igstRate = round2(Number(product.igstRate));
        if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && product.gstRate) {
          const gst = round2(Number(product.gstRate));
          cgstRate = round2(gst / 2);
          sgstRate = round2(gst / 2);
        }
      }

      const itemTotal = round2(unitPrice * quantity);
      const itemDiscount = item.discountType === 'PERCENTAGE'
        ? round2((itemTotal * discount) / 100)
        : discount;
      const taxable = round2(itemTotal - itemDiscount);
      const cgstAmount = round2(taxable * (cgstRate / 100));
      const sgstAmount = round2(taxable * (sgstRate / 100));
      const igstAmount = round2(taxable * (igstRate / 100));
      const itemTotalWithTax = round2(taxable + cgstAmount + sgstAmount + igstAmount);

      if (Object.keys(itemErrors).length > 0) {
        fieldErrors.items = fieldErrors.items || [];
        fieldErrors.items[index] = itemErrors;
      }

      subTotal = round2(subTotal + itemTotal);
      totalDiscountAmount = round2(totalDiscountAmount + itemDiscount);
      totalCgst = round2(totalCgst + cgstAmount);
      totalSgst = round2(totalSgst + sgstAmount);
      totalIgst = round2(totalIgst + igstAmount);

      itemsToCreate.push({
        productId: item.productId,
        quantity,
        unitPrice,
        discount,
        discountType: item.discountType,
        cgstRate,
        sgstRate,
        igstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount: itemTotalWithTax,
      });
    });

    if (Object.keys(fieldErrors).length > 0) {
      throw new ApiError('Validation failed', 400, fieldErrors);
    }

    const totalAmount = round2(subTotal - totalDiscountAmount + totalCgst + totalSgst + totalIgst);
    const invoiceDiscount = round2(Number(data.discountAmount ?? 0));
    const finalTotal = round2(totalAmount - invoiceDiscount);
    const paidAmount = round2(Number(data.paidAmount ?? 0));
    const balanceAmount = round2(finalTotal - paidAmount);

    const purchaseNumber = await generateNumber('purchase', businessId, 'PUR');

    const purchase = await prisma.purchase.create({
      data: {
        businessId,
        supplierId: data.supplierId,
        purchaseNumber,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        subTotal,
        discountAmount: round2(totalDiscountAmount + invoiceDiscount),
        discountType: data.items?.[0]?.discountType || 'AMOUNT',
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        totalAmount: finalTotal,
        paidAmount,
        balanceAmount,
        paymentStatus: paidAmount >= finalTotal ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING',
        purchaseStatus: data.purchaseStatus || 'PENDING',
        notes: data.notes || null,
        items: { create: itemsToCreate },
      },
      include: { items: { include: { product: true } }, supplier: true },
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
            note: `Purchase ${updatedPurchase.purchaseNumber}`,
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
        data: { stock: { decrement: item.quantity } },
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
