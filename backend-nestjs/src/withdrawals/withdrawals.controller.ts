import { Controller, Post, Get, UseGuards, Request, Body } from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/withdrawals')
export class WithdrawalsController {
  constructor(private withdrawalsService: WithdrawalsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getWithdrawals(@Request() req) {
    return this.withdrawalsService.getUserWithdrawals(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createWithdrawal(@Request() req, @Body() data: any) {
    return this.withdrawalsService.createWithdrawal(req.user.id, data);
  }
}
