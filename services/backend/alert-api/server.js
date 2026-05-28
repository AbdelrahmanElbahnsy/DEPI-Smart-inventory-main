import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import alertRoutes from './routes/alert.routes.js';
import { startAlertScanner } from './services/scanner.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// ─── Middleware ───
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin proxy requests (no origin header) and known origins
    const allowed = [
      'http://localhost:5173',
      'http://localhost',
      'http://127.0.0.1:5173',
      'http://127.0.0.1',
    ];
    if (process.env.CORS_ORIGIN) {
      allowed.push(...process.env.CORS_ORIGIN.split(',').map(item => item.trim()));
    }
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
