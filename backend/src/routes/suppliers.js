import express from 'express';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierPurchases,
  getSupplierPayments,
  getSupplierBalance
} from '../controllers/supplierController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSuppliers);
router.post('/', createSupplier);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);
router.get('/:id/purchases', getSupplierPurchases);
router.get('/:id/payments', getSupplierPayments);
router.get('/:id/balance', getSupplierBalance);

export default router;
