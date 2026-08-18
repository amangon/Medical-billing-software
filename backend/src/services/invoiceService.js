import prisma from '../config/db.js';
import { generateNumber } from '../utils/generateNumber.js';
import { buildSearchFilter, dateRangeFilter } from '../utils/helpers.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { generateUPIQR } from '../utils/qrGenerator.js';
import { ApiError } from '../middleware/errorHandler.js';

const WALK_IN_CUSTOMER_NAME = 'Walk-in Customer';

/**
 * Find or create a walk-in customer for the given business.
 */
async function getOrCreateWalkInCustomer(businessId) {
  let walkIn = await prisma.customer.findFirst({
    where: { businessId, name: WALK_IN_CUSTOMER_NAME },
  });
  if (!walkIn) {
    walkIn = await prisma.customer.create({
      data: {
        businessId,
        name: WALK_IN_CUSTOMER_NAME,
        phone: '',
        email: '',
        address: '',
      },
    });
  }
  return walkIn;
}

/**
 * Convert a Decimal or numeric value to a plain JS number safely.
 * Returns 0 for null/undefined/NaN.
 */
function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'object' && '_toNumber' in value ? value.toNumber() : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Round to 2 decimal places (currency precision).
 */
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Validate a single invoice item against existing products.
 */
function validateItem(item, productsMap, fieldErrors) {
  const itemErrors = {};

  if (!item.productId || !productsMap.has(item.productId)) {
    itemErrors.productId = ['Product not found or does not belong to your business'];
  }

  const quantity = Number(item.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    itemErrors.quantity = ['Quantity must be a positive integer'];
  }

  const unitPrice = Number(item.unitPrice);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    itemErrors.unitPrice = ['Unit price must be a non-negative number'];
  }

  const discount = Number(item.discount ?? 0);
  if (!Number.isFinite(discount) || discount < 0) {
    itemErrors.discount = ['Discount must be a non-negative number'];
  }

  if (item.discountType !== 'AMOUNT' && item.discountType !== 'PERCENTAGE') {
    itemErrors.discountType = ['Invalid discount type'];
  }

  if (item.discountType === 'PERCENTAGE' && discount > 100) {
    itemErrors.discount = ['Percentage discount cannot exceed 100%'];
  }

  // Validate tax rates
  const cgstRate = Number(item.cgstRate ?? 0);
  const sgstRate = Number(item.sgstRate ?? 0);
  const igstRate = Number(item.igstRate ?? 0);

  if (!Number.isFinite(cgstRate) || cgstRate < 0) {
    itemErrors.cgstRate = ['CGST rate must be a non-negative number'];
  }
  if (!Number.isFinite(sgstRate) || sgstRate < 0) {
    itemErrors.sgstRate = ['SGST rate must be a non-negative number'];
  }
  if (!Number.isFinite(igstRate) || igstRate < 0) {
    itemErrors.igstRate = ['IGST rate must be a non-negative number'];
  }

  if (Object.keys(itemErrors).length > 0) {
    fieldErrors.items = fieldErrors.items || [];
    // Replace placeholder at this index
    fieldErrors.items[item.index] = itemErrors;
  }

  return Object.keys(itemErrors).length === 0;
}

/**
 * Validate payment data against the payment status.
 */
function validatePayment(paymentData, totalAmount, fieldErrors) {
  if (!paymentData) {
    fieldErrors.payment = fieldErrors.payment || [];
    fieldErrors.payment.push('Payment information is required');
    return;
  }

  const { paymentMethod, paymentStatus, paidAmount } = paymentData;

  if (!paymentMethod) {
    fieldErrors.paymentMethod = ['Payment method is required'];
  }

  if (!paymentStatus) {
    fieldErrors.paymentStatus = ['Payment status is required'];
  }

  if (paymentStatus === 'PAID') {
    if (!paidAmount || Number(paidAmount) <= 0) {
      fieldErrors.paidAmount = ['Amount received is required for paid invoices'];
    }
    if (Number(paidAmount) > totalAmount) {
      fieldErrors.paidAmount = ['Amount received cannot exceed the total amount'];
    }
  }

  if (paymentStatus === 'PARTIAL') {
    if (!paidAmount || Number(paidAmount) <= 0) {
      fieldErrors.paidAmount = ['Amount received is required for partial payments'];
    }
    if (Number(paidAmount) >= totalAmount) {
      fieldErrors.paymentStatus = ['For partial payment, amount received must be less than total'];
    }
  }
}

