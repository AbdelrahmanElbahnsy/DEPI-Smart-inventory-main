import { Router } from 'express';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

// Read — all roles
router.get('/', getSuppliers);
router.get('/:id', getSupplier);

// Create/Update — Owner and Manager only
router.post('/', authorize('owner', 'manager'), createSupplier);
router.put('/:id', authorize('owner', 'manager'), updateSupplier);

// Delete — Owner and Manager only
router.delete('/:id', authorize('owner', 'manager'), deleteSupplier);

export default router;
