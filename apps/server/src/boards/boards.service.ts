import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const boards = await this.prisma.board.findMany({
      where: { parentId: null, isHidden: false },
      include: {
        children: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return boards.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      threadCount: b.threadCount,
      postCount: b.postCount,
      children: b.children.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        threadCount: c.threadCount,
        postCount: c.postCount,
      })),
    }));
  }

  async findBySlug(slug: string) {
    const board = await this.prisma.board.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!board || board.isHidden) {
      throw new NotFoundException('Board not found');
    }

    return {
      id: board.id,
      name: board.name,
      slug: board.slug,
      description: board.description,
      threadCount: board.threadCount,
      postCount: board.postCount,
      children: board.children.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        threadCount: c.threadCount,
        postCount: c.postCount,
      })),
    };
  }
}
