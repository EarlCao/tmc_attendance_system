import { Router } from 'express';
import { getAttendanceForSession, saveAttendanceForSession, getExcuses, updateExcuseStatus } from '../controller/attendance.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, requireAdmin);

router.get('/session/:sessionId', getAttendanceForSession);
router.post('/session/:sessionId', saveAttendanceForSession);
router.get('/excuses', getExcuses);
router.put('/excuses/:id', updateExcuseStatus);

export default router;
