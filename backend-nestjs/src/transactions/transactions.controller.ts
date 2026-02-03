import { Controller, Get, Delete, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

type AuthRequest = ExpressRequest & { user: { id: number } };
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getTransactions(@Request() req: AuthRequest) {
    return this.transactionsService.getTransactionsByUser(req.user.id);
  }

  @Delete('clear')
  @UseGuards(JwtAuthGuard)
  async clearHistory(@Request() req: AuthRequest) {
    return this.transactionsService.clearUserTransactions(req.user.id);
  }
}
