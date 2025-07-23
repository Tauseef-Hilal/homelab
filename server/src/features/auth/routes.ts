import { Router } from 'express';
import {
  changePasswordController,
  loginController,
  logoutController,
  refreshController,
  signupController,
} from './controller';
import { authenticate, extractClientMeta } from './middlewares';

const router = Router();

router.post('/signup', extractClientMeta, signupController);
router.post('/login', extractClientMeta, loginController);
router.post('/logout', extractClientMeta, logoutController);
router.post('/refresh', extractClientMeta, refreshController);
router.post('/change-password', authenticate, changePasswordController);

export default router;
