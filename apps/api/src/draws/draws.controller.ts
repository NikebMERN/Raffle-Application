import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DrawsService } from './draws.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators';

@ApiTags('draws')
@Controller('draws')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class DrawsController {
  constructor(private draws: DrawsService) {}

  @Get()
  @RequirePermissions('draws:READ')
  findAll(@Query() query: Record<string, string>) {
    return this.draws.getDraws(query);
  }

  @Post('execute')
  @RequirePermissions('draws:DRAW')
  execute(@Body() body: { roundId: string; prizeId: string }, @CurrentUser('id') userId: string) {
    return this.draws.executeDraw(body.roundId, body.prizeId, userId);
  }

  @Get(':id/audit')
  @RequirePermissions('draws:READ')
  getAudit(@Param('id') id: string) {
    return this.draws.getAuditReport(id);
  }
}
