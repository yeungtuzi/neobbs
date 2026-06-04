import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createReply(
    threadId: string,
    authorId: string,
    data: { content: unknown; attachmentIds?: string[]; parentPostId?: string },
  ) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, boardId: true, isLocked: true },
    });

    if (!thread) throw new NotFoundException('Thread not found');
    if (thread.isLocked) throw new ForbiddenException('Thread is locked');

    const plainText = this.extractPlainText(data.content);

    // Validate parent post belongs to same thread
    if (data.parentPostId) {
      const parent = await this.prisma.post.findUnique({ where: { id: data.parentPostId } });
      if (!parent || parent.threadId !== threadId) {
        throw new BadRequestException('Invalid parent post');
      }
    }

    // Get next post number for this board
    const lastPost = await this.prisma.post.findFirst({
      where: { boardId: thread.boardId },
      orderBy: { postNumber: 'desc' },
      select: { postNumber: true },
    });
    const postNumber = (lastPost?.postNumber || 0) + 1;

    const post = await this.prisma.post.create({
      data: {
        threadId: thread.id,
        boardId: thread.boardId,
        authorId,
        content: data.content as object,
        plainText,
        isFirstPost: false,
        postNumber,
        parentPostId: data.parentPostId,
      },
      select: {
        id: true,
        content: true,
        plainText: true,
        createdAt: true,
        author: {
          select: { id: true, username: true, avatar: true, signature: true },
        },
      },
    });

    // Link attachments to this reply
    if (data.attachmentIds?.length) {
      await this.prisma.attachment.updateMany({
        where: { id: { in: data.attachmentIds } },
        data: { postId: post.id },
      });
    }

    // Update thread + board counters
    await this.prisma.thread.update({
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
        lastReplyUserId: authorId,
      },
    });

    await this.prisma.board.update({
      where: { id: thread.boardId },
      data: { postCount: { increment: 1 } },
    });

    // Notify thread author of reply
    const threadAuthor = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { authorId: true },
    });
    if (threadAuthor) {
      this.notifications.notifyReply(threadId, post.author.username, authorId, threadAuthor.authorId);
    }

    return {
      ...post,
      likeCount: 0,
      isLiked: false,
      attachments: [],
    };
  }

  async update(postId: string, userId: string, data: { content: unknown }) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, isDeleted: true },
    });
    if (!post || post.isDeleted) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    const plainText = this.extractPlainText(data.content);
    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        content: data.content as object,
        plainText,
        editCount: { increment: 1 },
      },
    });
    return { ok: true, editCount: updated.editCount };
  }

  async delete(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, threadId: true, boardId: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAuthor = post.authorId === userId;
    const isModOrAdmin = user?.role === 'moderator' || user?.role === 'admin';
    if (!isAuthor && !isModOrAdmin) throw new ForbiddenException('No permission');

    await this.prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    });
    return { deleted: true };
  }

  async toggleDigestPost(postId: string, userId: string, role: string) {
    if (role !== 'moderator' && role !== 'admin') {
      throw new ForbiddenException('Only moderators can mark digests');
    }
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, isDigest: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { isDigest: !post.isDigest },
    });
    return { isDigest: updated.isDigest };
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({
        where: { userId_postId: { userId, postId } },
      });
      return { liked: false };
    }

    await this.prisma.postLike.create({
      data: { userId, postId },
    });
    return { liked: true };
  }

  private extractPlainText(content: unknown): string {
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      const obj = content as Record<string, unknown>;
      if (obj.text) return String(obj.text);
      if (Array.isArray(obj.content)) {
        return (obj.content as unknown[])
          .map((c) => this.extractPlainText(c))
          .join(' ');
      }
    }
    return '';
  }
}
