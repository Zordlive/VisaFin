import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CryptoService {
  constructor(private prisma: PrismaService) {}

  async getUserCryptoAddresses(userId: number) {
    const addresses = await this.prisma.cryptoAddress.findMany({
      where: { userId },
    });

    return addresses.map((a) => ({
      id: a.id,
      coin: a.coin,
      address: a.address,
      created_at: a.createdAt,
    }));
  }

  async addCryptoAddress(userId: number, data: any) {
    if (!data.coin || !data.address) {
      throw new BadRequestException('Coin and address are required');
    }

    const address = await this.prisma.cryptoAddress.create({
      data: {
        userId,
        coin: data.coin,
        address: data.address,
      },
    });

    return {
      id: address.id,
      coin: address.coin,
      address: address.address,
      created_at: address.createdAt,
    };
  }
}
