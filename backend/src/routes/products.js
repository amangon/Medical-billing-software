import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
  exportProducts,
  getLowStockProducts,
  getExpiringProducts,
  searchByBarcode,
  generateBarcode,
  generateQrcode
} from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/bulk-import', bulkImportProducts);
router.get('/export', exportProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/expiring', getExpiringProducts);
router.get('/search/barcode', searchByBarcode);
router.post('/:id/generate-barcode', generateBarcode);
router.post('/:id/generate-qrcode', generateQrcode);

export default router;
