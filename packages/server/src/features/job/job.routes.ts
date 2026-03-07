import { Router } from 'express';
import { getJobController } from './controllers/getJob.controller';
import { requireAuth } from '@server/middleware/requireAuth.middleware';
import { rateLimit } from '@server/lib/rate-limit/rateLimit';
import { globalUserPolicy } from '@server/lib/rate-limit/policies';

const router = Router();

router.use(requireAuth);
router.use(rateLimit(globalUserPolicy));
router.get('/:jobId', getJobController);

export default router;
