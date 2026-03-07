import { Router } from 'express';
import { extractClientMeta } from './middlewares/extractClientMeta.middleware';
import { requireAuth } from '../../middleware/requireAuth.middleware';
import { signupController } from './controllers/signup.controller';
import { loginController } from './controllers/login.controller';
import { logoutController } from './controllers/logout.controller';
import { refreshController } from './controllers/refresh.controller';
import { verifyOtpController } from './controllers/verifyOtp.controller';
import { changePasswordController } from './controllers/changePassword.controller';
import { requestChangePasswordController } from './controllers/requestChangePassword.controller';
import { meController } from './controllers/me.controller';
import { rateLimit } from '@server/lib/rate-limit/rateLimit';
import {
  globalUserPolicy,
  loginEmailPolicy,
  passwordResetPolicy,
  signupPolicy,
} from '@server/lib/rate-limit/policies';

const router = Router();
const authProtected = [requireAuth, rateLimit(globalUserPolicy)]

router.post(
  '/signup',
  extractClientMeta,
  rateLimit(signupPolicy),
  signupController,
);
router.post(
  '/login',
  extractClientMeta,
  rateLimit(loginEmailPolicy),
  loginController,
);
router.post(
  '/forgot-password',
  rateLimit(passwordResetPolicy),
  requestChangePasswordController,
);
router.post('/logout', extractClientMeta, ...authProtected, logoutController);
router.patch('/password', changePasswordController);
router.post('/verify-otp', extractClientMeta, verifyOtpController);
router.post('/refresh', extractClientMeta, refreshController);
router.get('/me', requireAuth, meController);

export default router;
