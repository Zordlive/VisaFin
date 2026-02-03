import { Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

type AuthRequest = ExpressRequest & { user: { id: number } };
import { CryptoService } from './crypto.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/crypto')
export class CryptoController {
  constructor(private cryptoService: CryptoService) {}

  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  async getCryptoAddresses(@Request() req: AuthRequest) {
    return this.cryptoService.getUserCryptoAddresses(req.user.id);
  }

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  async addCryptoAddress(@Request() req: AuthRequest, @Body() data: any) {
    return this.cryptoService.addCryptoAddress(req.user.id, data);
  }
}
