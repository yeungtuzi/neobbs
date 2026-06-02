import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsGateway } from './ws/notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ws: NotificationsGateway,
  ) {}

  async notifyReply(threadId: string, replyAuthorName: string, replyAuthorId: string, notifiedUserId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { title: true, authorId: true },
    });
    if (!thread || thread.authorId === replyAuthorId) return; // Don't notify self

    // Save to DB
    await this.prisma.notification.create({
      data: {
        userId: notifiedUserId,
        type: 'reply',
        actorId: replyAuthorId,
        threadId,
      },
    });

    // Push via WebSocket
    this.ws.notifyReply(notifiedUserId, {
      threadId,
      threadTitle: thread.title,
      replyAuthor: replyAuthorName,
    });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: { select: { id: true, username: true } },
        thread: { select: { id: true, title: true } },
      },
    });
  }

  async markRead(userId: string, notificationId?: string) {
    if (notificationId) {
      await this.prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
    } else {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
