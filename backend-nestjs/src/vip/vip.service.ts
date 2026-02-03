import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class VipService {
  constructor(private prisma: PrismaService) {}

  async getAllVipLevels() {
    const levels = await this.prisma.vIPLevel.findMany({
      orderBy: { level: 'asc' },
    });

    return levels.map((l) => ({
      id: l.id,
      level: l.level,
      title: l.title,
      price: parseFloat(l.price.toString()),
      percentage: parseFloat(l.percentage.toString()),
      daily_gains: parseFloat(l.dailyGains.toString()),
      delay_days: l.delayDays,
      description: l.description,
    }));
  }

  async getUserVipSubscriptions(userId: number) {
    const subscriptions = await this.prisma.userVIPSubscription.findMany({
      where: { userId },
      include: { vipLevel: true },
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      vip_level: {
        id: sub.vipLevel.id,
        level: sub.vipLevel.level,
        title: sub.vipLevel.title,
        price: parseFloat(sub.vipLevel.price.toString()),
      },
      active: sub.active,
      purchased_at: sub.purchasedAt,
    }));
  }

  async purchaseVipLevel(userId: number, vipLevelId: number) {
    const vipLevel = await this.prisma.vIPLevel.findUnique({
      where: { id: vipLevelId },
    });

    if (!vipLevel) {
      throw new BadRequestException('VIP level not found');
    }

    // Check if already subscribed
    const existing = await this.prisma.userVIPSubscription.findFirst({
      where: { userId, vipLevelId },
    });

    if (existing && existing.active) {
      throw new BadRequestException('Already subscribed to this VIP level');
    }

    const subscription = await this.prisma.userVIPSubscription.create({
      data: {
        userId,
        vipLevelId,
        active: true,
      },
      include: { vipLevel: true },
    });

    return {
      id: subscription.id,
      vip_level: {
        id: vipLevel.id,
        level: vipLevel.level,
        title: vipLevel.title,
        price: parseFloat(vipLevel.price.toString()),
      },
      active: subscription.active,
      purchased_at: subscription.purchasedAt,
    };
  }
}
