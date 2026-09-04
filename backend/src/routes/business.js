import express from 'express';
import {
  getBusiness,
  updateBusiness,
  getBusinessStats
} from '../controllers/businessController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBusiness);
router.put('/', updateBusiness);
router.get('/stats', getBusinessStats);

export default router;
