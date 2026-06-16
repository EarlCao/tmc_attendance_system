import { Router } from 'express';
import { getAuditLogs, clearAuditLogs } from '../controller/auditLog.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .get(getAuditLogs)
  .delete(clearAuditLogs);

export default router;
