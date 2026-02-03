import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getWalletsByUser(userId: number) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
    });

    return wallets.map((w) => ({
      id: w.id,
      user_id: w.userId,
      currency: w.currency,
      available: parseFloat(w.available.toString()),
      pending: parseFloat(w.pending.toString()),
      gains: parseFloat(w.gains.toString()),
      sale_balance: parseFloat(w.saleBalance.toString()),
      invested: parseFloat(w.invested.toString()),
    }));
  }

  async transferGains(
    userId: number,
    walletId: number,
    amount: string | number,
    source: string = 'gains',
  ) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: parseInt(String(walletId)), userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const amt = new Decimal(String(amount));

    if (amt.lte(0)) {
      throw new BadRequestException('Amount must be positive');
    }

    if (source === 'gains') {
      if (wallet.gains.lt(amt)) {
        throw new BadRequestException('Insufficient gains');
      }

      const updatedWallet = await this.prisma.wallet.update({
        where: { id: walletId },
        data: {
          gains: wallet.gains.minus(amt),
          available: wallet.available.plus(amt),
        },
      });

      // Create transaction
      await this.prisma.transaction.create({
        data: {
          walletId,
          amount: amt,
          type: 'transfer',
        },
      });

      return this.formatWallet(updatedWallet);
    } else if (source === 'sale') {
      if (!wallet.saleBalance || wallet.saleBalance.lte(0)) {
        throw new BadRequestException('Insufficient sale balance');
      }

      // Check 30-day lock
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const withdrawable = await this.prisma.investment.aggregate({
        where: {
          walletId,
          active: true,
          createdAt: { lte: thirtyDaysAgo },
        },
        _sum: { amount: true },
      });

      const withdrawableAmount = withdrawable._sum.amount || new Decimal(0);

      if (withdrawableAmount.lt(amt)) {
        throw new BadRequestException(
          'Locked funds: only investments older than 30 days can be withdrawn',
        );
      }

      const updatedWallet = await this.prisma.wallet.update({
        where: { id: walletId },
        data: {
          saleBalance: wallet.saleBalance.minus(amt),
          available: wallet.available.plus(amt),
        },
      });

      await this.prisma.transaction.create({
        data: {
          walletId,
          amount: amt,
          type: 'transfer',
        },
      });

      return this.formatWallet(updatedWallet);
    } else {
      throw new BadRequestException('Invalid source');
    }
  }

  private formatWallet(wallet: any) {
    return {
      id: wallet.id,
      user_id: wallet.userId,
      currency: wallet.currency,
      available: parseFloat(wallet.available.toString()),
      pending: parseFloat(wallet.pending.toString()),
      gains: parseFloat(wallet.gains.toString()),
      sale_balance: parseFloat(wallet.saleBalance.toString()),
      invested: parseFloat(wallet.invested.toString()),
    };
  }
}
