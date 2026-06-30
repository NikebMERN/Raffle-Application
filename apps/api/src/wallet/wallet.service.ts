import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
        include: { transactions: true },
      });
    }

    return wallet;
  }

  async credit(userId: string, amount: number, reference: string, description?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      const newBalance = Number(wallet.balance) + amount;
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          amount,
          balanceAfter: newBalance,
          reference,
          description,
        },
      });

      return updated;
    });
  }

  async debit(userId: string, amount: number, reference: string, description?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (Number(wallet.balance) < amount) throw new BadRequestException('Insufficient balance');

      const newBalance = Number(wallet.balance) - amount;
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount,
          balanceAfter: newBalance,
          reference,
          description,
        },
      });

      return updated;
    });
  }

  async getAllWallets() {
    return this.prisma.wallet.findMany({
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }
}
