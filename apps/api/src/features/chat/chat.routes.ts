import { Router } from 'express';
import { getBroadcastMessagesController } from './controllers/getBroadcastMessages.controller';
import { requireAuth } from '@server/middleware/requireAuth.middleware';
import { rateLimit } from '@server/lib/rate-limit/rateLimit';
import { globalUserPolicy } from '@server/lib/rate-limit/policies';

const router = Router();

router.get(
  '/broadcast',
  requireAuth,
  rateLimit(globalUserPolicy),
  getBroadcastMessagesController,
);

export default router;
