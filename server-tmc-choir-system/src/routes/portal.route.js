import express from 'express';
import {
  getDashboard,
  getAttendance,
  getProfile,
  updateProfile,
  getSemesterSummary
} from '../controller/portal.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/attendance', getAttendance);
router.get('/semesters', getSemesterSummary);
router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

export default router;
