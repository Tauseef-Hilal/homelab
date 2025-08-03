import fs from 'fs';
import pino from 'pino';
import pretty from 'pino-pretty';
import rfs from 'pino-rotating-file-stream';
import { env } from '@shared/config/env';

const logDir = env.LOG_ROOT;
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

const logger = pino(
  {
    level: env.NODE_ENV == 'development' ? 'debug' : 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
  pino.multistream(streams)
);

export function withRequestId(reqId: string) {
  return logger.child({ reqId });
}

export default logger;
