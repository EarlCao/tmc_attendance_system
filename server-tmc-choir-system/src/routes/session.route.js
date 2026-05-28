import { Router } from 'express';
import { getSessions, getSession, createSession, updateSession, deleteSession } from '../controller/session.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, requireAdmin);

router.get('/', getSessions);
router.get('/:id', getSession);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
