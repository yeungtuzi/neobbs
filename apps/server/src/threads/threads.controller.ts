import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
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
  ) {
    return this.threadsService.findByBoard(slug, cursor, limit ? +limit : 20);
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
}
