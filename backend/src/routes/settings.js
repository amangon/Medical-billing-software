import express from 'express';
import {
  getSettings,
  updateSettings,
  getUserPermissions,
  updateUserPermissions
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', updateSettings);
router.get('/permissions', getUserPermissions);
router.put('/permissions', updateUserPermissions);

export default router;
