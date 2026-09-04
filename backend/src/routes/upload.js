import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { upload } from '../utils/upload.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/image', upload.single('file'), uploadImage);

export default router;
