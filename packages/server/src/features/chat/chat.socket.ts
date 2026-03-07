import { Server, Socket } from 'socket.io';
import { redisPub, BROADCAST_CHANNEL, redisSub } from './chat.redis';
import { broadcastMessageSchema } from '@shared/schemas/chat/io.schema';
import { prisma } from '@shared/prisma';
import logger from '@shared/logging';
import { rateLimitCheck } from '@server/lib/rate-limit/rateLimit';
import { chatSendPolicy } from '@server/lib/rate-limit/policies';

export const registerChatSocket = (io: Server) => {
  // Listen to Redis broadcasts from other servers
  redisSub.on('message', (channel, message) => {
    if (channel === BROADCAST_CHANNEL) {
      const msg = JSON.parse(message);
      io.emit('broadcast', msg); // emit to all connected clients
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Listen for broadcast sends from client
    socket.on(
      'broadcast:send',
      async (msgJson: string, ack: (status: any) => void) => {
        try {
          // Parse msg
          const message = broadcastMessageSchema.parse(JSON.parse(msgJson));

          if (message.content.length > 1000) {
            return ack({ success: false, error: 'Message too long' });
          }

          // Rate limit
          const { allowed } = await rateLimitCheck(
            message.authorId,
            chatSendPolicy,
          );
          console.log('rate-limit identifier:', message.authorId);
          if (!allowed) {
            return ack({
              success: false,
              error: 'Too many messages. Slow down!',
            });
          }

          // Store in db
          await prisma.broadcastMessage.create({
            data: {
              id: message.id,
              content: message.content,
              sentAt: message.sentAt,
              authorId: message.authorId,
            },
          });

          // Publish to Redis for other servers
          redisPub.publish(BROADCAST_CHANNEL, JSON.stringify(message));

          // Ack to sender
          ack({ success: true, message });
        } catch (err: any) {
          ack({ success: false, error: err.message });
        }
      },
    );

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
};
