import prisma from '../config/db.js';
import { buildSearchFilter, dateRangeFilter } from '../utils/helpers.js';

export async function createProduct(data, businessId) {
  try {
    const product = await prisma.product.create({
      data: { ...data, businessId },
      include: { category: true, brand: true }
    });
    return product;
  } catch (err) {
    throw err;
  }
}

export async function listProducts(businessId, { page = 1, limit = 10, search, categoryId, brandId, minPrice, maxPrice, stockStatus, startDate, endDate }) {
  try {
    const where = { businessId, ...buildSearchFilter(['name', 'sku', 'barcode'], search) };
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (minPrice || maxPrice) where.sellingPrice = { gte: minPrice || 0, lte: maxPrice || Infinity };
    if (stockStatus === 'low') where.stock = { lte: 10 };
    if (stockStatus === 'out') where.stock = 0;
    Object.assign(where, dateRangeFilter('createdAt', startDate, endDate));

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, brand: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (err) {
    throw err;
  }
}

export async function getProduct(id, businessId) {
  try {
    return await prisma.product.findFirst({
      where: { id, businessId },
      include: { category: true, brand: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateProduct(id, businessId, data) {
  try {
    return await prisma.product.update({
      where: { id, businessId },
      data,
      include: { category: true, brand: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteProduct(id, businessId) {
  try {
    return await prisma.product.delete({
      where: { id, businessId }
    });
  } catch (err) {
    throw err;
  }
}

export async function bulkImport(businessId, products) {
  try {
    return await prisma.product.createMany({
      data: products.map(p => ({ ...p, businessId })),
      skipDuplicates: true
    });
  } catch (err) {
    throw err;
  }
}

export async function bulkExport(businessId) {
  try {
    return await prisma.product.findMany({
      where: { businessId },
      include: { category: true, brand: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function getLowStock(businessId) {
  try {
    return await prisma.product.findMany({
      where: { businessId, stock: { lte: 10 } },
      orderBy: { stock: 'asc' }
    });
  } catch (err) {
    throw err;
  }
}

export async function getExpiring(businessId, days = 30) {
  try {
    const limit = new Date(Date.now() + days * 86400000);
    return await prisma.product.findMany({
      where: { businessId, expiryDate: { lte: limit, gte: new Date() } },
      orderBy: { expiryDate: 'asc' }
    });
  } catch (err) {
    throw err;
  }
}

export async function searchByBarcode(businessId, barcode) {
  try {
    return await prisma.product.findFirst({
      where: { businessId, barcode },
      include: { category: true, brand: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function generateBarcode(id, businessId) {
  try {
    const product = await getProduct(id, businessId);
    if (!product) throw new Error('Product not found');
    const barcode = `${businessId.slice(0, 4)}-${id.slice(0, 8)}-${product.sku}`;
    await prisma.product.update({
      where: { id_businessId: { id, businessId } },
      data: { barcode }
    });
    return barcode;
  } catch (err) {
    throw err;
  }
}

export async function generateQRCode(id, businessId) {
  try {
    const product = await getProduct(id, businessId);
    if (!product) throw new Error('Product not found');
    const qrData = JSON.stringify({ id, sku: product.sku, name: product.name });
    return qrData;
  } catch (err) {
    throw err;
  }
}
