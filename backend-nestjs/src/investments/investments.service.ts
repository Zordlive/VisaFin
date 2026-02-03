import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async getUserInvestments(userId: number) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      include: { user: true, wallet: true },
    });

    return investments.map((inv) => ({
      id: inv.id,
      user_id: inv.userId,
      wallet_id: inv.walletId,
      amount: parseFloat(inv.amount.toString()),
      daily_rate: parseFloat(inv.dailyRate.toString()),
      accrued: parseFloat(inv.accrued.toString()),
      last_accrual: inv.lastAccrual,
      active: inv.active,
      created_at: inv.createdAt,
    }));
  }

  async createInvestment(userId: number, data: any) {
    if (!data.amount) {
      throw new BadRequestException('Amount is required');
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: {
        userId,
        currency: data.currency || 'USDT',
      },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const amount = new Decimal(String(data.amount));

    // Check if available balance is sufficient
    if (wallet.available.lt(amount)) {
      throw new BadRequestException('Insufficient available balance');
    }

    // Move from available to invested
    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        available: wallet.available.minus(amount),
        invested: wallet.invested.plus(amount),
      },
    });

    const investment = await this.prisma.investment.create({
      data: {
        userId,
        walletId: wallet.id,
        amount,
        dailyRate: new Decimal(String(data.daily_rate || 0.025)),
        lastAccrual: new Date(),
        active: true,
      },
      include: { user: true, wallet: true },
    });

    // Update investor total_invested
    const investor = await this.prisma.investor.findUnique({
      where: { userId },
    });

    if (investor) {
      await this.prisma.investor.update({
        where: { userId },
        data: {
          totalInvested: investor.totalInvested.plus(amount),
        },
      });
    }

    return this.formatInvestment(investment);
  }

  async accrueInvestment(userId: number, investmentId: number) {
    const investment = await this.prisma.investment.findFirst({
      where: { id: investmentId, userId },
      include: { wallet: true },
    });

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    if (!investment.active) {
      throw new BadRequestException('Investment is not active');
    }

    // Calculate accrual
    const now = new Date();
    const lastAccrual = investment.lastAccrual || investment.createdAt;
    const daysPassed = Math.floor(
      (now.getTime() - lastAccrual.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysPassed < 1) {
      throw new BadRequestException('Cannot accrue before 1 day has passed');
    }

    const dailyAccrual = investment.amount.times(investment.dailyRate);
    const totalAccrual = dailyAccrual.times(daysPassed);

    const updatedInvestment = await this.prisma.investment.update({
      where: { id: investmentId },
      data: {
        accrued: investment.accrued.plus(totalAccrual),
        lastAccrual: now,
      },
      include: { wallet: true, user: true },
    });

    // Create transaction
    await this.prisma.transaction.create({
      data: {
        walletId: investment.walletId,
        amount: totalAccrual,
        type: 'interest',
      },
    });

    return this.formatInvestment(updatedInvestment);
  }

  async encashInvestment(userId: number, investmentId: number) {
    const investment = await this.prisma.investment.findFirst({
      where: { id: investmentId, userId },
      include: { wallet: true },
    });

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    if (!investment.active) {
      throw new BadRequestException('Investment is not active');
    }

    // First accrue
    const now = new Date();
    const lastAccrual = investment.lastAccrual || investment.createdAt;
    const daysPassed = Math.floor(
      (now.getTime() - lastAccrual.getTime()) / (1000 * 60 * 60 * 24),
    );

    let finalAccrued = investment.accrued;
    if (daysPassed >= 1) {
      const dailyAccrual = investment.amount.times(investment.dailyRate);
      const totalAccrual = dailyAccrual.times(daysPassed);
      finalAccrued = investment.accrued.plus(totalAccrual);
    }

    // Move accrued to gains
    const wallet = investment.wallet;
    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        gains: wallet.gains.plus(finalAccrued),
      },
    });

    // Mark investment as inactive
    const updatedInvestment = await this.prisma.investment.update({
      where: { id: investmentId },
      data: {
        active: false,
        accrued: new Decimal(0),
      },
      include: { wallet: true, user: true },
    });

    // Create encash transaction
    await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount: finalAccrued,
        type: 'encash',
      },
    });

    return this.formatInvestment(updatedInvestment);
  }

  private formatInvestment(inv: any) {
    return {
      id: inv.id,
      user_id: inv.userId,
      wallet_id: inv.walletId,
      amount: parseFloat(inv.amount.toString()),
      daily_rate: parseFloat(inv.dailyRate.toString()),
      accrued: parseFloat(inv.accrued.toString()),
      last_accrual: inv.lastAccrual,
      active: inv.active,
      created_at: inv.createdAt,
    };
  }
}
