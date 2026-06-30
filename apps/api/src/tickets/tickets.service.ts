import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { paginate, paginatedResponse } from '../common/decorators';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findBooks(query: Record<string, string>) {
    const { page, limit, skip } = paginate(query);
    const where: Prisma.TicketBookWhereInput = {};
    if (query.raffleId) where.raffleId = query.raffleId;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.status) where.status = query.status as never;

    const [data, total] = await Promise.all([
      this.prisma.ticketBook.findMany({
        where,
        skip,
        take: limit,
        include: { seller: { select: { id: true, firstName: true, lastName: true, email: true } }, raffle: true },
      }),
      this.prisma.ticketBook.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async createBook(data: {
    raffleId: string;
    bookNumber: string;
    startTicketNumber: number;
    endTicketNumber: number;
    sellerId?: string;
  }, userId?: string) {
    if (data.endTicketNumber < data.startTicketNumber) {
      throw new BadRequestException('End ticket number must be >= start');
    }

    const book = await this.prisma.ticketBook.create({
      data: {
        raffleId: data.raffleId,
        bookNumber: data.bookNumber,
        startTicketNumber: data.startTicketNumber,
        endTicketNumber: data.endTicketNumber,
        sellerId: data.sellerId,
        status: data.sellerId ? 'ASSIGNED' : 'AVAILABLE',
        assignedAt: data.sellerId ? new Date() : undefined,
      },
    });

    const raffle = await this.prisma.raffle.findUnique({ where: { id: data.raffleId } });
    const round = await this.prisma.raffleRound.findFirst({ where: { raffleId: data.raffleId } });

    for (let num = data.startTicketNumber; num <= data.endTicketNumber; num++) {
      await this.prisma.ticket.upsert({
        where: { raffleId_ticketNumber: { raffleId: data.raffleId, ticketNumber: num } },
        update: { bookId: book.id, status: data.sellerId ? 'ASSIGNED' : 'UNSOLD' },
        create: {
          raffleId: data.raffleId,
          roundId: round?.id,
          bookId: book.id,
          ticketNumber: num,
          status: data.sellerId ? 'ASSIGNED' : 'UNSOLD',
        },
      });
    }

    await this.audit.log({ userId, action: 'CREATE', entity: 'ticket_book', entityId: book.id, newValue: book });
    return book;
  }

  async assignBook(bookId: string, sellerId: string, userId?: string) {
    const book = await this.prisma.ticketBook.update({
      where: { id: bookId },
      data: { sellerId, status: 'ASSIGNED', assignedAt: new Date() },
    });

    await this.prisma.ticket.updateMany({
      where: { bookId },
      data: { status: 'ASSIGNED', sellerId },
    });

    await this.audit.log({ userId, action: 'ASSIGN', entity: 'ticket_book', entityId: bookId, newValue: { sellerId } });
    return book;
  }

  async findTickets(query: Record<string, string>) {
    const { page, limit, skip } = paginate(query);
    const where: Prisma.TicketWhereInput = {};
    if (query.raffleId) where.raffleId = query.raffleId;
    if (query.bookId) where.bookId = query.bookId;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.buyerId) where.buyerId = query.buyerId;
    if (query.status) where.status = query.status as TicketStatus;

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        include: {
          raffle: true,
          buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus, userId?: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const ineligible = ['CANCELLED', 'LOST', 'RETURNED', 'VOIDED'];
    if (ineligible.includes(status) && ticket.status === 'SOLD') {
      throw new BadRequestException('Cannot change status of sold ticket to ' + status + ' without proper workflow');
    }

    const updated = await this.prisma.ticket.update({ where: { id: ticketId }, data: { status } });
    await this.audit.log({ userId, action: 'STATUS_CHANGE', entity: 'ticket', entityId: ticketId, oldValue: { status: ticket.status }, newValue: { status } });
    return updated;
  }

  async getSellerStats(sellerId: string) {
    const tickets = await this.prisma.ticket.findMany({ where: { sellerId } });
    const sold = tickets.filter((t) => t.status === 'SOLD');
    const assigned = tickets.filter((t) => ['ASSIGNED', 'SOLD', 'UNSOLD'].includes(t.status));

    const sales = await this.prisma.sale.findMany({ where: { sellerId, channel: 'OFFLINE' } });
    const moneyCollected = sales.reduce((sum, s) => sum + Number(s.amount), 0);

    const commissionRate = await this.getCommissionRate();
    const commission = moneyCollected * commissionRate;

    return {
      assigned: assigned.length,
      sold: sold.length,
      unsold: tickets.filter((t) => t.status === 'UNSOLD' || t.status === 'ASSIGNED').length,
      returned: tickets.filter((t) => t.status === 'RETURNED').length,
      cancelled: tickets.filter((t) => t.status === 'CANCELLED').length,
      lost: tickets.filter((t) => t.status === 'LOST').length,
      moneyCollected,
      commission,
      netRemittance: moneyCollected - commission,
      performance: assigned.length > 0 ? (sold.length / assigned.length) * 100 : 0,
    };
  }

  private async getCommissionRate() {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'commission_rate' } });
    return setting ? parseFloat(setting.value) : 0.1;
  }
}
