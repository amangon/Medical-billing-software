import express from 'express';
import {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controllers/brandController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBrands);
router.post('/', createBrand);
router.get('/:id', getBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

export default router;
