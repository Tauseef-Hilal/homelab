import { Router } from 'express';
import { extractClientMeta } from './middlewares/extractClientMeta.middleware';
import { requireAuth } from '../../middleware/requireAuth.middleware';
import { signupController } from './controllers/signup.controller';
import { loginController } from './controllers/login.controller';
import { logoutController } from './controllers/logout.controller';
import { refreshController } from './controllers/refresh.controller';
import { changePasswordController } from './controllers/changePassword.controller';
import { verifyOtpController } from './controllers/verifyOtp.controller';

const router = Router();

router.post('/signup', extractClientMeta, signupController);
router.post('/login', extractClientMeta, loginController);
router.post('/logout', extractClientMeta, logoutController);
router.post('/refresh', extractClientMeta, refreshController);
router.post('/change-password', requireAuth, changePasswordController);
router.post('/request-change-password', requireAuth, changePasswordController);
router.post('/verify-otp', extractClientMeta, verifyOtpController);

export default router;
