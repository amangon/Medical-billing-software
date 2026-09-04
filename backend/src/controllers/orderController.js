import {
  createOrder as createOrderService,
  listOrders as getOrdersService,
  getOrder as getOrderService,
  updateStatus as updateOrderStatusService
} from '../services/orderService.js';
import {
  createInvoice as createInvoiceService
} from '../services/invoiceService.js';
import prisma from '../config/db.js';

export const createOrder = async (req, res, next) => {
  try {
    const order = await createOrderService(req.body, req.user.businessId);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, orderStatus, paymentStatus, startDate, endDate } = req.query;
    const result = await getOrdersService(req.user.businessId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      orderStatus,
      paymentStatus,
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await getOrderService(req.params.id, req.user.businessId);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: req.body,
      include: { customer: true, items: { include: { product: true } } }
    });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    await prisma.order.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await updateOrderStatusService(req.params.id, req.user.businessId, status);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const convertToInvoice = async (req, res, next) => {
  try {
    const order = await getOrderService(req.params.id, req.user.businessId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Prepare invoice data from order
    const invoiceData = {
      customerId: order.customerId,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      invoiceType: 'TAX',
      notes: `Converted from order ${order.orderNumber}`,
      discountAmount: 0,
      discountType: 'AMOUNT',
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        discountType: item.discountType,
        cgstRate: item.cgstRate,
        sgstRate: item.sgstRate,
        igstRate: item.igstRate,
      })),
    };

    const invoice = await createInvoiceService(invoiceData, req.user.businessId);

    // Update the order to mark as invoiced and link to the invoice
    await prisma.order.update({
      where: { id: order.id },
      data: { orderStatus: 'INVOICED', invoiceId: invoice.id }
    });

    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
};
