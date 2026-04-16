import { Router } from 'express';
import { getInventoryOverview, updateStock, getTrends, getInventoryTotalValue } from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

// Read — all roles (Security needs dashboard visibility)
router.get('/', getInventoryOverview);
router.get('/trends', getTrends);
router.get('/value', getInventoryTotalValue);

// Update stock — Owner and Manager only
router.put('/:productId', authorize('owner', 'manager'), updateStock);

export default router;
