import { Router } from 'express';
import { getRules, createRule, updateRule, deleteRule } from '../controller/rule.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getRules);

router.use(requireAdmin);

router.post('/', createRule);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

export default router;