export async function createInvoice(data, businessId) {
  return await prisma.$transaction(async (tx) => {
    const fieldErrors = {};

    // --- Validate customer / walk-in mode ---
    const isWalkIn = data.customerId === 'walk-in' || data.isWalkIn === true;
    let customerId;

    if (isWalkIn) {
      const walkIn = await getOrCreateWalkInCustomer(businessId);
      customerId = walkIn.id;
    } else {
      if (!data.customerId) {
        fieldErrors.customerId = ['Customer is required. Select a customer or enable walk-in mode.'];
      } else {
        const customer = await tx.customer.findFirst({
          where: { id: data.customerId, businessId },
        });
        if (!customer) {
          fieldErrors.customerId = ['Selected customer does not belong to your business.'];
        } else {
          customerId = customer.id;
        }
      }
    }

    // --- Validate invoice date ---
    let invoiceDate;
    if (!data.invoiceDate) {
      fieldErrors.invoiceDate = ['Invoice date is required'];
    } else {
      invoiceDate = new Date(data.invoiceDate);
      if (Number.isNaN(invoiceDate.getTime())) {
        fieldErrors.invoiceDate = ['Invalid invoice date'];
      }
    }

    // --- Validate due date ---
    let dueDate = null;
    if (data.dueDate) {
      dueDate = new Date(data.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        fieldErrors.dueDate = ['Invalid due date'];
      } else if (invoiceDate && dueDate < invoiceDate) {
        fieldErrors.dueDate = ['Due date cannot be before the invoice date'];
      }
    }

    // --- Validate items ---
    let productsMap = new Map();

    if (!Array.isArray(data.items) || data.items.length === 0) {
      fieldErrors.items = ['At least one item is required'];
    } else {
      // Fetch all products for this business in one query
      const productIds = data.items.map((item) => item.productId).filter(Boolean);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, businessId },
        select: { id: true, stock: true, sellingPrice: true, cgstRate: true, sgstRate: true, igstRate: true, gstRate: true },
      });
      productsMap = new Map(products.map((p) => [p.id, p]));

      data.items.forEach((item, index) => {
        const itemWithIndex = { ...item, index };
        validateItem(itemWithIndex, productsMap, fieldErrors);
      });

      // Stock validation
      data.items.forEach((item, index) => {
        const product = productsMap.get(item.productId);
        if (product) {
          const quantity = Number(item.quantity);
          if (product.stock < quantity + (Number(item.freeQuantity) || 0)) {
            fieldErrors.items = fieldErrors.items || [];
            const existing = fieldErrors.items[index];
            if (!existing) {
              fieldErrors.items[index] = {};
            }
            fieldErrors.items[index].quantity = [
              ...(fieldErrors.items[index].quantity || []),
              `Insufficient stock: only ${product.stock} in stock`,
            ];
          }
        }
      });
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new ApiError('Validation failed', 400, fieldErrors);
    }

    // --- Recalculate totals server-side (decimal-safe) ---
    let subTotal = 0;
    let totalDiscountAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    const itemsToCreate = [];

    for (const item of data.items) {
      const product = productsMap.get(item.productId);
      const unitPrice = Number(item.unitPrice);
      const quantity = Math.trunc(Number(item.quantity));

      // Use product tax rates if item doesn't specify them
      let cgstRate = Number(item.cgstRate ?? 0);
      let sgstRate = Number(item.sgstRate ?? 0);
      let igstRate = Number(item.igstRate ?? 0);

      // If no explicit rates given, derive from product
      if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && product) {
        if (product.cgstRate) cgstRate = toNumber(product.cgstRate);
        if (product.sgstRate) sgstRate = toNumber(product.sgstRate);
        if (product.igstRate) igstRate = toNumber(product.igstRate);
        if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && product.gstRate) {
          const gst = toNumber(product.gstRate);
          cgstRate = round2(gst / 2);
          sgstRate = round2(gst / 2);
        }
      }

      const discount = Number(item.discount ?? 0);
      const itemTotal = round2(unitPrice * quantity);
      const itemDiscount =
        item.discountType === 'PERCENTAGE'
          ? round2((itemTotal * discount) / 100)
          : round2(discount);
      const taxable = round2(itemTotal - itemDiscount);

      const cgstAmount = round2(taxable * (cgstRate / 100));
      const sgstAmount = round2(taxable * (sgstRate / 100));
      const igstAmount = round2(taxable * (igstRate / 100));
      const itemTotalWithTax = round2(itemTotal - itemDiscount + cgstAmount + sgstAmount + igstAmount);

      subTotal = round2(subTotal + itemTotal);
      totalDiscountAmount = round2(totalDiscountAmount + itemDiscount);
      totalCgst = round2(totalCgst + cgstAmount);
      totalSgst = round2(totalSgst + sgstAmount);
      totalIgst = round2(totalIgst + igstAmount);

      itemsToCreate.push({
        productId: item.productId,
        quantity,
        unitPrice: round2(unitPrice),
        discount: round2(discount),
        discountType: item.discountType,
        cgstRate,
        sgstRate,
        igstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount: itemTotalWithTax,
      });
    }

    const totalAmount = round2(subTotal - totalDiscountAmount + totalCgst + totalSgst + totalIgst);

    // Invoice-level discount
    const invoiceDiscount = Number(data.discountAmount ?? 0);
    const invoiceTotalAfterDiscount = round2(totalAmount - invoiceDiscount);

    // --- Validate and process payment ---
    let paidAmount = 0;
    let paymentMethod = null;
    let paymentStatus = 'PENDING';

    const paymentData = data.payment;
    if (paymentData) {
      validatePayment(paymentData, invoiceTotalAfterDiscount, fieldErrors);

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError('Validation failed', 400, fieldErrors);
      }

      paidAmount = round2(Number(paymentData.paidAmount ?? 0));
      paymentMethod = paymentData.paymentMethod;
      paymentStatus = paymentData.paymentStatus;
    }

    const finalBalance = round2(invoiceTotalAfterDiscount - paidAmount);

    // Apply invoice-level discount
    const finalTotal = invoiceTotalAfterDiscount;

    // --- Create invoice ---
    // Set default due date to 7 days after invoice date if not provided
    if (!dueDate && invoiceDate) {
      dueDate = new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const invoiceNumber = await generateNumber('invoice', businessId, 'INV');

    const invoice = await tx.invoice.create({
      data: {
        businessId,
        invoiceNumber,
        customerId,
        invoiceDate,
        dueDate,
        invoiceType: data.invoiceType,
        notes: data.notes,
        termsConditions: data.termsConditions,
        purchaseOrderNumber: data.purchaseOrderNumber,
        salespersonId: data.salespersonId,
        subTotal,
        discountAmount: round2(totalDiscountAmount + invoiceDiscount),
        discountType: data.items.length > 0 ? data.items[0].discountType : 'AMOUNT',
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        totalAmount: round2(finalTotal),
        paidAmount,
        balanceAmount: paymentStatus === 'PAID' ? 0 : finalBalance,
        paymentMethod,
        paymentStatus,
        isWalkIn,
        items: { create: itemsToCreate },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    // --- Update product stock and create stock movements ---
    for (const item of data.items) {
      const quantity = Math.trunc(Number(item.quantity));
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: quantity } },
      });

      await tx.stockMovement.create({
        data: {
          type: 'OUT',
          quantity,
          productId: item.productId,
          businessId,
          note: `Invoice ${invoice.invoiceNumber}`,
        },
      });
    }

    // --- Update customer balance ---
    await tx.customer.update({
      where: { id: customerId },
      data: {
        currentBalance: { increment: finalBalance },
        totalPurchases: { increment: finalTotal },
        totalPaid: { increment: paidAmount },
      },
    });

    // --- Create payment record if payment was made ---
    if (paidAmount > 0 && paymentMethod) {
      await tx.payment.create({
        data: {
          amount: paidAmount,
          paymentMethod,
          paymentDate: new Date(),
          businessId,
          customerId,
          invoiceId: invoice.id,
        },
      });
    }

    return invoice;
  });
}

