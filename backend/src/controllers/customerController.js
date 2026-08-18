import {
  createCustomer as createCustomerSvc,
  listCustomers as getCustomersSvc,
  getCustomer as getCustomerSvc,
  updateCustomer as updateCustomerSvc,
  deleteCustomer as deleteCustomerSvc
} from '../services/customerService.js';
import prisma from '../config/db.js';

export const createCustomer = async (req, res, next) => {
  try {
    const customer = await createCustomerSvc(req.body, req.user.businessId);
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const result = await getCustomersSvc(req.user.businessId, {
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

export const getCustomer = async (req, res, next) => {
  try {
    const customer = await getCustomerSvc(req.params.id, req.user.businessId);
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await updateCustomerSvc(req.params.id, req.user.businessId, req.body);
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const result = await deleteCustomerSvc(req.params.id, req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const result = await getCustomerTransactions(req.params.id, req.user.businessId, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCustomerPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId }
    });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const where = { customerId: req.params.id };
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

export const getCustomerBalance = async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId },
      select: { id: true, name: true, currentBalance: true, totalPaid: true, totalDue: true }
    });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
};
