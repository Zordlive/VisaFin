import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getTransactions(@Request() req) {
    return this.transactionsService.getTransactionsByUser(req.user.id);
  }
}
