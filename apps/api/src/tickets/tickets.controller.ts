import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TicketsService } from './tickets.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators';

@ApiTags('tickets')
@Controller()
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Get('tickets/public')
  findPublicTickets(@Query() query: Record<string, string>) {
    return this.tickets.findTickets({ ...query, status: query.status || 'UNSOLD' });
  }

  @Get('ticket-books')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('ticket_books:READ')
  @ApiBearerAuth()
  findBooks(@Query() query: Record<string, string>) {
    return this.tickets.findBooks(query);
  }

  @Post('ticket-books')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('ticket_books:CREATE')
  @ApiBearerAuth()
  createBook(@Body() body: Record<string, unknown>, @CurrentUser('id') userId: string) {
    return this.tickets.createBook(body as never, userId);
  }

  @Post('ticket-books/:id/assign')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('ticket_books:UPDATE')
  @ApiBearerAuth()
  assignBook(@Param('id') id: string, @Body() body: { sellerId: string }, @CurrentUser('id') userId: string) {
    return this.tickets.assignBook(id, body.sellerId, userId);
  }

  @Get('tickets')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('tickets:READ')
  @ApiBearerAuth()
  findTickets(@Query() query: Record<string, string>) {
    return this.tickets.findTickets(query);
  }

  @Patch('tickets/:id/status')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('tickets:UPDATE')
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @Body() body: { status: string }, @CurrentUser('id') userId: string) {
    return this.tickets.updateTicketStatus(id, body.status as never, userId);
  }

  @Get('sellers/:sellerId/stats')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('sellers:READ')
  @ApiBearerAuth()
  sellerStats(@Param('sellerId') sellerId: string) {
    return this.tickets.getSellerStats(sellerId);
  }
}
