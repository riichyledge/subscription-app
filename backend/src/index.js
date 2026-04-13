import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import authRoutes from './routes/auth.js';
import stripeRoutes from './routes/stripe.js';
import dashboardRoutes from './routes/dashboard.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app = express();

// Stripe webhook MUST receive the raw body before express.json() parses it
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(helmet({ contentSecurityPolicy: false }));

if (!isProd) {
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
}

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Serve React frontend in production
if (isProd) {
  const distPath = join(__dirname, '../../frontend/dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')));
  }
}

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
