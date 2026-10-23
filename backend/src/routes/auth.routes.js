import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;
