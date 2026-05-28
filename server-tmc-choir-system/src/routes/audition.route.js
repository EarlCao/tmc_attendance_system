import { Router } from 'express';
import { getAuditionees, createAuditionee, updateAuditionee, deleteAuditionee, updateAuditioneeStatus, saveEvaluation } from '../controller/audition.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, requireAdmin);

router.get('/', getAuditionees);
router.post('/', createAuditionee);
router.put('/:id', updateAuditionee);
router.delete('/:id', deleteAuditionee);
router.put('/:id/status', updateAuditioneeStatus);
router.post('/evaluations', saveEvaluation);

export default router;
