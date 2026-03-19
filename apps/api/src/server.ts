import http from 'http';
import { env } from '@homelab/infra/config';
import { logger } from '@homelab/infra/logging';
import { initializeStorageRuntime } from '@homelab/storage';
import { registerChatSocket } from './features/chat/chat.socket';
import { initSocket } from './lib/socket';
import { loadScript } from './lib/rate-limit/loadScript';
import app from './app';

const server = http.createServer(app);
const io = initSocket(server);

async function startServer() {
  await initializeStorageRuntime();
  await loadScript();
  registerChatSocket(io);

  server.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://0.0.0.0:${env.PORT}`);
  });
}

startServer().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
