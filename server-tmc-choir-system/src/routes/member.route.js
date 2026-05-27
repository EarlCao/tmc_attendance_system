import { Router } from 'express';
import { createMember, getMembers, updateMember, deleteMember, searchMembers, filterMembers } from '../controller/member.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, requireAdmin);

router.post('/', createMember);
router.get('/', getMembers);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);
router.get('/search', searchMembers);
router.get('/filter', filterMembers);

export default router;