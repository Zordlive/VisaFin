import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserWithDetails(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        investor: true,
        wallets: true,
        referralCode: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
      is_staff: user.isStaff,
      phone: user.investor?.phone,
      vip_level: user.investor?.vipLevel || 0,
      vip_since: user.investor?.vipSince,
      total_invested: user.investor?.totalInvested || 0,
      portfolio_value: user.investor?.portfolioValue || 0,
      referral_code: user.referralCode?.code,
      wallets: user.wallets.map((w) => ({
        id: w.id,
        currency: w.currency,
        available: parseFloat(w.available.toString()),
        pending: parseFloat(w.pending.toString()),
        gains: parseFloat(w.gains.toString()),
        sale_balance: parseFloat(w.saleBalance.toString()),
        invested: parseFloat(w.invested.toString()),
      })),
    };
  }

  async updateUser(userId: number, data: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.first_name || data.firstName,
        lastName: data.last_name || data.lastName,
      },
      include: { investor: true },
    });

    if (data.phone) {
      await this.prisma.investor.update({
        where: { userId },
        data: {
          phone: data.phone,
        },
      });
    }

    return this.getUserWithDetails(userId);
  }
}
