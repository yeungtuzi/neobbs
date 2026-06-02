import { Module } from '@nestjs/common';
import { NotificationsGateway } from './ws/notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService, PrismaService],
  exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule {}
