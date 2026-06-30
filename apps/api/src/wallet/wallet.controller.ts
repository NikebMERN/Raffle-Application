import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private wallet: WalletService) {}

  @Get('me')
  getMyWallet(@CurrentUser('id') userId: string) {
    return this.wallet.getWallet(userId);
  }

  @Get()
  @RequirePermissions('wallet:READ')
  getAll() {
    return this.wallet.getAllWallets();
  }

  @Post('credit')
  @RequirePermissions('wallet:SETTLE')
  credit(@Body() body: { userId: string; amount: number; reference: string; description?: string }) {
    return this.wallet.credit(body.userId, body.amount, body.reference, body.description);
  }

  @Post('debit')
  @RequirePermissions('wallet:SETTLE')
  debit(@Body() body: { userId: string; amount: number; reference: string; description?: string }) {
    return this.wallet.debit(body.userId, body.amount, body.reference, body.description);
  }
}
