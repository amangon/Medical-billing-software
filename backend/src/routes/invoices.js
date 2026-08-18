import express from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  downloadInvoicePdf,
  getPrintView,
  shareInvoice
} from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
router.put('/:id/status', updateInvoiceStatus);
router.get('/:id/pdf', downloadInvoicePdf);
router.get('/:id/print', getPrintView);
router.post('/:id/share', shareInvoice);

export default router;
