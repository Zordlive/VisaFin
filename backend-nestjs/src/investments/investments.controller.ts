import { Controller, Post, Get, UseGuards, Request, Body, Param } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/investments')
export class InvestmentsController {
  constructor(private investmentsService: InvestmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getInvestments(@Request() req) {
    return this.investmentsService.getUserInvestments(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createInvestment(@Request() req, @Body() data: any) {
    return this.investmentsService.createInvestment(req.user.id, data);
  }

  @Post(':id/accrue')
  @UseGuards(JwtAuthGuard)
  async accrueInvestment(@Request() req, @Param('id') investmentId: string) {
    return this.investmentsService.accrueInvestment(req.user.id, parseInt(investmentId));
  }

  @Post(':id/encash')
  @UseGuards(JwtAuthGuard)
  async encashInvestment(@Request() req, @Param('id') investmentId: string) {
    return this.investmentsService.encashInvestment(req.user.id, parseInt(investmentId));
  }
}
