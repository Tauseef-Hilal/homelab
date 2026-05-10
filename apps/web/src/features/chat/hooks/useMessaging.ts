'use client';

import useAuthStore from '@client/stores/auth.store';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ioSchemas } from '@homelab/contracts/schemas/chat';
import { toast } from 'sonner';
import { v4 } from 'uuid';

export function useMessaging() {
  const { user, accessToken, authInitialized } = useAuthStore();
  const [messages, setMessages] = useState<ioSchemas.BroadcastMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!authInitialized || !accessToken) return;

    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
      console.error('NEXT_PUBLIC_API_BASE_URL is not defined');
      return;
    }

    const socket = io(url, {
      transports: ['websocket'],
      auth: {
        token: accessToken,
      },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('broadcast', (message) => {
      setMessages((messages) => [...messages, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [authInitialized, accessToken]);

  const sendMessage = (content: string) => {
    if (!socketRef.current || !user) return;

    const message: ioSchemas.BroadcastMessage = {
      id: v4(),
      content,
      authorId: user.id,
      sentAt: new Date().toISOString(),
      author: user,
    };

    socketRef.current.emit(
      'broadcast:send',
      JSON.stringify(message),
      (ack: { success: boolean; message?: string; error?: string }) => {
        if (ack.error) toast.error(ack.error ?? 'Failed to send message');
      },
    );
  };

  return { messages, setMessages, sendMessage, currentUserId: user?.id };
}
