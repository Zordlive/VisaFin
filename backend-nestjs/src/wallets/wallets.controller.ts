import { Controller, Get, Post, UseGuards, Request, Param, Body } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

type AuthRequest = ExpressRequest & { user: { id: number } };
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getWallets(@Request() req: AuthRequest) {
    return this.walletsService.getWalletsByUser(req.user.id);
  }

  @Post(':id/transfer_gains')
  @UseGuards(JwtAuthGuard)
  async transferGains(
    @Request() req: AuthRequest,
    @Param('id') walletId: string,
    @Body() data: any,
  ) {
    return this.walletsService.transferGains(
      req.user.id,
      parseInt(walletId),
      data.amount,
      data.source || 'gains',
    );
  }
}
