import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async getTransactionsByUser(userId: number) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        wallet: { userId },
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((tx) => ({
      id: tx.id,
      wallet_id: tx.walletId,
      amount: parseFloat(tx.amount.toString()),
      type: tx.type,
      created_at: tx.createdAt,
    }));
  }
}
