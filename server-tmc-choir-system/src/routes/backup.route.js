import { Router } from 'express';
import { exportBackup } from '../controller/backup.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, requireAdmin);

router.get('/export', exportBackup);

export default router;
