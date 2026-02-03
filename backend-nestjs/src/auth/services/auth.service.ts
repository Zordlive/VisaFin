import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TokenService } from './token.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
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
      const decoded = this.tokenService.jwt.verify(refreshToken);
      return this.tokenService.generateTokens(decoded.sub);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
