import redis from '@shared/redis';
import { NextFunction, Request, Response } from 'express';
import { loadScript, tokenBucketSha } from './loadScript';
import { error } from '../response';
import { RedisKeys } from '@shared/redis/redisKeys';
import { RateLimitPolicy } from '@server/types/rate';
export async function rateLimitCheck(
  identifier: string,
  policy: RateLimitPolicy,
) {
  if (!tokenBucketSha) {
    await loadScript();
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.ceil(policy.capacity / policy.refillRate);

  let result: number[];

  try {
    result = (await redis.evalsha(
      tokenBucketSha!,
      1,
      RedisKeys.rateLimit.getKey(identifier, policy),
      policy.capacity,
      policy.refillRate,
      now,
      ttl,
    )) as number[];
  } catch (err: any) {
    if (err.message.includes('NOSCRIPT')) {
      await loadScript();
      result = (await redis.evalsha(
        tokenBucketSha!,
        1,
        RedisKeys.rateLimit.getKey(identifier, policy),
        policy.capacity,
        policy.refillRate,
        now,
        ttl,
      )) as number[];
    } else {
      throw err;
    }
  }

  const allowed = result[0] === 1;
  const tokens = result[1];

  return {
    allowed,
    tokens,
    retryAfter: Math.ceil(1 / policy.refillRate),
  };
}

export function rateLimit(policy: RateLimitPolicy) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let identifier: string;

      if (policy.scope === 'user') {
        identifier = req.user.id;
      } else if (policy.scope === 'email') {
        identifier = req.body.email;
      } else {
        identifier = req.ip ?? '';
      }

      const result = await rateLimitCheck(identifier, policy);

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter);
        return res.status(429).json(error('Too many requests'));
      }

      res.setHeader('X-RateLimit-Remaining', Math.floor(result.tokens));

      next();
    } catch (err) {
      next(err);
    }
  };
}
