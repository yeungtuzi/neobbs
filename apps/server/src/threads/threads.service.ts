import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsGateway } from '../notifications/ws/notifications.gateway';

@Injectable()
export class ThreadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ws: NotificationsGateway,
  ) {}

  async findByBoard(boardSlug: string, cursor?: string, limit = 20, digestOnly = false) {
    const board = await this.prisma.board.findUnique({
      where: { slug: boardSlug },
    });

    if (!board || board.isHidden) {
      throw new NotFoundException('Board not found');
    }

    const where: any = { boardId: board.id };
    if (digestOnly) where.isDigest = true;

    const threads = await this.prisma.thread.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { lastReplyAt: 'desc' },
      ],
      take: limit + 1,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : {}),
      select: {
        id: true,
        title: true,
        createdAt: true,
        lastReplyAt: true,
        viewCount: true,
        replyCount: true,
        isPinned: true,
        isLocked: true,
        isDigest: true,
        tags: true,
        author: {
          select: { id: true, username: true, avatar: true },
        },
        lastReplyUser: {
          select: { id: true, username: true },
        },
      },
    });

    const hasMore = threads.length > limit;
    const items = hasMore ? threads.slice(0, limit) : threads;
    const nextCursor = hasMore ? items[items.length - 1]!.id : null;

    return { items, nextCursor, hasMore };
  }

  async findById(threadId: string, userId?: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        boardId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        lastReplyAt: true,
        viewCount: true,
        replyCount: true,
        isPinned: true,
        isLocked: true,
        isDigest: true,
        tags: true,
        author: {
          select: { id: true, username: true, avatar: true },
        },
        lastReplyUser: {
          select: { id: true, username: true },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Increment view count
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { viewCount: { increment: 1 } },
    });

    // Fetch posts
    const posts = await this.prisma.post.findMany({
      where: { threadId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        plainText: true,
        createdAt: true,
        updatedAt: true,
        editCount: true,
        isFirstPost: true,
        isDigest: true,
        postNumber: true,
        parentPostId: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            signature: true,
          },
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            isImage: true,
            imageWidth: true,
            imageHeight: true,
            storagePath: true,
          },
        },
        _count: { select: { likes: true } },
      },
    });

    // Check if current user liked any posts
    let likedPostIds: Set<string> = new Set();
    if (userId) {
      const likes = await this.prisma.postLike.findMany({
        where: {
          userId,
          postId: { in: posts.map((p) => p.id) },
        },
        select: { postId: true },
      });
      likedPostIds = new Set(likes.map((l) => l.postId));
    }

    return {
      ...thread,
      board: await this.prisma.board.findUnique({
        where: { id: thread.boardId },
        select: { slug: true, name: true },
      }),
      posts: posts.map((p) => ({
        ...p,
        likeCount: p._count.likes,
        isLiked: likedPostIds.has(p.id),
        attachments: p.attachments.map((a) => ({
          ...a,
          sizeBytes: Number(a.sizeBytes),
          url: `/uploads/${a.storagePath}`,
        })),
      })),
    };
  }

  async create(
    boardSlug: string,
    authorId: string,
    data: { title: string; content: unknown; attachmentIds?: string[] },
  ) {
    const board = await this.prisma.board.findUnique({
      where: { slug: boardSlug },
    });

    if (!board || board.isHidden) {
      throw new NotFoundException('Board not found');
    }

    // Extract plain text from TipTap JSON
    const plainText = this.extractPlainText(data.content);

    // Get next post number for this board
    const lastPost = await this.prisma.post.findFirst({
      where: { boardId: board.id },
      orderBy: { postNumber: 'desc' },
      select: { postNumber: true },
    });
    const postNumber = (lastPost?.postNumber || 0) + 1;

    const thread = await this.prisma.thread.create({
      data: {
        boardId: board.id,
        authorId,
        title: data.title,
        posts: {
          create: {
            boardId: board.id,
            authorId,
            content: data.content as object,
            plainText,
            isFirstPost: true,
            postNumber,
          },
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // Link attachments to the first post
    if (data.attachmentIds?.length) {
      const firstPost = await this.prisma.post.findFirst({
        where: { threadId: thread.id },
        orderBy: { createdAt: 'asc' },
      });
      if (firstPost) {
        await this.prisma.attachment.updateMany({
          where: { id: { in: data.attachmentIds } },
          data: { postId: firstPost.id },
        });
      }
    }

    // Update board counters
    await this.prisma.board.update({
      where: { id: board.id },
      data: {
        threadCount: { increment: 1 },
        postCount: { increment: 1 },
      },
    });

    // Broadcast to board watchers
    this.ws.notifyNewThread(board.id, {
      id: thread.id,
      title: thread.title,
      author: { username: thread.author.username },
    });

    return thread;
  }

  async batchDelete(
    boardSlug: string,
    userId: string,
    role: string,
    fromNumber: number,
    toNumber: number,
  ) {
    if (role !== 'moderator' && role !== 'admin') {
      throw new ForbiddenException('Only moderators can batch delete');
    }
    const board = await this.prisma.board.findUnique({ where: { slug: boardSlug } });
    if (!board) throw new NotFoundException('Board not found');

    // Find posts with digest marks in range → protect their ancestor chains
    const digestPosts = await this.prisma.post.findMany({
      where: {
        boardId: board.id,
        postNumber: { gte: fromNumber, lte: toNumber },
        isDigest: true,
        isDeleted: false,
      },
      select: { id: true, parentPostId: true },
    });

    // Walk up to collect all ancestor IDs that are protected
    const protectedIds = new Set<string>();
    for (const dp of digestPosts) {
      let current: string | null = dp.id;
      while (current) {
        protectedIds.add(current);
        const ancestor: { parentPostId: string | null } | null = await this.prisma.post.findUnique({
          where: { id: current },
          select: { parentPostId: true },
        });
        current = ancestor?.parentPostId ?? null;
      }
    }

    // Soft-delete posts in range, skipping protected ones and special threads
    const result = await this.prisma.post.updateMany({
      where: {
        boardId: board.id,
        postNumber: { gte: fromNumber, lte: toNumber },
        isDeleted: false,
        id: { notIn: [...protectedIds] },
        thread: { isDigest: false, isPinned: false },
      },
      data: { isDeleted: true },
    });
    return { deleted: result.count, from: fromNumber, to: toNumber, protectedPosts: protectedIds.size };
  }

  async findDeleted(boardSlug: string, cursor?: string, limit = 50) {
    const board = await this.prisma.board.findUnique({ where: { slug: boardSlug } });
    if (!board) throw new NotFoundException('Board not found');

    const posts = await this.prisma.post.findMany({
      where: { boardId: board.id, isDeleted: true },
      orderBy: { postNumber: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true, postNumber: true, plainText: true, createdAt: true,
        author: { select: { id: true, username: true } },
        thread: { select: { id: true, title: true } },
      },
    });

    const hasMore = posts.length > limit;
    return {
      items: posts.slice(0, limit).map((p) => ({
        ...p,
        plainText: p.plainText.slice(0, 100),
      })),
      nextCursor: hasMore ? posts[limit - 1]!.id : null,
      hasMore,
    };
  }

  async toggleDigest(threadId: string, userId: string, role: string) {
    if (role !== 'moderator' && role !== 'admin') {
      throw new ForbiddenException('Only moderators can manage digests');
    }
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');

    const updated = await this.prisma.thread.update({
      where: { id: threadId },
      data: { isDigest: !thread.isDigest },
    });
    return { isDigest: updated.isDigest };
  }

  private extractPlainText(content: unknown): string {
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      // Recurse into TipTap JSON structure
      const obj = content as Record<string, unknown>;
      if (obj.text) return String(obj.text);
      if (Array.isArray(obj.content)) {
        return obj.content.map((c: unknown) => this.extractPlainText(c)).join(' ');
      }
      return '';
    }
    return '';
  }
}
