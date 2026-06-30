import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async salesSummary(query: Record<string, string>) {
    const where: Record<string, unknown> = {};
    if (query.channel) where.channel = query.channel;
    if (query.sellerId) where.sellerId = query.sellerId;

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        ticket: { include: { raffle: true } },
        seller: { select: { firstName: true, lastName: true } },
      },
    });

    const online = sales.filter((s) => s.channel === 'ONLINE');
    const offline = sales.filter((s) => s.channel === 'OFFLINE');

    return {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + Number(s.amount), 0),
      online: { count: online.length, revenue: online.reduce((s, x) => s + Number(x.amount), 0) },
      offline: { count: offline.length, revenue: offline.reduce((s, x) => s + Number(x.amount), 0) },
      sales,
    };
  }

  async sellerPerformance() {
    const sellers = await this.prisma.userRole.findMany({
      where: { role: { code: 'COMMUNITY_SELLER' } },
      include: { user: true },
    });

    const results = [];
    for (const { user } of sellers) {
      const tickets = await this.prisma.ticket.findMany({ where: { sellerId: user.id } });
      const sold = tickets.filter((t) => t.status === 'SOLD');
      const sales = await this.prisma.sale.findMany({ where: { sellerId: user.id } });
      const revenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);

      results.push({
        seller: { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email },
        assigned: tickets.length,
        sold: sold.length,
        revenue,
        performance: tickets.length > 0 ? (sold.length / tickets.length) * 100 : 0,
      });
    }

    return results;
  }

  async ticketInventory(raffleId?: string) {
    const where = raffleId ? { raffleId } : {};
    const tickets = await this.prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return tickets;
  }

  async financialReconciliation() {
    const [payments, sales, wallets] = await Promise.all([
      this.prisma.payment.findMany({ where: { status: 'COMPLETED' } }),
      this.prisma.sale.findMany(),
      this.prisma.wallet.findMany(),
    ]);

    return {
      totalPayments: payments.reduce((s, p) => s + Number(p.amount), 0),
      totalSales: sales.reduce((s, x) => s + Number(x.amount), 0),
      totalWalletBalance: wallets.reduce((s, w) => s + Number(w.balance), 0),
      paymentCount: payments.length,
      saleCount: sales.length,
    };
  }

  exportCsv(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) return { csv: '', filename };
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
    );
    return { csv: [headers.join(','), ...rows].join('\n'), filename };
  }
}
