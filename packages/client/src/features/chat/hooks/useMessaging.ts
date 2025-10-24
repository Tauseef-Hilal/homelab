'use client';

import useAuthStore from '@client/features/auth/stores/auth.store';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BroadcastMessage } from '@shared/schemas/chat/io.schema';
import { toast } from 'sonner';
import {v4} from "uuid"

export function useMessaging() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL, {});
    socketRef.current = socket;

    socket.on('broadcast', (message) => {
      setMessages((messages) => [message, ...messages]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (content: string) => {
    if (!socketRef.current || !user) return;

    const message: BroadcastMessage = {
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
        if (ack.success) console.log('Broadcast sent:', ack.message);
        else toast.error('Failed to send message');
      }
    );
  };

  return { messages, setMessages, sendMessage };
}
