import { env } from '@shared/config/env';
import logger from '@shared/logging';
import Redis from 'ioredis';

export const redisPub = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  db: 0,
});

export const redisSub = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  db: 0,
});

export const BROADCAST_CHANNEL = 'broadcast:global';

redisSub.subscribe(BROADCAST_CHANNEL, (err) => {
  if (err) logger.error(err, 'Redis subscribe error');
  else logger.info({}, 'Subscribed to broadcast channel');
});
