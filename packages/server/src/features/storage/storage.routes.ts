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
router.use(requireAuth);

router.post('/file', upload.single('file'), uploadFileController);
router.delete('/file/:fileId', deleteFileController);
router.patch('/file/:fileId/move', moveFileController);
router.post('/file/:fileId/copy', copyFileController);
router.get('/file/:fileId/download', downloadFileController);
router.get('/file/:fileId/preview', previewFileController);

router.post('/folder', createFolderController);
router.delete('/folder/:folderId', deleteFolderController);
router.patch('/folder/:folderId/move', moveFolderController);
router.post('/folder/:folderId/copy', copyFolderController);
router.get('/folder/:folderId/download', downloadFolderController);
router.get('/download/:id', downloadController);
router.get('/list', listController)

export default router;
