import http from 'http';
import logger from '@shared/logging';
import { env } from '@shared/config/env';
import { registerChatSocket } from './features/chat/chat.socket';
import { initSocket } from './lib/socket';
import app from './app';
import { prisma } from '@shared/prisma';

const server = http.createServer(app);
const io = initSocket(server);

server.listen(env.PORT, async () => {
  // const user = await prisma.user.findUnique({where: { email: 'tantary.tauseef1@gmail.com' },})
  // await prisma.user.update({
  //   where: { email: 'tantary.tauseef1@gmail.com' },
  //   data: { storageUsed: 0 },
  // });
  
  // await prisma.file.deleteMany({where: {userId: user?.id}})
  // await prisma.folder.deleteMany({where: {userId: user?.id}})
  // await prisma.folder.create({
  //     data: { name: '', fullPath: '/', userId: user!.id },
  //   });
  // await prisma.systemStats.updateMany({data: {totalStorageUsed: 0}})
  logger.info(`Server running on ${env.API_BASE_URL}`);
  registerChatSocket(io);
});
