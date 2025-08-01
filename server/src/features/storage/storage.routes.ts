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
router.post('/file/upload', upload.single('file'), uploadFileController);
router.post('/file/delete', deleteFileController);
router.post('/file/rename', renameFileController);
router.post('/file/move', moveFileController);
router.post('/file/copy', copyFileController);

export default router;
