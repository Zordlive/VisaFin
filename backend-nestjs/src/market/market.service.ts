import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class MarketService {
  constructor(private prisma: PrismaService) {}

  async getOffers(status?: string) {
    const offers = await this.prisma.marketOffer.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });

    return offers.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      price_offered: parseFloat(o.priceOffered.toString()),
      status: o.status,
      expires_at: o.expiresAt,
      created_at: o.createdAt,
    }));
  }

  async getOffer(id: number) {
    const offer = await this.prisma.marketOffer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return {
      id: offer.id,
      title: offer.title,
      description: offer.description,
      price_offered: parseFloat(offer.priceOffered.toString()),
      status: offer.status,
      expires_at: offer.expiresAt,
      created_at: offer.createdAt,
    };
  }
}
