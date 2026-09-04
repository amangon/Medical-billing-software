import { createInventoryAdjustment as createInventoryAdjustmentService } from '../services/inventoryService.js';
import prisma from '../config/db.js';

export const createInventoryAdjustment = async (req, res, next) => {
  try {
    const { productId, quantity, type, reason, notes } = req.body;
    // Basic validation
    if (!productId || quantity === undefined || !type || !reason) {
      return res.status(400).json({ message: 'ProductId, quantity, type, and reason are required' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }
    // Map frontend types to service types
    let serviceType;
    if (type === 'ADD') {
      serviceType = 'INCREASE';
    } else if (type === 'REMOVE') {
      serviceType = 'DECREASE';
    } else if (type === 'SET') {
      serviceType = 'SET';
    } else {
      return res.status(400).json({ message: 'Type must be either ADD, REMOVE, or SET' });
    }

    // Get product before adjustment
    const productBefore = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!productBefore) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const adjustment = await createInventoryAdjustmentService(
      { productId, quantity: Number(quantity), type: serviceType, reason, notes },
      req.user.businessId
    );

    // Get product after adjustment (from the returned adjustment object)
    const productAfter = adjustment;

    const change = productAfter.stock - productBefore.stock;

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: `INVENTORY_ADJUSTMENT_${serviceType}`,
        entity: 'Product',
        entityId: productId,
        changes: { 
          stock: { 
            old: productBefore.stock,
            new: productAfter.stock,
            change: change
          }
        },
        businessId: req.user.businessId,
        userId: req.user.id
      }
    });

    res.status(201).json(adjustment);
  } catch (error) {
    next(error);
  }
};

export const getInventories = async (req, res, next) => {
  try {
    // Get all products (or only active ones) with stock and lowStock
    const products = await prisma.product.findMany({
      where: {
        businessId: req.user.businessId,
        // We can optionally filter by isActive if we have that field
        // isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStock: true,
        sellingPrice: true,
      },
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const createInventoryTransfer = async (req, res, next) => {
  try {
    // Stub for now - in the future, we would implement transfer between locations
    // For now, we just return success
    res.status(201).json({ message: 'Stock transfer endpoint is not implemented yet' });
  } catch (error) {
    next(error);
  }
};

export const getInventoryAlerts = async (req, res, next) => {
  try {
    // Stub for now - return empty alerts
    res.json([]);
  } catch (error) {
    next(error);
  }
};