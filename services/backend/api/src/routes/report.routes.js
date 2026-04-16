import { Router } from 'express';
import { getReports, createReport, downloadReport } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

// Read/download — all roles
router.get('/', getReports);
router.get('/:id/download', downloadReport);

// Generate — Owner and Manager only
router.post('/generate', authorize('owner', 'manager'), createReport);

export default router;
