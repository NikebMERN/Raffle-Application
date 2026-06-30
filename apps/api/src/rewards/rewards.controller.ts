import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RewardsService } from './rewards.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators';
import { CreateRewardConfigDto, UpdateRewardConfigDto } from './rewards.dto';

@ApiTags('rewards')
@Controller('rewards')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class RewardsController {
  constructor(private rewards: RewardsService) {}

  @Get()
  @RequirePermissions('rewards:READ')
  findAll(@Query() query: Record<string, string>) {
    return this.rewards.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('rewards:READ')
  findOne(@Param('id') id: string) {
    return this.rewards.findOne(id);
  }

  @Post()
  @RequirePermissions('rewards:CREATE')
  create(@Body() dto: CreateRewardConfigDto, @CurrentUser('id') userId: string) {
    return this.rewards.create(dto, userId);
  }

  @Patch(':id')
  @RequirePermissions('rewards:UPDATE')
  update(@Param('id') id: string, @Body() dto: UpdateRewardConfigDto, @CurrentUser('id') userId: string) {
    return this.rewards.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('rewards:DELETE')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.rewards.remove(id, userId);
  }

  @Post(':id/sync-prizes')
  @RequirePermissions('rewards:UPDATE')
  syncPrizes(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.rewards.syncPrizesFromRewards(id, userId);
  }
}
