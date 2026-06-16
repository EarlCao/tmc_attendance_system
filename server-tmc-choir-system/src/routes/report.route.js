import { Router } from 'express';
import { getSemesterAttendanceSummary } from '../controller/report.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

// All report routes require admin authentication
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/semesters', getSemesterAttendanceSummary);

export default router;
