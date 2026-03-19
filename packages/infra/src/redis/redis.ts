import Redis from 'ioredis';
import { env } from '@homelab/infra/config';

const shouldLazyConnect = env.NODE_ENV === 'test';
const redisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: 0,
  maxRetriesPerRequest: null,
  lazyConnect: shouldLazyConnect,
} as const;

export const redis = new Redis(redisOptions);

export const redisPub = new Redis(redisOptions);

export const redisSub = new Redis(redisOptions);

if (!shouldLazyConnect) {
  redis.on('connect', () => console.log('[REDIS] Connected'));
  redis.on('error', (err) => console.error('[REDIS] Error:', err));
}

export default redis;
