import prisma from '../config/db.js';

export async function createPayment(data, businessId) {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: { ...data, businessId },
      include: { customer: true, supplier: true, invoice: true, purchase: true }
    });

    // Update invoice if payment is for an invoice
    if (payment.invoiceId) {
      const invoice = await tx.invoice.findUnique({
        where: { id: payment.invoiceId }
      });
      if (invoice) {
        const newPaidAmount = (invoice.paidAmount || 0) + payment.amount;
        const newBalanceAmount = invoice.totalAmount - newPaidAmount;
        let newPaymentStatus = 'PENDING';
        if (newBalanceAmount === 0) {
          newPaymentStatus = 'PAID';
        } else if (newBalanceAmount > 0) {
          newPaymentStatus = newPaidAmount > 0 ? 'PARTIAL' : 'PENDING';
        }
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            paymentStatus: newPaymentStatus,
          }
        });
      }
    }

    // Update purchase if payment is for a purchase
    if (payment.purchaseId) {
      const purchase = await tx.purchase.findUnique({
        where: { id: payment.purchaseId }
      });
      if (purchase) {
        const newPaidAmount = (purchase.paidAmount || 0) + payment.amount;
        const newBalanceAmount = purchase.totalAmount - newPaidAmount;
        let newPaymentStatus = 'PENDING';
        if (newBalanceAmount === 0) {
          newPaymentStatus = 'PAID';
        } else if (newBalanceAmount > 0) {
          newPaymentStatus = newPaidAmount > 0 ? 'PARTIAL' : 'PENDING';
        }
        await tx.purchase.update({
          where: { id: payment.purchaseId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            paymentStatus: newPaymentStatus,
          }
        });
      }
    }

    // Update customer balance and totalPaid if payment is for a customer
    if (payment.customerId) {
      await tx.customer.update({
        where: { id: payment.customerId },
        data: {
          currentBalance: { decrement: payment.amount },
          totalPaid: { increment: payment.amount },
        }
      });
    }

    // Update supplier balance and totalPaid if payment is for a supplier
    if (payment.supplierId) {
      await tx.supplier.update({
        where: { id: payment.supplierId },
        data: {
          currentBalance: { decrement: payment.amount },
          totalPaid: { increment: payment.amount },
        }
      });
    }

    return payment;
  });
}

export async function listPayments(businessId, { page = 1, limit = 10, type, customerId, supplierId, startDate, endDate }) {
  try {
    const where = { businessId };
    if (type) where.type = type;
    if (customerId) where.customerId = customerId;
    if (supplierId) where.supplierId = supplierId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { customer: true, supplier: true, invoice: true, purchase: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);
    return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (err) {
    throw err;
  }
}

export async function getPayment(id, businessId) {
  try {
    return await prisma.payment.findFirst({
      where: { id, businessId },
      include: { customer: true, supplier: true, invoice: true, purchase: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function createRefund(id, businessId, data) {
  try {
    const payment = await getPayment(id, businessId);
    if (!payment) throw new Error('Payment not found');

    const refund = await prisma.refund.create({
      data: {
        paymentId: id,
        businessId,
        amount: data.amount,
        reason: data.reason
      },
      include: { payment: true }
    });

    return refund;
  } catch (err) {
    throw err;
  }
}
