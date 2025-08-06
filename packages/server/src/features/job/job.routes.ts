import { Router } from 'express';
import { getJobController } from './controllers/getJob.controller';
import { requireAuth } from '@server/middleware/requireAuth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/:jobId', getJobController);

export default router;
