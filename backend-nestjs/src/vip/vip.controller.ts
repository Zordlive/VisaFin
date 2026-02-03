import { Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

type AuthRequest = ExpressRequest & { user: { id: number } };
import { VipService } from './vip.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/vip')
export class VipController {
  constructor(private vipService: VipService) {}

  @Get('levels')
  async getVipLevels() {
    return this.vipService.getAllVipLevels();
  }

  @Get('subscriptions/me')
  @UseGuards(JwtAuthGuard)
  async getUserSubscriptions(@Request() req: AuthRequest) {
    return this.vipService.getUserVipSubscriptions(req.user.id);
  }

  @Post('subscriptions/purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseVipLevel(@Request() req: AuthRequest, @Body() data: any) {
    return this.vipService.purchaseVipLevel(req.user.id, data.vip_level_id);
  }
}
