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

const router = Router();

router.post('/file', requireAuth, upload.single('file'), uploadFileController);
router.get('/file/:fileId/preview', previewFileController);

router.post('/folder', requireAuth, createFolderController);

router.get('/download/:id', downloadController);
router.get('/list', requireAuth, listController);

router.post('/items/copy', requireAuth, copyItemsController);
router.patch('/items/move', requireAuth, moveItemsController);
router.post('/items/delete', requireAuth, deleteItemsController);
router.post('/items/download', requireAuth, downloadItemsController);

export default router;
