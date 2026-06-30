import { Module } from '@nestjs/common';
import { RafflesService } from './raffles.service';
import { RafflesController } from './raffles.controller';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [RafflesController],
  providers: [RafflesService, AuditService],
  exports: [RafflesService],
})
export class RafflesModule {}
