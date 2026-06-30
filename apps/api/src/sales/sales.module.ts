import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { AuditService } from '../common/audit.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SalesController],
  providers: [SalesService, AuditService],
  exports: [SalesService],
})
export class SalesModule {}
