import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: ['http://localhost:3000'], credentials: true },
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Track online users: socketId → userId
  private onlineUsers = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = (client.handshake.query.userId as string) || 'anonymous';
    this.onlineUsers.set(client.id, userId);
    this.broadcastOnlineCount();
  }

  handleDisconnect(client: Socket) {
    this.onlineUsers.delete(client.id);
    // Leave all rooms
    client.rooms.forEach((room) => {
      if (room !== client.id) {
        client.leave(room);
        this.server.to(room).emit('user-left', { userId: this.onlineUsers.get(client.id) });
      }
    });
    this.broadcastOnlineCount();
  }

  @SubscribeMessage('join-board')
  handleJoinBoard(client: Socket, boardId: string) {
    // Leave previous board rooms
    client.rooms.forEach((room) => {
      if (room.startsWith('board:') && room !== `board:${boardId}`) {
        client.leave(room);
      }
    });
    client.join(`board:${boardId}`);
  }

  @SubscribeMessage('leave-board')
  handleLeaveBoard(client: Socket, boardId: string) {
    client.leave(`board:${boardId}`);
  }

  // Called by services to broadcast new thread to board watchers
  notifyNewThread(boardId: string, thread: { id: string; title: string; author: { username: string } }) {
    this.server.to(`board:${boardId}`).emit('new-thread', thread);
  }

  // Called by services to notify a user of a reply
  notifyReply(userId: string, notification: { threadId: string; threadTitle: string; replyAuthor: string }) {
    // Find all sockets for this user and emit
    this.onlineUsers.forEach((uid, socketId) => {
      if (uid === userId) {
        this.server.to(socketId).emit('notification', notification);
      }
    });
  }

  private broadcastOnlineCount() {
    this.server.emit('online-count', this.onlineUsers.size);
  }
}
