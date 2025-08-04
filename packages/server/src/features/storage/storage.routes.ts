import { Router } from 'express';
import { upload } from '@server/lib/multer';
import { requireAuth } from '@server/middleware/requireAuth.middleware';
import {
  copyFileController,
  deleteFileController,
  downloadFileController,
  moveFileController,
  previewFileController,
  renameFileController,
  uploadFileController,
} from './controllers/file';
import {
  copyFolderController,
  createFolderController,
  deleteFolderController,
  moveFolderController,
} from './controllers/folder';

const router = Router();
router.use(requireAuth);

router.post('/file', upload.single('file'), uploadFileController);
router.delete('/file/:fileId', deleteFileController);
router.patch('/file/:fileId/rename', renameFileController);
router.patch('/file/:fileId/move', moveFileController);
router.post('/file/:fileId/copy', copyFileController);
router.get('/file/:fileId/download', requireAuth, downloadFileController);
router.get('/file/:fileId/preview', requireAuth, previewFileController);

router.post('/folder', createFolderController);
router.delete('/folder/:folderId', deleteFolderController);
router.patch('/folder/:folderId/move', moveFolderController);
router.post('/folder/:folderId/copy', copyFolderController);

export default router;
