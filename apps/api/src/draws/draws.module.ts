import { Module } from '@nestjs/common';
import { DrawsService } from './draws.service';
import { DrawsController } from './draws.controller';
import { AuditService } from '../common/audit.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DrawsController],
  providers: [DrawsService, AuditService],
  exports: [DrawsService],
})
export class DrawsModule {}
