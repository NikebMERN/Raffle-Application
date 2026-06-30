import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SalesService } from './sales.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators';

@ApiTags('sales')
@Controller('sales')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private sales: SalesService) {}

  @Get()
  @RequirePermissions('sales:READ')
  findAll(@Query() query: Record<string, string>) {
    return this.sales.findAll(query);
  }

  @Post('offline')
  @RequirePermissions('sales:CREATE')
  recordOffline(
    @Body() body: { ticketId: string; sellerId: string; amount: number; buyerName?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.sales.recordOfflineSale(body, userId);
  }
}
