import prisma from '../config/db.js';

export async function createInventoryAdjustment(data, businessId) {
  return await prisma.$transaction(async (tx) => {
    const { productId, quantity, type, reason, notes } = data;
    // type: 'INCREASE', 'DECREASE', or 'SET'

    // Get the product to ensure it exists and belongs to the business
    const product = await tx.product.findFirst({
      where: { id: productId, businessId }
    });
    if (!product) {
      throw new Error('Product not found');
    }

    // Update the product stock and create stock movement record
    if (type === 'INCREASE') {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });
      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          type: 'IN', // We are increasing stock
          quantity,
          productId,
          businessId,
          note: `Inventory adjustment: ${reason}. ${notes || ''}`.trim(),
        },
      });
    } else if (type === 'DECREASE') {
      // Check if we have enough stock
      if (product.stock < quantity) {
        throw new Error('Insufficient stock for decrease');
      }
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });
      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          type: 'OUT', // We are decreasing stock
          quantity,
          productId,
          businessId,
          note: `Inventory adjustment: ${reason}. ${notes || ''}`.trim(),
        },
      });
    } else if (type === 'SET') {
      // Set the stock to the given quantity
      const change = quantity - product.stock;
      await tx.product.update({
        where: { id: productId },
        data: { stock: quantity },
      });
      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          type: change >= 0 ? 'IN' : 'OUT',
          quantity: Math.abs(change),
          productId,
          businessId,
          note: `Inventory adjustment (SET): ${reason}. ${notes || ''}`.trim(),
        },
      });
    } else {
      throw new Error('Invalid adjustment type');
    }

    // Return the updated product
    return await tx.product.findUnique({ where: { id: productId } });
  });
}