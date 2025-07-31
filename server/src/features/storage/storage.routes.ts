import { Router } from 'express';
import { upload } from '@/lib/multer';
import { requireAuth } from '@/middleware/requireAuth.middleware';
import { uploadFileController } from './controllers/uploadFile.controller';

const router = Router();

router.post(
  '/file/upload',
  requireAuth,
  upload.single('file'),
  uploadFileController
);

export default router;
