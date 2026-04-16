import { Router } from 'express';
import { getOrders, createOrder, updateOrderStatus, getOrderStats } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

// Read — all roles
router.get('/stats', getOrderStats);
router.get('/', getOrders);

// Create — Owner, Manager, Staff (Staff can add orders)
router.post('/', authorize('owner', 'manager', 'staff'), createOrder);

// Update status — Owner and Manager only
router.put('/:id', authorize('owner', 'manager'), updateOrderStatus);

export default router;
