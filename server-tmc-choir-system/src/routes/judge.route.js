import { Router } from 'express';
import { getJudges, createJudge, updateJudge, deleteJudge } from '../controller/judge.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, requireAdmin);

router.get('/', getJudges);
router.post('/', createJudge);
router.put('/:id', updateJudge);
router.delete('/:id', deleteJudge);

export default router;
