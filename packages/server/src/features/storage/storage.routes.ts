import { Router } from 'express';
import { upload } from '@server/lib/multer';
import { requireAuth } from '@server/middleware/requireAuth.middleware';
import { listController } from './controllers/list.controller';
import { copyItemsController } from './controllers/copyItems.controller';
import { moveItemsController } from './controllers/moveItems.controller';
import { deleteItemsController } from './controllers/deleteItems.controller';
import { uploadFileController } from './controllers/uploadFile.controller';
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
  uploadPolicy,
} from '@server/lib/rate-limit/policies';

const router = Router();
const authProtected = [requireAuth, rateLimit(globalUserPolicy)]

router.get('/file/:fileId/preview', ...authProtected, previewFileController);
router.get('/stats', ...authProtected, getStatsController);
router.get('/list', ...authProtected, rateLimit(storageListPolicy), listController);

router.post(
  '/file',
  ...authProtected,
  rateLimit(uploadPolicy),
  upload.single('file'),
  uploadFileController,
);

router.post(
  '/folder',
  ...authProtected,
  rateLimit(uploadPolicy),
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

export default router;
