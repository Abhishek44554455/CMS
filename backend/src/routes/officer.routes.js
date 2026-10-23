import { Router } from 'express';
import * as officerController from '../controllers/officer.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requireRole('OFFICER', 'BUREAU_HEAD', 'ADMIN'));

router.get('/', asyncHandler(officerController.getOfficers));
router.get('/:id', asyncHandler(officerController.getOfficerById));

export default router;
