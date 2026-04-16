import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, updateProfile, changePassword } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { uploadAvatar } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

// Self management — any authenticated user
router.put('/profile', uploadAvatar, updateProfile);
router.put('/password', changePassword);

// User management — Owner has full control, Manager can create Staff/Security
router.get('/', authorize('owner', 'manager'), getUsers);
router.post('/', authorize('owner', 'manager'), createUser);
router.put('/:id', authorize('owner', 'manager'), updateUser);
router.delete('/:id', authorize('owner'), deleteUser);

export default router;
