import { Module, forwardRef } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, AuditService],
  exports: [TicketsService],
})
export class TicketsModule {}
