import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/db.js';
import inventoryRoutes from './routes/inventory.routes.js';
import { register, metricsMiddleware } from './monitoring/metrics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

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
  res.json({ status: 'ok', service: 'inventory-api', timestamp: new Date().toISOString() });
});

// ─── Routes ───
app.use('/api/inventory', inventoryRoutes);

// ─── Error Handler ───
app.use((err, req, res, next) => {
  console.error('Inventory API Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── Start Server ───
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ Inventory API running on port ${PORT}`);
  });
};

start();
