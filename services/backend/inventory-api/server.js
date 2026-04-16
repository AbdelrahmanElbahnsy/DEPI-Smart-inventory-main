import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/db.js';
import inventoryRoutes from './routes/inventory.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Middleware ───
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin proxy requests (no origin header) and known origins
    const allowed = ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1:5173', 'http://127.0.0.1'];
    if (process.env.CORS_ORIGIN) allowed.push(...process.env.CORS_ORIGIN.split(','));
    if (!origin || allowed.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

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
