'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  userId?: string;
  onNotification?: (notif: { threadId: string; threadTitle: string; replyAuthor: string }) => void;
  onNewThread?: (thread: { id: string; title: string; author: { username: string } }) => void;
  onOnlineCount?: (count: number) => void;
}

export function useWebSocket(opts: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:4000', {
      path: '/ws/socket.io',
      query: { userId: opts.userId || 'anonymous' },
      auth: token ? { token } : undefined,
      reconnectionAttempts: 3,
      timeout: 5000,
    });
    socket.on('connect_error', () => {
      // Silently ignore connection errors — WS is optional enhancement
    });
    socketRef.current = socket;

    socket.on('notification', (data) => {
      optsRef.current.onNotification?.(data);
    });
    socket.on('new-thread', (data) => {
      optsRef.current.onNewThread?.(data);
    });
    socket.on('online-count', (count: number) => {
      setOnlineCount(count);
      optsRef.current.onOnlineCount?.(count);
    });

    return () => {
      socket.disconnect();
    };
  }, [opts.userId]);

  const joinBoard = (boardId: string) => socketRef.current?.emit('join-board', boardId);
  const leaveBoard = (boardId: string) => socketRef.current?.emit('leave-board', boardId);

  return { onlineCount, joinBoard, leaveBoard };
}
