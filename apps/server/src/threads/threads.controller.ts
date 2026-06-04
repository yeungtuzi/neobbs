import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';

@Controller()
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Public()
  @Get('boards/:slug/threads')
  async findByBoard(
    @Param('slug') slug: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('digest') digest?: string,
  ) {
    return this.threadsService.findByBoard(slug, cursor, limit ? +limit : 20, digest === 'true');
  }

  @Post('boards/:slug/threads')
  async create(
    @Param('slug') slug: string,
    @Body() body: { title: string; content: unknown; attachmentIds?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.threadsService.create(slug, user.id, body);
  }

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get('threads/:id')
  async findById(
    @Param('id') id: string,
    @CurrentUser() user?: any,
  ) {
    return this.threadsService.findById(id, user?.id);
  }

  @Patch('threads/:id/digest')
  async toggleDigest(@Param('id') id: string, @CurrentUser() user: any) {
    return this.threadsService.toggleDigest(id, user.id, user.role);
  }

  @Post('boards/:slug/cleanup')
  async batchDelete(
    @Param('slug') slug: string,
    @Body() body: { from: number; to: number },
    @CurrentUser() user: any,
  ) {
    return this.threadsService.batchDelete(slug, user.id, user.role, body.from, body.to);
  }

  @Get('boards/:slug/deleted')
  async findDeleted(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
    @Query('cursor') cursor?: string,
  ) {
    if (user.role !== 'moderator' && user.role !== 'admin') {
      throw new (await import('@nestjs/common')).ForbiddenException('Access denied');
    }
    return this.threadsService.findDeleted(slug, cursor);
  }
}
