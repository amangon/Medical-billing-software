import express from 'express';
import {
  getPayments,
  getPayment,
  createPayment,
  createRefund
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getPayments);
router.post('/', createPayment);
router.get('/:id', getPayment);
router.post('/refund', createRefund);

export default router;
