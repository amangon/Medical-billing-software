import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import brandRoutes from './routes/brands.js';
import customerRoutes from './routes/customers.js';
import supplierRoutes from './routes/suppliers.js';
import orderRoutes from './routes/orders.js';
import purchaseRoutes from './routes/purchases.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/payments.js';
import expenseRoutes from './routes/expenses.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import inventoryRoutes from './routes/inventory.js';
import uploadRoutes from './routes/upload.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();
const PORT = process.env.PORT || 5001;
export const prisma = new PrismaClient();

app.use(helmet());
const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (frontendUrls.includes(origin)) {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

const isDev = process.env.NODE_ENV === 'development'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  skip: (req) => {
    const path = req.path
    return path === '/api/auth/login' || path === '/api/auth/register'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 20,
  skip: (req) => {
    const path = req.path
    return path === '/api/auth/login' || path === '/api/auth/register'
  },
  message: { message: 'Too many auth attempts, please try again after 15 minutes' }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/business', authenticate, businessRoutes);
app.use('/api/products', authenticate, productRoutes);
app.use('/api/categories', authenticate, categoryRoutes);
app.use('/api/brands', authenticate, brandRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/suppliers', authenticate, supplierRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/purchases', authenticate, purchaseRoutes);
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/expenses', authenticate, expenseRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/settings', authenticate, settingsRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);
app.use('/api/upload', authenticate, uploadRoutes);

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
