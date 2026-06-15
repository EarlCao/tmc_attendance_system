import { Router } from 'express';
import { login, logout, getMe } from '../controller/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { loginLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
