import prisma from '../config/db.js';
import { formatCurrency, formatDate, dateRangeFilter } from '../utils/helpers.js';

export async function getSalesReport(businessId, { startDate, endDate, groupBy = 'day' }) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { businessId, status: 'PAID', ...dateRangeFilter('invoiceDate', startDate, endDate) },
      include: { items: true }
    });

    const total = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const tax = invoices.reduce((sum, i) => sum + Number(i.cgstAmount) + Number(i.sgstAmount) + Number(i.igstAmount), 0);
    const invoiceCount = invoices.length;

    return { total, tax, invoiceCount, invoices };
  } catch (err) {
    throw err;
  }
}

export async function getPurchaseReport(businessId, { startDate, endDate }) {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { businessId, status: 'RECEIVED', ...dateRangeFilter('purchaseDate', startDate, endDate) },
      include: { items: true, supplier: true }
    });

    const total = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const tax = purchases.reduce((sum, p) => sum + Number(p.cgstAmount) + Number(p.sgstAmount) + Number(p.igstAmount), 0);

    return { total, tax, purchases };
  } catch (err) {
    throw err;
  }
}

export async function getInventoryReport(businessId) {
  try {
    const products = await prisma.product.findMany({
      where: { businessId },
      include: { category: true }
    });

    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (Number(p.sellingPrice) * p.stock), 0);
    const lowStock = products.filter(p => p.stock <= p.lowStock).length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    return { totalProducts, totalValue, lowStock, outOfStock, products };
  } catch (err) {
    throw err;
  }
}

export async function getCustomerReport(businessId, { startDate, endDate }) {
  try {
    const customers = await prisma.customer.findMany({
      where: { businessId },
      include: {
        invoices: { where: dateRangeFilter('invoiceDate', startDate, endDate) },
        payments: { where: dateRangeFilter('paymentDate', startDate, endDate) }
      }
    });

    const report = customers.map(c => {
      const invoiceTotal = c.invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
      const paymentTotal = c.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      return { ...c, invoiceTotal, paymentTotal, balance: invoiceTotal - paymentTotal };
    });

    return report;
  } catch (err) {
    throw err;
  }
}

export async function getSupplierReport(businessId, { startDate, endDate }) {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { businessId },
      include: {
        purchases: { where: dateRangeFilter('purchaseDate', startDate, endDate) },
        payments: { where: dateRangeFilter('paymentDate', startDate, endDate) }
      }
    });

    const report = suppliers.map(s => {
      const purchaseTotal = s.purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
      const paymentTotal = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      return { ...s, purchaseTotal, paymentTotal, balance: purchaseTotal - paymentTotal };
    });

    return report;
  } catch (err) {
    throw err;
  }
}

export async function getGSTReport(businessId, { startDate, endDate }) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { businessId, ...dateRangeFilter('invoiceDate', startDate, endDate) },
      include: { items: { include: { product: true } } }
    });

    const outputGST = invoices.reduce((sum, i) => sum + Number(i.cgstAmount) + Number(i.sgstAmount) + Number(i.igstAmount), 0);
    const inputGST = 0;

    return { outputGST, inputGST, netGST: outputGST - inputGST, invoices };
  } catch (err) {
    throw err;
  }
}

export async function getProfitLossReport(businessId, { startDate, endDate }) {
  try {
    const sales = await getSalesReport(businessId, { startDate, endDate });
    const purchases = await getPurchaseReport(businessId, { startDate, endDate });
    const expenses = await prisma.expense.findMany({
      where: { businessId, ...dateRangeFilter('date', startDate, endDate) }
    });

    const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const profit = sales.total - purchases.total - expenseTotal;

    return { revenue: sales.total, purchases: purchases.total, expenses: expenseTotal, profit };
  } catch (err) {
    throw err;
  }
}

export async function getDashboardStats(businessId) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      salesCount,
      salesTotal,
      purchaseCount,
      purchaseTotal,
      customerCount,
      supplierCount,
      lowStockCount,
      invoiceCount,
      todaySalesTotal,
      todayPurchaseTotal,
      productValue,
      expiryProducts
    ] = await Promise.all([
      prisma.invoice.count({ where: { businessId, invoiceDate: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.invoice.aggregate({ where: { businessId, invoiceDate: { gte: startOfMonth, lte: endOfMonth } }, _sum: { totalAmount: true } }),
      prisma.purchase.count({ where: { businessId, purchaseDate: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.purchase.aggregate({ where: { businessId, purchaseDate: { gte: startOfMonth, lte: endOfMonth } }, _sum: { totalAmount: true } }),
      prisma.customer.count({ where: { businessId } }),
      prisma.supplier.count({ where: { businessId } }),
      prisma.product.count({ where: { businessId, stock: { lte: 10 } } }),
      prisma.invoice.count({ where: { businessId, paymentStatus: 'PENDING' } }),
      prisma.invoice.aggregate({ where: { businessId, invoiceDate: { gte: startOfToday } }, _sum: { totalAmount: true } }),
      prisma.purchase.aggregate({ where: { businessId, purchaseDate: { gte: startOfToday } }, _sum: { totalAmount: true } }),
      prisma.product.aggregate({ where: { businessId }, _sum: { sellingPrice: true, stock: true } }),
      prisma.product.count({ where: { businessId, stock: { lte: 0 } } })
    ]);

    const monthlySales = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const result = await prisma.invoice.aggregate({
        where: { businessId, invoiceDate: { gte: monthStart, lte: monthEnd } },
        _sum: { totalAmount: true }
      });
      monthlySales.push({
        month: monthNames[d.getMonth()],
        sales: result._sum.totalAmount || 0
      });
    }

    const topProducts = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
      where: { invoice: { businessId } }
    });

    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true }
        });
        return {
          name: product?.name || 'Unknown Product',
          revenue: item._sum.totalAmount || 0
        };
      })
    );

    const todaySales = todaySalesTotal._sum.totalAmount || 0;
    const todayPurchases = todayPurchaseTotal._sum.totalAmount || 0;
    const inventoryValue = (Number(productValue._sum.sellingPrice || 0) * Number(productValue._sum.stock || 0)) || 0;
    const todayProfit = todaySales - todayPurchases;

    return {
      todaySales,
      todayPurchases,
      todayRevenue: todaySales,
      todayProfit,
      totalOrders: salesCount,
      inventoryValue,
      lowStockCount,
      expiryCount: expiryProducts,
      monthlySales,
      topProducts: topProductsWithNames,
      totalProducts: customerCount,
      totalCustomers: supplierCount,
      monthlyRevenue: salesTotal._sum.totalAmount || 0,
      pendingInvoices: invoiceCount,
      salesCount,
      purchaseCount,
      purchaseTotal: purchaseTotal._sum.totalAmount || 0,
      customerCount,
      supplierCount
    };
  } catch (err) {
    throw err;
  }
}
