import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/decorators';

@ApiTags('reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('sales')
  @RequirePermissions('reports:READ')
  salesSummary(@Query() query: Record<string, string>) {
    return this.reports.salesSummary(query);
  }

  @Get('sellers')
  @RequirePermissions('reports:READ')
  sellerPerformance() {
    return this.reports.sellerPerformance();
  }

  @Get('inventory')
  @RequirePermissions('reports:READ')
  ticketInventory(@Query('raffleId') raffleId?: string) {
    return this.reports.ticketInventory(raffleId);
  }

  @Get('finance')
  @RequirePermissions('reports:READ')
  financialReconciliation() {
    return this.reports.financialReconciliation();
  }

  @Get('sales/export')
  @RequirePermissions('reports:EXPORT')
  async exportSales(@Query() query: Record<string, string>) {
    const summary = await this.reports.salesSummary(query);
    return this.reports.exportCsv(summary.sales as never, 'sales-report.csv');
  }
}
