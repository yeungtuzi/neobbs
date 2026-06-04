import { Controller, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('threads/:id/replies')
  async createReply(
    @Param('id') id: string,
    @Body() body: { content: unknown; attachmentIds?: string[]; parentPostId?: string },
    @CurrentUser() user: any,
  ) {
    return this.postsService.createReply(id, user.id, body);
  }

  @Patch('posts/:id')
  async update(
    @Param('id') id: string,
    @Body() body: { content: unknown },
    @CurrentUser() user: any,
  ) {
    return this.postsService.update(id, user.id, body);
  }

  @Post('posts/:id/like')
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.toggleLike(id, user.id);
  }

  @Delete('posts/:id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.delete(id, user.id);
  }

  @Patch('posts/:id/digest')
  async toggleDigest(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.toggleDigestPost(id, user.id, user.role);
  }
}
