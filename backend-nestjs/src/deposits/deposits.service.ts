import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService) {}

  async initiateDeposit(userId: number, data: any) {
    if (!data.amount) {
      throw new BadRequestException('Amount is required');
    }

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        amount: new Decimal(String(data.amount)),
        currency: data.currency || 'XAF',
        status: 'pending',
        externalId: data.external_id || null,
      },
    });

    return {
      deposit_id: deposit.id,
      status: deposit.status,
      amount: parseFloat(deposit.amount.toString()),
      currency: deposit.currency,
    };
  }

  async getDepositStatus(userId: number, depositId: number) {
    const deposit = await this.prisma.deposit.findFirst({
      where: { id: depositId, userId },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    return {
      id: deposit.id,
      status: deposit.status,
      amount: parseFloat(deposit.amount.toString()),
      currency: deposit.currency,
      created_at: deposit.createdAt,
    };
  }
}
