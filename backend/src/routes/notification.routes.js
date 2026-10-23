import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(notificationController.getNotifications));
// registered before /:id/read so "read-all" is never treated as an id
router.put('/read-all', asyncHandler(notificationController.markAllRead));
router.put('/:id/read', asyncHandler(notificationController.markRead));

export default router;
