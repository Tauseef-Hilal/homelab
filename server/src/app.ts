/// <reference path="./types/express.d.ts" />

import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './features/auth/auth.routes';
import storageRoutes from './features/storage/storage.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { env } from './config/env';

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);

app.use(errorHandler);

export default app;
