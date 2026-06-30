import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DrawsService {
  private redis: Redis | null = null;

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private config: ConfigService,
  ) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
      } catch {
        this.redis = null;
      }
    }
  }

  async executeDraw(roundId: string, prizeId: string, operatorId: string) {
    const lockKey = `draw:lock:${roundId}`;
    if (this.redis) {
      const acquired = await this.redis.set(lockKey, '1', 'EX', 60, 'NX');
      if (!acquired) throw new ConflictException('Draw already in progress for this round');
    }

    try {
      const round = await this.prisma.raffleRound.findUnique({
        where: { id: roundId },
        include: { raffle: true, prizes: true },
      });

      if (!round) throw new BadRequestException('Round not found');
      if (round.status === 'DRAWN') throw new BadRequestException('Round already drawn');

      const prize = round.prizes.find((p) => p.id === prizeId);
      if (!prize) throw new BadRequestException('Prize not found for this round');

      const existingDraw = await this.prisma.draw.findFirst({ where: { roundId, prizeId } });
      if (existingDraw) throw new BadRequestException('Draw already completed for this prize');

      const eligibleTickets = await this.prisma.ticket.findMany({
        where: {
          raffleId: round.raffleId,
          roundId,
          status: 'SOLD',
        },
        include: { buyer: true },
      });

      if (eligibleTickets.length === 0) {
        throw new BadRequestException('No eligible tickets for draw');
      }

      const sortedIds = eligibleTickets.map((t) => t.id).sort();
      const participantHash = createHash('sha256').update(sortedIds.join(',')).digest('hex');

      const winnerIndex = randomInt(0, eligibleTickets.length);
      const winnerTicket = eligibleTickets[winnerIndex];

      const draw = await this.prisma.$transaction(async (tx) => {
        const drawRecord = await tx.draw.create({
          data: {
            roundId,
            prizeId,
            winnerTicketId: winnerTicket.id,
            drawnById: operatorId,
            method: 'CRYPTO_RANDOM',
            participantCount: eligibleTickets.length,
          },
        });

        await tx.drawAuditReport.create({
          data: {
            drawId: drawRecord.id,
            participantHash,
            rngMethod: 'crypto.randomInt',
            operatorId,
            reportJson: {
              eligibleTicketIds: sortedIds,
              winnerIndex,
              winnerTicketId: winnerTicket.id,
              winnerTicketNumber: winnerTicket.ticketNumber,
              participantCount: eligibleTickets.length,
              timestamp: new Date().toISOString(),
              excludedStatuses: ['CANCELLED', 'LOST', 'RETURNED', 'VOIDED'],
            },
          },
        });

        await tx.raffleRound.update({
          where: { id: roundId },
          data: { status: 'DRAWN' },
        });

        return drawRecord;
      });

      await this.audit.log({
        userId: operatorId,
        action: 'DRAW',
        entity: 'draw',
        entityId: draw.id,
        newValue: { roundId, prizeId, winnerTicketId: winnerTicket.id, participantCount: eligibleTickets.length },
      });

      if (winnerTicket.buyerId) {
        await this.notifications.sendToUser(winnerTicket.buyerId, {
          channel: 'EMAIL',
          title: 'Congratulations! You Won!',
          body: `Your ticket #${winnerTicket.ticketNumber} won ${prize.name}!`,
          templateName: 'draw_winner',
        });
      }

      return {
        draw,
        winner: {
          ticketId: winnerTicket.id,
          ticketNumber: winnerTicket.ticketNumber,
          buyer: winnerTicket.buyer,
        },
        participantCount: eligibleTickets.length,
        auditHash: participantHash,
      };
    } finally {
      if (this.redis) await this.redis.del(lockKey);
    }
  }

  async getDraws(query: Record<string, string>) {
    const where: Record<string, unknown> = {};
    if (query.roundId) where.roundId = query.roundId;

    return this.prisma.draw.findMany({
      where,
      include: {
        prize: true,
        winnerTicket: { include: { buyer: true } },
        auditReport: true,
        drawnBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { drawnAt: 'desc' },
    });
  }

  async getAuditReport(drawId: string) {
    return this.prisma.drawAuditReport.findUnique({
      where: { drawId },
      include: { draw: { include: { prize: true, winnerTicket: true } } },
    });
  }
}
