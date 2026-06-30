import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AuditService } from '../common/audit.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, AuditService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
