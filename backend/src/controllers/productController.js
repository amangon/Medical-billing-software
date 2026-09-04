import {
  createProduct as createProductService,
  listProducts as getProductsService,
  getProduct as getProductService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
  bulkImport as bulkImportProductsService,
  bulkExport as exportProductsService
} from '../services/productService.js';
import prisma from '../config/db.js';
import { generateBarcode as generateBarcodeUtil } from '../utils/barcodeGenerator.js';
import { generateQRCode as generateQRCodeUtil } from '../utils/qrGenerator.js';

export const createProduct = async (req, res, next) => {
  try {
    const product = await createProductService(req.body, req.user.businessId);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, sortBy, sortOrder, categoryId, brandId } = req.query;
    const result = await getProductsService(req.user.businessId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder,
      categoryId,
      brandId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await getProductService(req.params.id, req.user.businessId);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await updateProductService(req.params.id, req.user.businessId, req.body);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const result = await deleteProductService(req.params.id, req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const bulkImportProducts = async (req, res, next) => {
  try {
    const products = req.body;
    const result = await bulkImportProductsService(req.user.businessId, products);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const exportProducts = async (req, res, next) => {
  try {
    const products = await exportProductsService(req.user.businessId);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const result = await getProductsService(req.user.businessId, { stockStatus: 'low', limit: 1000 });
    res.json(result.products);
  } catch (error) {
    next(error);
  }
};

export const getExpiringProducts = async (req, res, next) => {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const products = await prisma.product.findMany({
      where: {
        businessId: req.user.businessId,
        isActive: true,
        batches: {
          some: {
            expiryDate: { lte: expiryDate }
          }
        }
      },
      include: { category: true, brand: true, batches: true }
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const searchByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.query;
    const product = await prisma.product.findFirst({
      where: {
        businessId: req.user.businessId,
        barcode: { contains: barcode, mode: 'insensitive' }
      },
      include: { category: true, brand: true }
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const generateBarcode = async (req, res, next) => {
  try {
    const product = await getProductService(req.params.id, req.user.businessId);
    const barcode = generateBarcodeUtil(product.sku || product.id);
    await prisma.product.update({
      where: { id: product.id },
      data: { barcode }
    });
    res.json({ barcode });
  } catch (error) {
    next(error);
  }
};

export const generateQrcode = async (req, res, next) => {
  try {
    const product = await getProductService(req.params.id, req.user.businessId);
    const qrcode = await generateQRCodeUtil({ id: product.id, sku: product.sku, name: product.name });
    await prisma.product.update({
      where: { id: product.id },
      data: { qrcode }
    });
    res.json({ qrcode });
  } catch (error) {
    next(error);
  }
};
