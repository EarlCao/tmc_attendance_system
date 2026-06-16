import { Router } from 'express';
import {
  getAccounts,
  createAccount,
  createAccountForMember,
  updateAccount,
  deleteAccount
} from '../controller/account.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .get(getAccounts)
  .post(createAccount);

router.post('/member/:memberId', createAccountForMember);

router.route('/:id')
  .put(updateAccount)
  .delete(deleteAccount);

export default router;
