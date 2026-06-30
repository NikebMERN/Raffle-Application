import { Controller, Get, Patch, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('settings')
@Controller()
export class SettingsController {
  constructor(
    private settings: SettingsService,
    private prisma: PrismaService,
  ) {}

  @Get('settings')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('settings:READ')
  @ApiBearerAuth()
  findAll() {
    return this.settings.findAll();
  }

  @Patch('settings/:key')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('settings:UPDATE')
  @ApiBearerAuth()
  update(@Param('key') key: string, @Body() body: { value: string }, @CurrentUser('id') userId: string) {
    return this.settings.update(key, body.value, userId);
  }

  @Get('audit-logs')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('audit_logs:READ')
  @ApiBearerAuth()
  auditLogs(@Query() query: Record<string, string>) {
    return this.settings.getAuditLogs(query);
  }

  @Get('activity-logs')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('activity_logs:READ')
  @ApiBearerAuth()
  activityLogs(@Query() query: Record<string, string>) {
    return this.settings.getActivityLogs(query);
  }

  @Get('security-logs')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('security_logs:READ')
  @ApiBearerAuth()
  securityLogs(@Query() query: Record<string, string>) {
    return this.settings.getSecurityLogs(query);
  }

  @Get('roles')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('roles:READ')
  @ApiBearerAuth()
  getRoles() {
    return this.prisma.role.findMany({ include: { permissions: { include: { permission: true } } } });
  }

  @Get('permissions')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('permissions:READ')
  @ApiBearerAuth()
  getPermissions() {
    return this.prisma.permission.findMany();
  }

  @Post('backups')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('backups:CREATE')
  @ApiBearerAuth()
  createBackup() {
    return this.settings.createBackup();
  }

  @Get('backups')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('backups:READ')
  @ApiBearerAuth()
  listBackups() {
    return this.settings.listBackups();
  }
}
