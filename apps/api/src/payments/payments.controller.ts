import { Controller, Get, Post, Body, Req, Headers, RawBodyRequest, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  checkout(@Body() body: { ticketIds: string[] }, @CurrentUser('id') userId: string) {
    return this.payments.createCheckoutSession(userId, body.ticketIds);
  }

  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.payments.handleWebhook(req.rawBody as Buffer, signature);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('payments:READ')
  @ApiBearerAuth()
  findAll() {
    return this.payments.findAll();
  }
}
