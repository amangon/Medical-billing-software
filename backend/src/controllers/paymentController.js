import {
  createPayment as createPaymentService,
  createRefund as createRefundService,
  listPayments as getPaymentsService
} from '../services/paymentService.js';
import prisma from '../config/db.js';

export const createPayment = async (req, res, next) => {
  try {
    const payment = await createPaymentService(req.body, req.user.businessId);
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, customerId, supplierId, invoiceId, startDate, endDate } = req.query;
    const result = await getPaymentsService(req.user.businessId, {
      page: parseInt(page),
      limit: parseInt(limit),
      customerId,
      supplierId,
      invoiceId,
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId },
      include: { customer: true, supplier: true, invoice: true }
    });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
};

export const createRefund = async (req, res, next) => {
  try {
    const { paymentId, amount, paymentMethod, notes } = req.body;
    const result = await createRefundService(paymentId, req.user.businessId, {
      amount,
      paymentMethod,
      notes
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
