import { Server, Socket } from 'socket.io';
import { BROADCAST_CHANNEL } from './chat.redis';
import { ioSchemas } from '@homelab/contracts/schemas/chat';
import { prisma } from '@homelab/db/prisma';
import { rateLimitCheck } from '@server/lib/rate-limit/rateLimit';
import { chatSendPolicy } from '@server/lib/rate-limit/policies';
import { redisPub, redisSub } from '@homelab/infra/redis';
import logger from '@homelab/infra/logging';
import { verifyAccessToken } from '@server/lib/jwt';

export const registerChatSocket = (io: Server) => {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Listen to Redis broadcasts from other servers
  redisSub.on('message', (channel: string, message: string) => {
    if (channel === BROADCAST_CHANNEL) {
      const msg = JSON.parse(message);
      io.emit('broadcast', msg); // emit to all connected clients
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`Client connected: ${socket.id} (User: ${user?.id})`);

    // Listen for broadcast sends from client
    socket.on(
      'broadcast:send',
      async (msgJson: string, ack: (status: any) => void) => {
        try {
          // Parse msg
          const message = ioSchemas.broadcastMessageSchema.parse(
            JSON.parse(msgJson),
          );

          if (message.content.length > 1000) {
            return ack({ success: false, error: 'Message too long' });
          }

          // Ensure the sender matches the authenticated user
          if (message.authorId !== user.id) {
            return ack({ success: false, error: 'Unauthorized sender' });
          }

          // Rate limit
          const { allowed } = await rateLimitCheck(user.id, chatSendPolicy);
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
