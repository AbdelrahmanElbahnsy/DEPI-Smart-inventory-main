import { Router } from 'express';
import {
  getAlerts,
  getAlertById,
  markAlertRead,
  markAllRead,
  dismissAlert,
  getAlertStats,
} from '../controllers/alert.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication to all alert routes
router.use(authenticate);

// GET /api/alerts — List all alerts with optional filters
router.get('/', getAlerts);

// GET /api/alerts/stats — Get alert statistics
router.get('/stats', getAlertStats);

// GET /api/alerts/:id — Get a single alert
router.get('/:id', getAlertById);

// PUT /api/alerts/:id/read — Mark a single alert as read
router.put('/:id/read', markAlertRead);

// PUT /api/alerts/read-all — Mark all alerts as read
router.put('/read-all', markAllRead);

// DELETE /api/alerts/:id — Dismiss/delete an alert (Owner & Manager only)
router.delete('/:id', authorize('owner', 'manager'), dismissAlert);

export default router;
