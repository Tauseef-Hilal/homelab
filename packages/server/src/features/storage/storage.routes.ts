import { Router } from 'express';
import { upload } from '@server/lib/multer';
import { requireAuth } from '@server/middleware/requireAuth.middleware';
import { uploadFileController } from './controllers/uploadFile.controller';
import { deleteFileController } from './controllers/deleteFile.controller';
import { renameFileController } from './controllers/renameFile.controller';
import { moveFileController } from './controllers/moveFile.controller';
import { copyFileController } from './controllers/copyFIle.controller';
import { downloadFileController } from './controllers/downloadFile.controller';
import { previewFileController } from './controllers/previewFile.controller';

const router = Router();

router.use(requireAuth);
router.post('/file', upload.single('file'), uploadFileController);
router.delete('/file/:fileId', deleteFileController);
router.patch('/file/:fileId/rename', renameFileController);
router.patch('/file/:fileId/move', moveFileController);
router.post('/file/:fileId/copy', copyFileController);
router.get('/file/:fileId/download', requireAuth, downloadFileController);
router.get('/file/:fileId/preview', requireAuth, previewFileController);

export default router;
