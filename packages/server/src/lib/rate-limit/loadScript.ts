import fs from 'fs';
import path from 'path';
import { redis } from '@homelab/shared/redis';

export let tokenBucketSha: string | null = null;

export async function loadScript() {
  if (tokenBucketSha) {
    return;
  }

  const script = fs.readFileSync(
    path.join(process.cwd(), 'lua/tokenBucket.lua'),
    'utf8',
  );

  tokenBucketSha = (await redis.script('LOAD', script)) as string;
}
