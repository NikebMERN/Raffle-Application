import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  @RequirePermissions('notifications:READ')
  findAll(@Query() query: Record<string, string>) {
    return this.notifications.findAll(query);
  }

  @Get('my')
  getMy(@CurrentUser('id') userId: string) {
    return this.notifications.findAll({ userId });
  }

  @Get('templates')
  @RequirePermissions('templates:READ')
  getTemplates() {
    return this.notifications.getTemplates();
  }

  @Post('templates')
  @RequirePermissions('templates:CREATE')
  createTemplate(@Body() body: Record<string, unknown>) {
    return this.notifications.createTemplate(body as never);
  }

  @Patch('templates/:id')
  @RequirePermissions('templates:UPDATE')
  updateTemplate(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.notifications.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @RequirePermissions('templates:DELETE')
  deleteTemplate(@Param('id') id: string) {
    return this.notifications.deleteTemplate(id);
  }
}
