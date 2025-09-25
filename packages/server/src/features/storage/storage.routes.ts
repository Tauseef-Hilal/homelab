import { Router } from 'express';
import { upload } from '@server/lib/multer';
import { requireAuth } from '@server/middleware/requireAuth.middleware';
import {
  copyFileController,
  deleteFileController,
  downloadFileController,
  moveFileController,
  previewFileController,
  uploadFileController,
} from './controllers/file';
import {
  copyFolderController,
  createFolderController,
  deleteFolderController,
  downloadController,
  downloadFolderController,
  moveFolderController,
} from './controllers/folder';
import { listController } from './controllers/folder/list.controller';

const router = Router();

router.post('/file', requireAuth, upload.single('file'), uploadFileController);
router.delete('/file/:fileId', requireAuth, deleteFileController);
router.patch('/file/:fileId/move', requireAuth, moveFileController);
router.post('/file/:fileId/copy', requireAuth, copyFileController);
router.get('/file/:fileId/download', requireAuth, downloadFileController);
router.get('/file/:fileId/preview', previewFileController);

router.post('/folder', requireAuth, createFolderController);
router.delete('/folder/:folderId', requireAuth, deleteFolderController);
router.patch('/folder/:folderId/move', requireAuth, moveFolderController);
router.post('/folder/:folderId/copy', requireAuth, copyFolderController);
router.get('/folder/:folderId/download', requireAuth, downloadFolderController);
router.get('/download/:id', requireAuth, downloadController);
router.get('/list', requireAuth, listController);

export default router;
