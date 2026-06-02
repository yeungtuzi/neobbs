import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: any) {
    return this.notificationsService.getNotifications(user.id);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.unreadCount(user.id);
    return { count };
  }

  @Patch('read-all')
  async readAll(@CurrentUser() user: any) {
    await this.notificationsService.markRead(user.id);
    return { ok: true };
  }

  @Patch(':id/read')
  async readOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.notificationsService.markRead(user.id, id);
    return { ok: true };
  }
}
