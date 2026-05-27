import { Router } from 'express';
import { createSemester, getSemesters, updateSemester, endSemester, deleteSemester } from '../controller/semester.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, requireAdmin);

router.get('/', getSemesters);
router.post('/', createSemester);
router.put('/:id', updateSemester);
router.post('/:id/end', endSemester);
router.delete('/:id', deleteSemester);

export default router;
