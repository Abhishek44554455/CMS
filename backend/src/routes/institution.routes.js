import { Router } from 'express';
import * as institutionController from '../controllers/institution.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// Public reads (used by the complaint submission form)
router.get('/', asyncHandler(institutionController.getInstitutions));
router.get('/:id', asyncHandler(institutionController.getInstitutionById));

// Management
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(institutionController.createInstitution)
);
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(institutionController.updateInstitution)
);
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(institutionController.deleteInstitution)
);

export default router;