export async function listInvoices(businessId, { page = 1, limit = 10, status, customerId, startDate, endDate, search }) {
  try {
    const where = { businessId, ...buildSearchFilter(['invoiceNumber', 'notes'], search) };
    if (status) where.paymentStatus = status;
    if (customerId) where.customerId = customerId;
    Object.assign(where, dateRangeFilter('invoiceDate', startDate, endDate));

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { customer: true, items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);
    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (err) {
    throw err;
  }
}

export async function getInvoice(id, businessId) {
  try {
    return await prisma.invoice.findFirst({
      where: { id, businessId },
      include: {
        items: { include: { product: true } },
        customer: true,
        business: true,
        payments: true,
      },
    });
  } catch (err) {
    throw err;
  }
}

export async function updateInvoice(id, businessId, data) {
  try {
    if (data.invoiceDate && typeof data.invoiceDate === 'string') {
      data.invoiceDate = new Date(data.invoiceDate);
    }
    if (data.dueDate && typeof data.dueDate === 'string') {
      data.dueDate = new Date(data.dueDate);
    }
    if (data.items) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      let subTotal = 0;
      let totalDiscountAmount = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      const itemsToCreate = [];
      for (const item of data.items) {
        const unitPrice = parseFloat(item.unitPrice);
        const quantity = parseInt(item.quantity);
        const discount = parseFloat(item.discount);
        const discountType = item.discountType;
        const cgstRate = parseFloat(item.cgstRate);
        const sgstRate = parseFloat(item.sgstRate);
        const igstRate = parseFloat(item.igstRate);
        const itemTotal = unitPrice * quantity;
        const itemDiscount =
          discountType === 'PERCENTAGE'
            ? (itemTotal * discount) / 100
            : discount;
        const taxable = itemTotal - itemDiscount;
        const cgstAmount = taxable * (cgstRate / 100);
        const sgstAmount = taxable * (sgstRate / 100);
        const igstAmount = taxable * (igstRate / 100);
        const itemTotalWithTax = itemTotal - itemDiscount + cgstAmount + sgstAmount + igstAmount;
        subTotal += itemTotal;
        totalDiscountAmount += itemDiscount;
        totalCgst += cgstAmount;
        totalSgst += sgstAmount;
        totalIgst += igstAmount;
        itemsToCreate.push({
          productId: item.productId,
          quantity,
          unitPrice,
          discount,
          discountType,
          cgstRate,
          sgstRate,
          igstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalAmount: itemTotalWithTax,
        });
      }
      const totalAmount = subTotal - totalDiscountAmount + totalCgst + totalSgst + totalIgst;
      data.subTotal = subTotal;
      data.discountAmount = totalDiscountAmount;
      data.discountType = data.items.length > 0 ? data.items[0].discountType : 'AMOUNT';
      data.cgstAmount = totalCgst;
      data.sgstAmount = totalSgst;
      data.igstAmount = totalIgst;
      data.totalAmount = totalAmount;
      data.balanceAmount = totalAmount;
      data.items = data.items.map((i) => ({ ...i, invoiceId: id }));
    }
    return await prisma.invoice.update({
      where: { id, businessId },
      data,
      include: { items: true, customer: true },
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteInvoice(id, businessId) {
  try {
    return await prisma.invoice.delete({
      where: { id, businessId },
    });
  } catch (err) {
    throw err;
  }
}

export async function updateStatus(id, businessId, status) {
  try {
    return await prisma.invoice.update({
      where: { id, businessId },
      data: { paymentStatus: status },
    });
  } catch (err) {
    throw err;
  }
}

export async function generatePDF(id, businessId, type = 'a4') {
  try {
    const invoice = await getInvoice(id, businessId);
    if (!invoice) throw new Error('Invoice not found');
    return generateInvoicePDF(invoice, invoice.business, type);
  } catch (err) {
    throw err;
  }
}

export async function getPrintData(id, businessId) {
  try {
    return await getInvoice(id, businessId);
  } catch (err) {
    throw err;
  }
}

export async function shareViaEmail(id, businessId, email, pdfBase64) {
  try {
    const invoice = await getInvoice(id, businessId);
    if (!invoice) throw new Error('Invoice not found');
    
    let pdfBuffer
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, 'base64')
    } else {
      const result = await generateInvoicePDF(invoice, invoice.business, 'a4');
      pdfBuffer = result.pdfBuffer
    }
    
    const { sendInvoiceEmail } = await import('../utils/email.js');
    await sendInvoiceEmail(email, invoice.customer.name, pdfBuffer, invoice.invoiceNumber);
    return { message: 'Invoice shared via email' };
  } catch (err) {
    throw err;
  }
}

export async function shareViaWhatsApp(id, businessId) {
  try {
    const invoice = await getInvoice(id, businessId);
    if (!invoice) throw new Error('Invoice not found');

    if (!invoice.business.upiId) {
      throw new Error('UPI ID not configured for this business');
    }

    const upiLink = `upi://pay?pa=${invoice.business.upiId}&pn=${encodeURIComponent(
      invoice.business.name || ''
    )}&am=${invoice.totalAmount}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`;

    return {
      message: 'UPI payment link generated for WhatsApp sharing',
      upiLink,
    };
  } catch (err) {
    throw err;
  }
}

export async function shareInvoice(id, businessId, method, data) {
  try {
    if (method === 'email') {
      return await shareViaEmail(id, businessId, data.email, data.pdfBase64);
    } else if (method === 'whatsapp') {
      return await shareViaWhatsApp(id, businessId);
    } else {
      throw new Error('Unsupported sharing method');
    }
  } catch (err) {
    throw err;
  }
}
