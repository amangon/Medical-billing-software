import {
  createSupplier as createSupplierSvc,
  listSuppliers as getSuppliersSvc,
  getSupplier as getSupplierSvc,
  updateSupplier as updateSupplierSvc,
  deleteSupplier as deleteSupplierSvc
} from '../services/supplierService.js';
import prisma from '../config/db.js';

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await createSupplierSvc(req.body, req.user.businessId);
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const result = await getSuppliersSvc(req.user.businessId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSupplier = async (req, res, next) => {
  try {
    const supplier = await getSupplierSvc(req.params.id, req.user.businessId);
    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await updateSupplierSvc(req.params.id, req.user.businessId, req.body);
    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const result = await deleteSupplierSvc(req.params.id, req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSupplierPurchases = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId }
    });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    const where = { supplierId: req.params.id };
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      where.purchaseDate = { gte: start, lte: end };
    }
    const total = await prisma.purchase.count({ where });
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const purchases = await prisma.purchase.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { purchaseDate: 'desc' },
      skip,
      take: parseInt(limit)
    });
    res.json({ purchases, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

export const getSupplierPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId }
    });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    const where = { supplierId: req.params.id };
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      where.paymentDate = { gte: start, lte: end };
    }
    const total = await prisma.payment.count({ where });
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      skip,
      take: parseInt(limit)
    });
    res.json({ payments, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

export const getSupplierBalance = async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId },
      select: { id: true, name: true, currentBalance: true, totalPaid: true, totalDue: true }
    });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    next(error);
  }
};
