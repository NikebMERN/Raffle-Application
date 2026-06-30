import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AuditService } from '../common/audit.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, AuditService],
  exports: [WalletService],
})
export class WalletModule {}
