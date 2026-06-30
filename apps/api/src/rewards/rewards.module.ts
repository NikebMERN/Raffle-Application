import { Module } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [RewardsController],
  providers: [RewardsService, AuditService],
  exports: [RewardsService],
})
export class RewardsModule {}
