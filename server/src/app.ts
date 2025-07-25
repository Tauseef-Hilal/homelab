/// <reference path="./types/express.d.ts" />

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './features/auth/auth.routes';
import { requestLogger } from './middleware/logging.middleware';

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use(requestLogger);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

export default app;
