import { Controller, Post, Get, UseGuards, Request, Body, Param } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

type AuthRequest = ExpressRequest & { user: { id: number } };
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/deposits')
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiateDeposit(@Request() req: AuthRequest, @Body() data: any) {
    return this.depositsService.initiateDeposit(req.user.id, data);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async getDepositStatus(@Request() req: AuthRequest, @Param('id') depositId: string) {
    return this.depositsService.getDepositStatus(req.user.id, parseInt(depositId));
  }
}
