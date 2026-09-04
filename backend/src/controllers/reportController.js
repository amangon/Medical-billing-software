import {
  getSalesReport as getSalesReportService,
  getPurchaseReport as getPurchaseReportService,
  getInventoryReport as getInventoryReportService,
  getGSTReport as getGSTReportService,
  getProfitLossReport as getProfitAndLossService,
  getDashboardStats as getDashboardStatsService
} from '../services/reportService.js';
import prisma from '../config/db.js';

export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    const result = await getSalesReportService(req.user.businessId, {
      startDate,
      endDate,
      groupBy
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await getPurchaseReportService(req.user.businessId, {
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getInventoryReport = async (req, res, next) => {
  try {
    const result = await getInventoryReportService(req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCustomerReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const customers = await prisma.customer.findMany({
      where: { businessId: req.user.businessId },
      include: {
        _count: { select: { orders: true, invoices: true } },
        transactions: {
          where: { date: { gte: start, lte: end } },
          select: { amount: true }
        }
      }
    });
    const report = customers.map((customer) => {
      const totalRevenue = customer.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      return {
        id: customer.id,
        name: customer.name,
        orderCount: customer._count.orders,
        invoiceCount: customer._count.invoices,
        totalRevenue
      };
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getSupplierReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const suppliers = await prisma.supplier.findMany({
      where: { businessId: req.user.businessId },
      include: {
        _count: { select: { purchases: true } },
        transactions: {
          where: { date: { gte: start, lte: end } },
          select: { amount: true }
        }
      }
    });
    const report = suppliers.map((supplier) => {
      const totalPurchase = supplier.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      return {
        id: supplier.id,
        name: supplier.name,
        purchaseCount: supplier._count.purchases,
        totalPurchase
      };
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getGstReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await getGSTReportService(req.user.businessId, {
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getProfitLossReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await getProfitAndLossService(req.user.businessId, {
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await getDashboardStatsService(req.user.businessId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
