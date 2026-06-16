import express from 'express';
import {
  getDashboard,
  getAttendance,
  getProfile,
  updateProfile,
  getSemesterSummary
} from '../controller/portal.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Portal routes serve a logged-in member's own data. Require an authenticated
// MEMBER explicitly (rather than relying only on the presence of a memberId).
router.use(protect);
router.use(restrictTo('MEMBER'));

router.get('/dashboard', getDashboard);
router.get('/attendance', getAttendance);
router.get('/semesters', getSemesterSummary);
router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

export default router;
