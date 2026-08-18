import express from 'express';
import {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  updatePurchaseStatus,
  createPurchaseReturn
} from '../controllers/purchaseController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getPurchases);
router.post('/', createPurchase);
router.get('/:id', getPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);
router.put('/:id/status', updatePurchaseStatus);
router.post('/:id/return', createPurchaseReturn);

export default router;
