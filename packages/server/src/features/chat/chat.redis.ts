import logger from '@homelab/shared/logging';
import { redisSub } from '@homelab/shared/redis';

export const BROADCAST_CHANNEL = 'broadcast:global';

redisSub.subscribe(BROADCAST_CHANNEL, (err: unknown) => {
  if (err) logger.error(err, 'Redis subscribe error');
  else logger.info({}, 'Subscribed to broadcast channel');
});
