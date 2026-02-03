import { Controller, Post, Get, UseGuards, Request, Body, Param } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

type AuthRequest = ExpressRequest & { user: { id: number } };
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/investments')
export class InvestmentsController {
  constructor(private investmentsService: InvestmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getInvestments(@Request() req: AuthRequest) {
    return this.investmentsService.getUserInvestments(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createInvestment(@Request() req: AuthRequest, @Body() data: any) {
    return this.investmentsService.createInvestment(req.user.id, data);
  }

  @Post(':id/accrue')
  @UseGuards(JwtAuthGuard)
  async accrueInvestment(@Request() req: AuthRequest, @Param('id') investmentId: string) {
    return this.investmentsService.accrueInvestment(req.user.id, parseInt(investmentId));
  }

  @Post(':id/encash')
  @UseGuards(JwtAuthGuard)
  async encashInvestment(@Request() req: AuthRequest, @Param('id') investmentId: string) {
    return this.investmentsService.encashInvestment(req.user.id, parseInt(investmentId));
  }
}
