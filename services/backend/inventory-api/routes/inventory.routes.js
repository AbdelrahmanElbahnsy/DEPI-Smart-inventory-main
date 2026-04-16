import { Router } from 'express';
import {
  getInventoryOverview,
  getInventoryTrends,
  updateStock,
  getProductsByStatus,
  getCategoryDistribution,
} from '../controllers/inventory.controller.js';

const router = Router();

// GET /api/inventory — Full inventory overview (totals, values, status counts)
router.get('/', getInventoryOverview);

// GET /api/inventory/trends — Monthly trend data for charts
router.get('/trends', getInventoryTrends);

// GET /api/inventory/categories — Category distribution for pie chart
router.get('/categories', getCategoryDistribution);

// GET /api/inventory/status/:status — Filter products by stock status
router.get('/status/:status', getProductsByStatus);

// PUT /api/inventory/:productId — Update stock quantity for a specific product
router.put('/:productId', updateStock);

export default router;
