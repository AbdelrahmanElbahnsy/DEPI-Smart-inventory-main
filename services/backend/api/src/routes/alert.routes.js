import { Router } from 'express';
import { getAlerts, markAsRead, markAllAsRead, deleteAlert } from '../controllers/alert.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

// Read — all roles (Security needs alert access for monitoring)
router.get('/', getAlerts);

// Mark as read — all roles
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

// Delete — Owner and Manager only
router.delete('/:id', authorize('owner', 'manager'), deleteAlert);

export default router;
