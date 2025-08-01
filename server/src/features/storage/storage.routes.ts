import { Router } from 'express';
import { upload } from '@/lib/multer';
import { requireAuth } from '@/middleware/requireAuth.middleware';
import { uploadFileController } from './controllers/uploadFile.controller';
import { deleteFileController } from './controllers/deleteFile.controller';
import { renameFileController } from './controllers/renameFile.controller';
import { moveFileController } from './controllers/moveFile.controller';
import { copyFileController } from './controllers/copyFIle.controller';

const router = Router();

router.use(requireAuth);
router.post('/file', upload.single('file'), uploadFileController);
router.delete('/file/:fileId', deleteFileController);
router.patch('/file/:fileId/rename', renameFileController);
router.patch('/file/:fileId/move', moveFileController);
router.post('/file/:fileId/copy', copyFileController);

export default router;
