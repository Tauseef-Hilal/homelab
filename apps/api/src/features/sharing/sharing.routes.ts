import { Router } from 'express';
import { shareWithUserContoller } from './controllers/shareWithUser.controller';
import { revokeUserShareController } from './controllers/revokeUserShare.controller';
import { shareLinkController } from './controllers/shareLink.controller';
import { updateLinkController } from './controllers/updateLink.controller';
import { revokeLinkController } from './controllers/revokeLink.controller';
import { getUserSharesController } from './controllers/getUserShares.controller';
import { getSharedLinksController } from './controllers/getSharedLinks.controller';
import { requireAuth } from '@server/middleware/requireAuth.middleware';
import { globalUserPolicy } from '@server/lib/rate-limit/policies';
import { rateLimit } from '@server/lib/rate-limit/rateLimit';
import { updateUserShareController } from './controllers/updateUserShare.controller';

const router = Router();
const authProtected = [requireAuth, rateLimit(globalUserPolicy)];

// User-to-user sharing routes
router.get('/:itemId/user', ...authProtected, getUserSharesController);
router.post('/:itemId/user', ...authProtected, shareWithUserContoller);
router.put('/:itemId/user', ...authProtected, updateUserShareController);
router.delete('/:itemId/user', ...authProtected, revokeUserShareController);

// Link sharing routes
router.get('/:itemId/link', ...authProtected, getSharedLinksController);
router.post('/:itemId/link', ...authProtected, shareLinkController);
router.put('/:token', ...authProtected, updateLinkController);
router.delete('/:token', ...authProtected, revokeLinkController);

export default router;
