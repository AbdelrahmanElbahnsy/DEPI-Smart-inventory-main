import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import alertRoutes from './routes/alert.routes.js';
import { startAlertScanner } from './services/scanner.js';
import { register, metricsMiddleware } from './monitoring/metrics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// ─── Middleware ───
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── Metrics Middleware ───
app.use(metricsMiddleware);

// ─── Metrics Endpoint ───
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// ─── Health Check ───
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'alert-api', timestamp: new Date().toISOString() });
});

// ─── Routes ───
app.use('/api/alerts', alertRoutes);

// ─── Error Handler ───
app.use((err, req, res, next) => {
  console.error('Alert API Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── Start Server ───
const start = async () => {
  await connectDB();
  startAlertScanner();
  app.listen(PORT, () => {
    console.log(`✅ Alert API running on port ${PORT}`);
  });
};

start();
