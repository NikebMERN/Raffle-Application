import { Controller, Get, Patch, Param, Body, Query, UseGuards, Post, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/decorators';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @RequirePermissions('users:READ')
  findAll(@Query() query: Record<string, string>) {
    return this.users.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('users:READ')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('users:UPDATE')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.users.update(id, body);
  }

  @Post(':id/roles/:roleId')
  @RequirePermissions('users:UPDATE')
  assignRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.users.assignRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions('users:UPDATE')
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.users.removeRole(id, roleId);
  }
}
