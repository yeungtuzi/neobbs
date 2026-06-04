import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, boardSlug?: string, limit = 20, offset = 0) {
    if (!query || query.trim().length < 1) {
      throw new BadRequestException('Search query cannot be empty');
    }

    const q = query.trim();

    // Search plainText + thread titles + raw JSONB content for old posts
    // Use raw SQL condition for JSONB search
    const searchResults = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT p.id, p."thread_id" as "threadId", p."plain_text" as "plainText",
              p."created_at" as "createdAt", p."author_id" as "authorId",
              t.id as "thread_id2", t.title as "threadTitle",
              b.slug as "boardSlug", b.name as "boardName",
              u.id as "userId", u.username, u.avatar
       FROM posts p
       JOIN threads t ON t.id = p."thread_id"
       JOIN boards b ON b.id = p."board_id"
       JOIN users u ON u.id = p."author_id"
       WHERE p.is_deleted = false
         ${boardSlug ? `AND b.slug = '${boardSlug.replace(/'/g, "''")}'` : ''}
         AND (
           p.plain_text ILIKE ${`'%${q.replace(/'/g, "''")}%'`}
           OR t.title ILIKE ${`'%${q.replace(/'/g, "''")}%'`}
           OR (p.content::text) ILIKE ${`'%${q.replace(/'/g, "''")}%'`}
         )
       ORDER BY p."created_at" DESC
       LIMIT ${limit} OFFSET ${offset}`,
    );

    const countResult = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as cnt
       FROM posts p
       JOIN threads t ON t.id = p."thread_id"
       JOIN boards b ON b.id = p."board_id"
       WHERE p.is_deleted = false
         ${boardSlug ? `AND b.slug = '${boardSlug.replace(/'/g, "''")}'` : ''}
         AND (
           p.plain_text ILIKE ${`'%${q.replace(/'/g, "''")}%'`}
           OR t.title ILIKE ${`'%${q.replace(/'/g, "''")}%'`}
           OR (p.content::text) ILIKE ${`'%${q.replace(/'/g, "''")}%'`}
         )`,
    );

    const total = Number(countResult[0]?.cnt || 0);

    return {
      items: searchResults.map((p: any) => ({
        id: p.id,
        threadId: p.threadId,
        threadTitle: p.threadTitle,
        boardSlug: p.boardSlug,
        boardName: p.boardName,
        snippet: (p.plainText || '').slice(0, 200),
        author: { id: p.userId, username: p.username, avatar: p.avatar },
        createdAt: p.createdAt,
      })),
      total,
    };
  }
}
