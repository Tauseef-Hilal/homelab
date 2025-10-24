import { Router } from 'express';
import { getBroadcastMessagesController } from './controllers/getBroadcastMessages.controller';

const router = Router();

router.get('/broadcast', getBroadcastMessagesController);

export default router;
