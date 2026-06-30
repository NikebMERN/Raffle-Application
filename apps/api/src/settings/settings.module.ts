import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, AuditService],
  exports: [SettingsService],
})
export class SettingsModule {}
