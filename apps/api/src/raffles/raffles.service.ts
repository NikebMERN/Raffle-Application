import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, RaffleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { paginate, paginatedResponse } from '../common/decorators';

@Injectable()
export class RafflesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(query: Record<string, string>, publicOnly = false) {
    const { page, limit, skip } = paginate(query);
    const where: Prisma.RaffleWhereInput = {};

    if (publicOnly) where.status = 'ACTIVE';
    if (query.status) where.status = query.status as RaffleStatus;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.raffle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: { rounds: { include: { prizes: true } } },
      }),
      this.prisma.raffle.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      include: {
        rounds: { include: { prizes: true, draws: { include: { winnerTicket: true, prize: true } } } },
        _count: { select: { tickets: true } },
      },
    });
    if (!raffle) throw new NotFoundException('Raffle not found');
    return raffle;
  }

  async create(data: Prisma.RaffleCreateInput, userId?: string) {
    const raffle = await this.prisma.raffle.create({ data });
    await this.audit.log({ userId, action: 'CREATE', entity: 'raffle', entityId: raffle.id, newValue: raffle });
    return raffle;
  }

  async update(id: string, data: Prisma.RaffleUpdateInput, userId?: string) {
    const existing = await this.findOne(id);
    const raffle = await this.prisma.raffle.update({ where: { id }, data });
    await this.audit.log({ userId, action: 'UPDATE', entity: 'raffle', entityId: id, oldValue: existing, newValue: raffle });
    return raffle;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (existing.status === 'ACTIVE') throw new BadRequestException('Cannot delete active raffle');
    await this.prisma.raffle.delete({ where: { id } });
    await this.audit.log({ userId, action: 'DELETE', entity: 'raffle', entityId: id, oldValue: existing });
    return { message: 'Raffle deleted' };
  }

  async createRound(raffleId: string, data: { roundNumber: number; title: string; drawDate?: Date }) {
    return this.prisma.raffleRound.create({
      data: { raffleId, ...data, status: 'OPEN' },
    });
  }

  async createPrize(roundId: string, data: { name: string; description?: string; value: number; position: number }) {
    return this.prisma.prize.create({ data: { roundId, ...data } });
  }
}
