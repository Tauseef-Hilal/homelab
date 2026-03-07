import http from 'http';
import logger from '@shared/logging';
import { env } from '@shared/config/env';
import { registerChatSocket } from './features/chat/chat.socket';
import { initSocket } from './lib/socket';
import app from './app';
import { loadScript } from './lib/rate-limit/loadScript';

const server = http.createServer(app);
const io = initSocket(server);

server.listen(env.PORT, async () => {
  // Load rate limit lua
  await loadScript();

  // Setup socketIO
  registerChatSocket(io);

  logger.info(`Server running on ${env.API_BASE_URL}`);
});
