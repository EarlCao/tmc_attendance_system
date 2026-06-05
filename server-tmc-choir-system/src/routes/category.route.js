import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controller/category.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, requireAdmin);

router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
