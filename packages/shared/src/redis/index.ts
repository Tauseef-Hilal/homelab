import Redis from 'ioredis';
import { env } from '@shared/config/env';

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: 0,
});

redis.on('connect', () => console.log('[REDIS] Connected'));
redis.on('error', (err) => console.error('[REDIS] Error:', err));

export default redis;
