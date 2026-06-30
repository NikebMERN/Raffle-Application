import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { paginate, paginatedResponse } from '../common/decorators';
import { CreateRewardConfigDto, UpdateRewardConfigDto, RewardTierDto } from './rewards.dto';

export interface RewardTier {
  position: number;
  name: string;
  amount: number;
  winnersCount: number;
  description?: string;
}

@Injectable()
export class RewardsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private calculateTotalPool(rewards: RewardTier[]): number {
    return rewards.reduce((sum, r) => sum + r.amount * r.winnersCount, 0);
  }

  private validateWinnersCount(numberOfWinners: number, rewards: RewardTier[]) {
    const totalSlots = rewards.reduce((sum, r) => sum + r.winnersCount, 0);
    if (totalSlots !== numberOfWinners) {
      throw new BadRequestException(
        `Reward tiers winnersCount (${totalSlots}) must equal numberOfWinners (${numberOfWinners})`,
      );
    }
  }

  async findAll(query: Record<string, string>) {
    const { page, limit, skip } = paginate(query);
    const where: Prisma.RewardConfigurationWhereInput = {};

    if (query.raffleId) where.raffleId = query.raffleId;
    if (query.roundId) where.roundId = query.roundId;
    if (query.isActive === 'true') where.isActive = true;
    if (query.isActive === 'false') where.isActive = false;
    if (query.search) {
      where.name = { contains: query.search };
    }

    const [data, total] = await Promise.all([
      this.prisma.rewardConfiguration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          raffle: { select: { id: true, title: true } },
          round: { select: { id: true, title: true, roundNumber: true } },
        },
      }),
      this.prisma.rewardConfiguration.count({ where }),
    ]);

    return paginatedResponse(
      data.map((item) => this.formatConfig(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string) {
    const config = await this.prisma.rewardConfiguration.findUnique({
      where: { id },
      include: {
        raffle: { select: { id: true, title: true } },
        round: { select: { id: true, title: true, roundNumber: true } },
      },
    });
    if (!config) throw new NotFoundException('Reward configuration not found');
    return this.formatConfig(config);
  }

  async create(dto: CreateRewardConfigDto, userId?: string) {
    this.validateWinnersCount(dto.numberOfWinners, dto.rewards);
    const totalRewardPool = this.calculateTotalPool(dto.rewards);

    const config = await this.prisma.rewardConfiguration.create({
      data: {
        name: dto.name,
        raffleId: dto.raffleId,
        roundId: dto.roundId,
        numberOfWinners: dto.numberOfWinners,
        totalRewardPool,
        rewards: dto.rewards as unknown as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
      },
      include: {
        raffle: { select: { id: true, title: true } },
        round: { select: { id: true, title: true } },
      },
    });

    await this.audit.log({
      userId,
      action: 'CREATE',
      entity: 'reward_configuration',
      entityId: config.id,
      newValue: config,
    });

    return this.formatConfig(config);
  }

  async update(id: string, dto: UpdateRewardConfigDto, userId?: string) {
    const existing = await this.findOne(id);
    const rewards = (dto.rewards ?? existing.rewards) as RewardTier[];
    const numberOfWinners = dto.numberOfWinners ?? existing.numberOfWinners;

    if (dto.rewards || dto.numberOfWinners) {
      this.validateWinnersCount(numberOfWinners, rewards);
    }

    const totalRewardPool = this.calculateTotalPool(rewards);

    const config = await this.prisma.rewardConfiguration.update({
      where: { id },
      data: {
        name: dto.name,
        raffleId: dto.raffleId,
        roundId: dto.roundId,
        numberOfWinners,
        totalRewardPool,
        rewards: rewards as unknown as Prisma.InputJsonValue,
        isActive: dto.isActive,
      },
      include: {
        raffle: { select: { id: true, title: true } },
        round: { select: { id: true, title: true } },
      },
    });

    await this.audit.log({
      userId,
      action: 'UPDATE',
      entity: 'reward_configuration',
      entityId: id,
      oldValue: existing,
      newValue: config,
    });

    return this.formatConfig(config);
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.rewardConfiguration.delete({ where: { id } });
    await this.audit.log({
      userId,
      action: 'DELETE',
      entity: 'reward_configuration',
      entityId: id,
      oldValue: existing,
    });
    return { message: 'Reward configuration deleted' };
  }

  async syncPrizesFromRewards(id: string, userId?: string) {
    const config = await this.findOne(id);
    if (!config.roundId) {
      throw new BadRequestException('Reward configuration must be linked to a round to sync prizes');
    }

    const rewards = config.rewards as RewardTier[];
    const created = [];

    for (const tier of rewards) {
      for (let i = 0; i < tier.winnersCount; i++) {
        const prize = await this.prisma.prize.create({
          data: {
            roundId: config.roundId!,
            name: tier.winnersCount > 1 ? `${tier.name} (${i + 1})` : tier.name,
            description: tier.description,
            value: tier.amount,
            position: tier.position,
          },
        });
        created.push(prize);
      }
    }

    await this.audit.log({
      userId,
      action: 'SYNC_PRIZES',
      entity: 'reward_configuration',
      entityId: id,
      newValue: { prizesCreated: created.length },
    });

    return { message: `Created ${created.length} prizes from reward configuration`, prizes: created };
  }

  private formatConfig(config: {
    id: string;
    name: string;
    raffleId: string | null;
    roundId: string | null;
    numberOfWinners: number;
    totalRewardPool: number;
    rewards: unknown;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    raffle?: { id: string; title: string } | null;
    round?: { id: string; title: string; roundNumber?: number } | null;
  }) {
    const rewards = config.rewards as RewardTier[];
    return {
      ...config,
      rewards,
      perWinnerBreakdown: rewards.map((r) => ({
        position: r.position,
        name: r.name,
        amountPerPerson: r.amount,
        winnersCount: r.winnersCount,
        subtotal: r.amount * r.winnersCount,
      })),
    };
  }
}
