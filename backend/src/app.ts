import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import productsRoutes from './routes/products.routes';
import adminProductsRoutes from './routes/adminProducts.routes';
import authRoutes from './routes/auth.routes';
import ordersRoutes from './routes/orders.routes';
import adminOrdersRoutes from './routes/adminOrders.routes';
import reviewsRoutes from './routes/reviews.routes';
import adminSettingsRoutes from './routes/adminSettings.routes';
import adminReportsRoutes from './routes/adminReports.routes';
import popupRoutes from './routes/popup.routes';
import paymentsRoutes from './routes/payments.routes';
import { webhook as stripeWebhook } from './controllers/payments.controller';

const app = express();

app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.path}`);
  next();
});

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Permitir peticiones sin origen (curl, Postman, tests)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origen no permitido - ${origin}`));
    },
    credentials: true,
  })
);

// El webhook de Stripe necesita el body sin parsear para verificar la firma.
// Debe registrarse ANTES de app.use(express.json()).
app.post(
  '/api/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook,
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'labensoneria-backend' });
});

app.use('/api/products',                    productsRoutes);
app.use('/api/products/:productId/reviews', reviewsRoutes);
app.use('/api/admin/products',              adminProductsRoutes);
app.use('/api/auth',                        authRoutes);
app.use('/api/orders',                      ordersRoutes);
app.use('/api/admin/orders',                adminOrdersRoutes);
app.use('/api/admin/settings',             adminSettingsRoutes);
app.use('/api/admin/reports',              adminReportsRoutes);
app.use('/api/popup',                      popupRoutes);
app.use('/api/payments',                   paymentsRoutes);

app.use(errorHandler);

export default app;
