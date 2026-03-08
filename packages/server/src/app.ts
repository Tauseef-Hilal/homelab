/// <reference path="./types/express.d.ts" />

import path from 'path';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './features/auth/auth.routes';
import storageRoutes from './features/storage/storage.routes';
import chatRoutes from './features/chat/chat.routes';
import jobRoutes from './features/job/job.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { env } from '../../shared/src/config/env';
import { extractClientMeta } from './middleware/extractClientMeta.middleware';
import {
  healthController,
  readyController,
} from './infrastructure/health/health.controller';
import { setupBullBoard } from './infrastructure/queues/bull-board';
import { requireAuth } from './middleware/requireAuth.middleware';
import { requireRole } from './middleware/requireRole.middleware';
import expressBasicAuth from 'express-basic-auth';

const app = express();
const bullBoard = setupBullBoard();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(extractClientMeta);
app.use(requestLogger);

app.use('/api/uploads', express.static(path.resolve(env.MEDIA_DIR_PATH)));

// Observability endpoints
app.get('/api/health', healthController);
app.get('/api/ready', readyController);
app.use(
  '/api/admin/queues',
  expressBasicAuth({
    users: { admin: env.ADMIN_PASSWORD },
    challenge: true,
  }),
  bullBoard.getRouter(),
);

// Feature routers
app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chat', chatRoutes);

app.use(errorHandler);

export default app;
