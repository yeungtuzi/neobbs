import { Controller, Get, Param } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Public()
  @Get()
  async findAll() {
    return this.boardsService.findAll();
  }

  @Public()
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.boardsService.findBySlug(slug);
  }
}
