import express from 'express';
import {
  getInventories,
  createInventoryAdjustment,
  createInventoryTransfer,
  getInventoryAlerts
} from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/stock', getInventories);
router.post('/adjustment', createInventoryAdjustment);
router.post('/transfer', createInventoryTransfer);
router.get('/alerts', getInventoryAlerts);

export default router;