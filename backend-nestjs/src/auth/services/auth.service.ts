import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TokenService } from './token.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
  ) {}

  async login(dto: LoginDto) {
    const identifier = (dto.email || dto.identifier || '').trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: { investor: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await this.tokenService.comparePasswords(
      dto.password,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.tokenService.generateTokens(user.id);
  }

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email or username already exists');
    }

    // Hash password
    const hashedPassword = await this.tokenService.hashPassword(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        firstName: dto.firstName || '',
        lastName: dto.lastName || '',
      },
      include: { investor: true },
    });

    // Create associated investor profile
    await this.prisma.investor.create({
      data: {
        userId: user.id,
        phone: null,
        totalInvested: 0,
        portfolioValue: 0,
        vipLevel: 0,
      },
    });

    // Create default wallet (USDT)
    await this.prisma.wallet.create({
      data: {
        userId: user.id,
        currency: 'USDT',
        available: 0,
        pending: 0,
        gains: 0,
        saleBalance: 0,
        invested: 0,
      },
    });

    // Create referral code
    const referralCode = `REF_${user.id}_${Date.now()}`.substring(0, 64);
    await this.prisma.referralCode.create({
      data: {
        code: referralCode,
        referrerId: user.id,
      },
    });

    return this.tokenService.generateTokens(user.id);
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.tokenService.verifyToken(refreshToken);
      return this.tokenService.generateTokens(decoded.sub);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

    async loginWithGoogle(googleToken: string) {
      try {
        // Verify token with Google
        const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: googleToken,
          audience: process.env.VITE_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          throw new BadRequestException('Invalid Google token');
        }

        // Check if user exists
        let user = await this.prisma.user.findUnique({
          where: { email: payload.email },
          include: { investor: true },
        });

        // Create user if doesn't exist
        if (!user) {
          // Generate random password for Google users
          const randomPassword = await this.tokenService.hashPassword(
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
          );

          user = await this.prisma.user.create({
            data: {
              email: payload.email,
              username: `google_${payload.sub}`,
              password: randomPassword,
              firstName: payload.given_name || '',
              lastName: payload.family_name || '',
            },
            include: { investor: true },
          });

          // Create associated investor profile
          await this.prisma.investor.create({
            data: {
              userId: user.id,
              phone: null,
              totalInvested: 0,
              portfolioValue: 0,
              vipLevel: 0,
            },
          });

          // Create default wallet (USDT)
          await this.prisma.wallet.create({
            data: {
              userId: user.id,
              currency: 'USDT',
              available: 0,
              pending: 0,
              gains: 0,
              saleBalance: 0,
              invested: 0,
            },
          });

          // Create referral code
          const referralCode = `REF_${user.id}_${Date.now()}`.substring(0, 64);
          await this.prisma.referralCode.create({
            data: {
              code: referralCode,
              referrerId: user.id,
            },
          });
        }

        return this.tokenService.generateTokens(user.id);
      } catch (error) {
        console.error('Google OAuth error:', error);
        throw new UnauthorizedException('Invalid Google token');
      }
    }
}
