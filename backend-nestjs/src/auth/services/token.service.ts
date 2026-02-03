import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async generateTokens(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { investor: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const payload = {
      sub: userId,
      email: user.email,
      username: user.username,
    };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // For refresh token, we could use a longer expiry
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        is_staff: user.isStaff,
        vip_level: user.investor?.vipLevel || 0,
        vip_since: user.investor?.vipSince,
        total_invested: user.investor?.totalInvested || 0,
        phone: user.investor?.phone,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  verifyToken(token: string) {
    return this.jwt.verify(token);
  }
}
