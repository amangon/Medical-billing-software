import {
  createPurchase as createPurchaseService,
  listPurchases as getPurchasesService,
  getPurchase as getPurchaseService,
  updateStatus as updatePurchaseStatusService
} from '../services/purchaseService.js';
import prisma from '../config/db.js';

export const createPurchase = async (req, res, next) => {
  try {
    const purchase = await createPurchaseService(req.body, req.user.businessId);
    res.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
};

export const getPurchases = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, purchaseStatus, paymentStatus, startDate, endDate } = req.query;
    const result = await getPurchasesService(req.user.businessId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      purchaseStatus,
      paymentStatus,
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPurchase = async (req, res, next) => {
  try {
    const purchase = await getPurchaseService(req.params.id, req.user.businessId);
    res.json(purchase);
  } catch (error) {
    next(error);
  }
};

export const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await prisma.purchase.update({
      where: { id: req.params.id },
      data: req.body,
      include: { supplier: true, items: { include: { product: true } } }
    });
    res.json(purchase);
  } catch (error) {
    next(error);
  }
};

export const deletePurchase = async (req, res, next) => {
  try {
    await prisma.purchase.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await updatePurchaseStatusService(req.params.id, req.user.businessId, status);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createPurchaseReturn = async (req, res, next) => {
  try {
    const purchase = await getPurchaseService(req.params.id, req.user.businessId);
    const returnRecord = await prisma.purchaseReturn.create({
      data: {
        purchaseId: purchase.id,
        businessId: req.user.businessId,
        supplierId: purchase.supplierId,
        reason: req.body.reason || '',
        items: {
          create: req.body.items || purchase.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: { items: { include: { product: true } } }
    });
    res.status(201).json(returnRecord);
  } catch (error) {
    next(error);
  }
};
