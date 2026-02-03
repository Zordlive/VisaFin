import { Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/crypto')
export class CryptoController {
  constructor(private cryptoService: CryptoService) {}

  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  async getCryptoAddresses(@Request() req) {
    return this.cryptoService.getUserCryptoAddresses(req.user.id);
  }

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  async addCryptoAddress(@Request() req, @Body() data: any) {
    return this.cryptoService.addCryptoAddress(req.user.id, data);
  }
}
