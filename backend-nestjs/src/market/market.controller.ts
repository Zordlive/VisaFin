import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('api/market')
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Get('offers')
  async getOffers(@Query('status') status?: string) {
    return this.marketService.getOffers(status);
  }

  @Get('offers/:id')
  async getOffer(@Query('id') id: string) {
    return this.marketService.getOffer(parseInt(id));
  }
}
