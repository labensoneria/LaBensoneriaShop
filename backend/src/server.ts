import app from './app';

const PORT = process.env.PORT ?? 3000;

// Log key env vars at startup (no secrets, just presence checks)
console.log('[startup] NODE_ENV:', process.env.NODE_ENV ?? '(not set)');
console.log('[startup] PORT:', PORT);
console.log('[startup] DATABASE_URL:', process.env.DATABASE_URL ? '✓ set' : '✗ MISSING');
console.log('[startup] JWT_SECRET:', process.env.JWT_SECRET ? '✓ set' : '✗ MISSING');
console.log('[startup] CORS_ORIGINS:', process.env.CORS_ORIGINS ?? '(not set, defaulting to http://localhost:5173)');
console.log('[startup] FRONTEND_URL:', process.env.FRONTEND_URL ?? '(not set)');
console.log('[startup] CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ set' : '✗ MISSING');
console.log('[startup] STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓ set' : '✗ MISSING');
console.log('[startup] STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✓ set' : '✗ MISSING');

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`[startup] Backend listening on port ${PORT}`);
});
