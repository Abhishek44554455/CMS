import { Router } from 'express';
import * as complaintController from '../controllers/complaint.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.use(authenticate);

// CRUD
router.post(
  '/',
  requireRole('CITIZEN', 'OFFICER', 'BUREAU_HEAD', 'ADMIN'),
  asyncHandler(complaintController.createComplaint)
);
router.get(
  '/',
  requireRole('OFFICER', 'BUREAU_HEAD', 'ADMIN'),
  asyncHandler(complaintController.getComplaints)
);
router.get('/:id', asyncHandler(complaintController.getComplaintById));
router.put('/:id', asyncHandler(complaintController.updateComplaint));
router.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(complaintController.deleteComplaint)
);

// Management
router.put(
  '/:id/assign',
  requireRole('BUREAU_HEAD', 'ADMIN'),
  asyncHandler(complaintController.assignComplaint)
);
router.put(
  '/:id/status',
  requireRole('OFFICER', 'BUREAU_HEAD', 'ADMIN'),
  asyncHandler(complaintController.updateComplaintStatus)
);
router.post(
  '/:id/escalate',
  requireRole('OFFICER', 'CITIZEN', 'BUREAU_HEAD', 'ADMIN'),
  asyncHandler(complaintController.escalateComplaint)
);
router.get('/:id/history', asyncHandler(complaintController.getComplaintHistory));

export default router;
