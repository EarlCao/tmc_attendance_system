import { Router } from 'express';
import express from 'express';
import { exportBackup, importBackup } from '../controller/backup.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, requireAdmin);

router.get('/export', exportBackup);

// express.text() parses the raw SQL body (up to 50 MB)
router.post('/import', express.text({ type: '*/*', limit: '50mb' }), importBackup);

export default router;
