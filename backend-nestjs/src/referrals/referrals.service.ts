import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  async getUserReferrals(userId: number) {
    const referralCode = await this.prisma.referralCode.findFirst({
      where: { referrerId: userId },
      include: {
        referrals: {
          include: {
            referredUser: true,
          },
        },
      },
    });

    if (!referralCode) {
      return {
        code: null,
        referrals: [],
      };
    }

    return {
      code: referralCode.code,
      referrals: referralCode.referrals.map((ref) => ({
        id: ref.id,
        referred_user: ref.referredUser ? {
          id: ref.referredUser.id,
          username: ref.referredUser.username,
          email: ref.referredUser.email,
        } : null,
        generation: ref.generation,
        status: ref.status,
        created_at: ref.createdAt,
      })),
    };
  }
}
