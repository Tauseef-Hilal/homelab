import http from 'http';
import { env } from '@homelab/infra/config';
import { logger } from '@homelab/infra/logging';
import { registerChatSocket } from './features/chat/chat.socket';
import { initSocket } from './lib/socket';
import { loadScript } from './lib/rate-limit/loadScript';
import app from './app';

const server = http.createServer(app);
const io = initSocket(server);

server.listen(env.PORT, '0.0.0.0', async () => {
  // Load rate limit lua
  await loadScript();

  // Setup socketIO
  registerChatSocket(io);

  logger.info(`Server running on http://0.0.0.0:${env.PORT}`);
});
