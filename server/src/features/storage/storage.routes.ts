import { Router } from 'express';
import { upload } from '@/lib/multer';
import { requireAuth } from '@/middleware/requireAuth.middleware';
import { uploadFileController } from './controllers/uploadFile.controller';
import { deleteFileController } from './controllers/deleteFile.controller';

const router = Router();

router.post(
  '/file/upload',
  requireAuth,
  upload.single('file'),
  uploadFileController
);
router.post('/file/delete', requireAuth, deleteFileController);

export default router;
