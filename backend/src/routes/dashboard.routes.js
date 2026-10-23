import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requireRole('OFFICER', 'BUREAU_HEAD', 'ADMIN'));

router.get('/stats', asyncHandler(dashboardController.getStats));
router.get('/complaints', asyncHandler(dashboardController.getComplaints));
router.get('/categories', asyncHandler(dashboardController.getCategories));
router.get('/bureaus', asyncHandler(dashboardController.getBureaus));

export default router;
