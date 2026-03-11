import fs from 'fs';
import pino from 'pino';
import pretty from 'pino-pretty';
import rfs from 'pino-rotating-file-stream';
import { env } from '@homelab/shared/config';

const logDir = env.LOG_DIR_PATH;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const streams: pino.StreamEntry[] = [
  {
    stream: pretty({
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    }),
  },
  {
    stream: rfs({
      path: logDir,
      filename: 'app.log',
      size: '10M',
      interval: '1d',
    }),
  },
];

export const logger = pino(
  {
    level: env.NODE_ENV == 'development' ? 'debug' : 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    base: {
      env: env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.epochTime,
  },
  pino.multistream(streams),
);

export function loggerWithContext(obj: Object) {
  return logger.child({
    ...obj,
  });
}

export default logger;
