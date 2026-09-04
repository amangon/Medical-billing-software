import {
  createInvoice as createInvoiceService,
  listInvoices as getInvoicesService,
  getInvoice as getInvoiceService,
  generatePDF as generateInvoicePDF,
  updateInvoice as updateInvoiceService,
  updateStatus,
  shareInvoice as shareInvoiceService,
} from '../services/invoiceService.js';
import { ApiError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

export const createInvoice = async (req, res, next) => {
  try {
    const invoice = await createInvoiceService(req.body, req.user.businessId);
    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
        fieldErrors: error.fieldErrors,
      });
    }
    next(error);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { search, invoiceType, paymentStatus, startDate, endDate } = req.query;
    const result = await getInvoicesService(req.user.businessId, {
      page,
      limit,
      search,
      invoiceType,
      paymentStatus,
      startDate,
      endDate,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await getInvoiceService(req.params.id, req.user.businessId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await updateInvoiceService(req.params.id, req.user.businessId, req.body);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
        fieldErrors: error.fieldErrors,
      });
    }
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId },
      include: { items: { include: { product: true } }, customer: true },
    });
    if (!existing) return res.status(404).json({ message: 'Invoice not found' });

    await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            type: 'IN',
            quantity: item.quantity,
            productId: item.productId,
            businessId: req.user.businessId,
            note: `Reversed from invoice ${existing.invoiceNumber}`,
          },
        });
      }

      const balanceDecrement = existing.balanceAmount || existing.totalAmount;
      await tx.customer.update({
        where: { id: existing.customerId },
        data: { currentBalance: { decrement: balanceDecrement } },
      });
    });

    await prisma.invoice.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId: req.user.businessId },
    });
    if (!existing) return res.status(404).json({ message: 'Invoice not found' });

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { paymentStatus: status },
      include: { customer: true },
    });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { type = 'A4' } = req.query;
    const { pdfBuffer, invoice } = await generateInvoicePDF(req.params.id, req.user.businessId, type);
    res.setHeader('Content-Type', 'application/pdf');
    const filename = encodeURIComponent(invoice.invoiceNumber) + '.pdf';
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.setHeader('Content-Length', Buffer.byteLength(pdfBuffer));
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getPrintView = async (req, res, next) => {
  try {
    const { pdfBuffer } = await generateInvoicePDF(req.params.id, req.user.businessId);
    await prisma.invoice.update({
      where: { id: req.params.id },
      data: { isPrinted: true },
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const shareInvoice = async (req, res, next) => {
  try {
    const { method, email, phoneNumber, pdfBase64 } = req.body;
    const result = await shareInvoiceService(
      req.params.id,
      req.user.businessId,
      method,
      { email, phoneNumber, pdfBase64 },
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};
