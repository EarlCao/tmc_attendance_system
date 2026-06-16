import { Router } from 'express';
import express from 'express';
import { exportBackup, importBackup } from '../controller/backup.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, requireAdmin);

router.get('/export', exportBackup);

// express.text() parses the raw SQL body. Cap the size to limit memory/DoS risk;
// the import controller further restricts which statements may run.
router.post('/import', express.text({ type: '*/*', limit: '5mb' }), importBackup);

export default router;
