import { Module } from '@nestjs/common';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';
import { PrismaService } from '../common/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ThreadsController],
  providers: [ThreadsService, PrismaService],
  exports: [ThreadsService],
})
export class ThreadsModule {}
