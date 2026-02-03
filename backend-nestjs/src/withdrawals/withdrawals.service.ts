import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, PrismaClient, Withdrawal } from '@prisma/client';

@Injectable()
export class WithdrawalsService {
  constructor(private prismaService: PrismaService) {}

  private get prisma(): PrismaClient {
    return this.prismaService;
  }

  async getUserWithdrawals(userId: number) {
    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return withdrawals.map((w: Withdrawal) => ({
      id: w.id,
      amount: parseFloat(w.amount.toString()),
      status: w.status,
      created_at: w.createdAt,
      updated_at: w.updatedAt,
    }));
  }

  async createWithdrawal(userId: number, data: any) {
    if (!data.amount) {
      throw new BadRequestException('Amount is required');
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, currency: data.currency || 'USDT' },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const amount = new Prisma.Decimal(String(data.amount));

    if (wallet.available.lt(amount)) {
      throw new BadRequestException('Insufficient available balance');
    }

    // Deduct from available
    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        available: wallet.available.minus(amount),
      },
    });

    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        amount,
        status: 'pending',
      },
    });

    // Create transaction
    await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'withdraw',
      },
    });

    return {
      id: withdrawal.id,
      amount: parseFloat(withdrawal.amount.toString()),
      status: withdrawal.status,
      created_at: withdrawal.createdAt,
    };
  }
}
