import { Router } from 'express';
import { createSemester, getSemesters, updateSemester, endSemester, deleteSemester } from '../controller/semester.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// GET is available to all authenticated users (members need to see active semester)
router.get('/', protect, getSemesters);

// Write operations require admin
router.use(protect, requireAdmin);
router.post('/', createSemester);
router.put('/:id', updateSemester);
router.post('/:id/end', endSemester);
router.delete('/:id', deleteSemester);

export default router;
