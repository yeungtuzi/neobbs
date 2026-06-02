import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, boardSlug?: string, limit = 20, offset = 0) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const boardFilter = boardSlug
      ? { board: { slug: boardSlug } }
      : {};

    // Search using PostgreSQL ILIKE for simplicity
    // (For production, use tsvector with GIN index)
    const where = {
      ...boardFilter,
      isDeleted: false,
      plainText: {
        contains: query.trim(),
        mode: 'insensitive' as const,
      },
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        select: {
          id: true,
          threadId: true,
          plainText: true,
          createdAt: true,
          thread: {
            select: {
              id: true,
              title: true,
              board: { select: { slug: true, name: true } },
            },
          },
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: posts.map((p) => ({
        id: p.id,
        threadId: p.threadId,
        threadTitle: p.thread.title,
        boardSlug: p.thread.board.slug,
        boardName: p.thread.board.name,
        snippet: p.plainText.slice(0, 200),
        author: p.author,
        createdAt: p.createdAt,
      })),
      total,
    };
  }
}
