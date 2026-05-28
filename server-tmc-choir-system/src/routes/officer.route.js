import { Router } from 'express';
import { getOfficers, createOfficer, updateOfficer, deleteOfficer } from '../controller/officer.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, requireAdmin);

router.get('/', getOfficers);
router.post('/', createOfficer);
router.put('/:id', updateOfficer);
router.delete('/:id', deleteOfficer);

export default router;
