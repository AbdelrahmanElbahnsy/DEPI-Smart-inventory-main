import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getProductStats, getCategories } from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, noDelete, readOnly } from '../middleware/role.middleware.js';
import { uploadProductImage } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

// Read endpoints — all roles (Security needs dashboard data)
router.get('/stats', getProductStats);
router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:id', getProduct);

// Create — Owner, Manager, Staff (Security blocked by readOnly)
router.post('/', authorize('owner', 'manager', 'staff'), uploadProductImage, createProduct);

// Update — Owner, Manager, Staff
router.put('/:id', authorize('owner', 'manager', 'staff'), uploadProductImage, updateProduct);

// Delete — Owner and Manager only (Staff has no-delete, Security has no access)
router.delete('/:id', authorize('owner', 'manager'), deleteProduct);

export default router;
