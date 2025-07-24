import { Router } from 'express';
import {
  changePasswordController,
  loginController,
  logoutController,
  refreshController,
  signupController,
} from './controllers/auth.controller';
import { extractClientMeta } from './middlewares/extractClientMeta.middleware';
import { requireAuth } from './middlewares/requireAuth.middleware';

const router = Router();

router.post('/signup', extractClientMeta, signupController);
router.post('/login', extractClientMeta, loginController);
router.post('/logout', extractClientMeta, logoutController);
router.post('/refresh', extractClientMeta, refreshController);
router.post('/change-password', requireAuth, changePasswordController);

export default router;
