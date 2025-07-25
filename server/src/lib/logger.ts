import fs from 'fs';
import path from 'path';
import pino from 'pino';
import pretty from 'pino-pretty';
import rfs from 'pino-rotating-file-stream';
import { multistream } from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { env } from '@/config/env';

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
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
  multistream(streams)
);

export function withRequestId(reqId?: string) {
  return logger.child({ reqId: reqId ?? uuidv4() });
}

export default logger;
