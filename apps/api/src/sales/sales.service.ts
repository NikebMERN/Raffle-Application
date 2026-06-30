import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async recordOfflineSale(params: {
    ticketId: string;
    sellerId: string;
    buyerName?: string;
    amount: number;
  }, operatorId?: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: params.ticketId },
      include: { raffle: true },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === 'SOLD') throw new BadRequestException('Ticket already sold');
    if (!['ASSIGNED', 'UNSOLD'].includes(ticket.status)) {
      throw new BadRequestException(`Cannot sell ticket with status ${ticket.status}`);
    }

    const sale = await this.prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id: params.ticketId },
        data: {
          status: 'SOLD',
          saleChannel: 'OFFLINE',
          sellerId: params.sellerId,
          soldAt: new Date(),
          price: params.amount,
        },
      });

      const saleRecord = await tx.sale.create({
        data: {
          ticketId: params.ticketId,
          sellerId: params.sellerId,
          channel: 'OFFLINE',
          amount: params.amount,
        },
      });

      return { ticket: updatedTicket, sale: saleRecord };
    });

    await this.audit.log({
      userId: operatorId,
      action: 'OFFLINE_SALE',
      entity: 'sale',
      entityId: sale.sale.id,
      newValue: sale,
    });

    return sale;
  }

  async findAll(query: Record<string, string>) {
    const where: Record<string, unknown> = {};
    if (query.channel) where.channel = query.channel;
    if (query.sellerId) where.sellerId = query.sellerId;

    return this.prisma.sale.findMany({
      where,
      include: {
        ticket: { include: { raffle: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        seller: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
