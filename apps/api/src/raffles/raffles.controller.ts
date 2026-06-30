import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RafflesService } from './raffles.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators';

@ApiTags('raffles')
@Controller('raffles')
export class RafflesController {
  constructor(private raffles: RafflesService) {}

  @Get('public')
  findPublic(@Query() query: Record<string, string>) {
    return this.raffles.findAll(query, true);
  }

  @Get('public/:id')
  findPublicOne(@Param('id') id: string) {
    return this.raffles.findOne(id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('raffles:READ')
  @ApiBearerAuth()
  findAll(@Query() query: Record<string, string>) {
    return this.raffles.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('raffles:READ')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.raffles.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('raffles:CREATE')
  @ApiBearerAuth()
  create(@Body() body: Record<string, unknown>, @CurrentUser('id') userId: string) {
    return this.raffles.create(body as never, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('raffles:UPDATE')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser('id') userId: string) {
    return this.raffles.update(id, body as never, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('raffles:DELETE')
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.raffles.remove(id, userId);
  }

  @Post(':id/rounds')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('rounds:CREATE')
  @ApiBearerAuth()
  createRound(@Param('id') id: string, @Body() body: { roundNumber: number; title: string; drawDate?: string }) {
    return this.raffles.createRound(id, { ...body, drawDate: body.drawDate ? new Date(body.drawDate) : undefined });
  }

  @Post('rounds/:roundId/prizes')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('prizes:CREATE')
  @ApiBearerAuth()
  createPrize(@Param('roundId') roundId: string, @Body() body: { name: string; description?: string; value: number; position: number }) {
    return this.raffles.createPrize(roundId, body);
  }
}
