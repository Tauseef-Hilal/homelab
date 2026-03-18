import { raw, Router } from 'express';
import { requireAuth } from '@server/middleware/requireAuth.middleware';
import { listController } from './controllers/list.controller';
import { copyItemsController } from './controllers/copyItems.controller';
import { moveItemsController } from './controllers/moveItems.controller';
import { deleteItemsController } from './controllers/deleteItems.controller';
import { previewFileController } from './controllers/previewFile.controller';
import { createFolderController } from './controllers/createFolder.controller';
import { downloadController } from './controllers/download.controller';
import { downloadItemsController } from './controllers/downloadItems.controller';
import { getStatsController } from './controllers/getStats.controller';
import { rateLimit } from '@server/lib/rate-limit/rateLimit';
import {
  globalUserPolicy,
  storageCopyPolicy,
  storageDeletePolicy,
  storageDownloadPolicy,
  storageListPolicy,
  storageMovePolicy,
  uploadChunkCheckPolicy,
  uploadChunkPolicy,
  uploadFinalizePolicy,
  uploadInitPolicy,
} from '@server/lib/rate-limit/policies';
import { MAX_CHUNK_SIZE } from '@homelab/shared/constants';
import { uploadChunkController } from './controllers/uploadChunk.controller';
import { uploadInitController } from './controllers/uploadInit.controller';
import { uploadChunkCheckController } from './controllers/uploadChunkCheck.controller';
import { uploadCancelController } from './controllers/uploadCancel.controller';
import { uploadFinishController } from './controllers/uploadFinish.controller';
import { uploadStatusController } from './controllers/uploadStatus.controller';

const router = Router();
const authProtected = [requireAuth, rateLimit(globalUserPolicy)];

router.get('/stats', ...authProtected, getStatsController);
router.get('/file/:fileId/preview', previewFileController);
router.get(
  '/list',
  ...authProtected,
  rateLimit(storageListPolicy),
  listController,
);

router.post(
  '/folder',
  ...authProtected,
  rateLimit(uploadInitPolicy),
  createFolderController,
);

router.post(
  '/items/copy',
  ...authProtected,
  rateLimit(storageCopyPolicy),
  copyItemsController,
);
router.patch(
  '/items/move',
  ...authProtected,
  rateLimit(storageMovePolicy),
  moveItemsController,
);
router.post(
  '/items/delete',
  ...authProtected,
  rateLimit(storageDeletePolicy),
  deleteItemsController,
);
router.post(
  '/items/download',
  ...authProtected,
  rateLimit(storageDownloadPolicy),
  downloadItemsController,
);

router.get('/download/:id', downloadController);

router.post(
  '/upload/init',
  ...authProtected,
  rateLimit(uploadInitPolicy),
  uploadInitController,
);

router.post(
  '/upload/chunk/check',
  ...authProtected,
  rateLimit(uploadChunkCheckPolicy),
  uploadChunkCheckController,
);

router.post('/upload/cancel', ...authProtected, uploadCancelController);

router.post(
  '/upload/finish',
  ...authProtected,
  rateLimit(uploadFinalizePolicy),
  uploadFinishController,
);

router.post('/upload/status', ...authProtected, uploadStatusController);

router.put(
  '/upload/chunk',
  raw({ type: 'application/octet-stream', limit: MAX_CHUNK_SIZE }),
  ...authProtected,
  rateLimit(uploadChunkPolicy),
  uploadChunkController,
);

export default router;
