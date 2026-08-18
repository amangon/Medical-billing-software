import express from 'express';
import {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getCustomerReport,
  getSupplierReport,
  getGstReport,
  getProfitLossReport,
  getDashboardStats
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/inventory', getInventoryReport);
router.get('/customers', getCustomerReport);
router.get('/suppliers', getSupplierReport);
router.get('/gst', getGstReport);
router.get('/profit-loss', getProfitLossReport);
router.get('/dashboard-stats', getDashboardStats);

export default router;
