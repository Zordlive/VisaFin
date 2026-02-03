import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: number) {
    const accounts = await this.prisma.userBankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((a) => ({
      id: a.id,
      account_type: 'bank',
      bank_name: a.bankName,
      operator_name: null,
      account_number: a.accountNumber,
      account_holder_name: a.accountHolder,
      is_active: true,
      is_default: false,
      created_at: a.createdAt,
    }));
  }

  async create(userId: number, data: any) {
    if (!data.account_number || !data.account_holder_name) {
      throw new BadRequestException('account_number and account_holder_name are required');
    }

    const bankName = data.bank_name || data.operator_name || 'N/A';

    const created = await this.prisma.userBankAccount.create({
      data: {
        userId,
        bankName,
        accountNumber: data.account_number,
        accountHolder: data.account_holder_name,
      },
    });

    return {
      id: created.id,
      account_type: 'bank',
      bank_name: created.bankName,
      operator_name: null,
      account_number: created.accountNumber,
      account_holder_name: created.accountHolder,
      is_active: true,
      is_default: false,
      created_at: created.createdAt,
    };
  }

  async update(userId: number, id: number, data: any) {
    const existing = await this.prisma.userBankAccount.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Bank account not found');
    }

    const updated = await this.prisma.userBankAccount.update({
      where: { id },
      data: {
        bankName: data.bank_name || existing.bankName,
        accountNumber: data.account_number || existing.accountNumber,
        accountHolder: data.account_holder_name || existing.accountHolder,
      },
    });

    return {
      id: updated.id,
      account_type: 'bank',
      bank_name: updated.bankName,
      operator_name: null,
      account_number: updated.accountNumber,
      account_holder_name: updated.accountHolder,
      is_active: true,
      is_default: false,
      created_at: updated.createdAt,
    };
  }

  async remove(userId: number, id: number) {
    const existing = await this.prisma.userBankAccount.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Bank account not found');
    }

    await this.prisma.userBankAccount.delete({
      where: { id },
    });
  }

  async setDefault(userId: number, id: number) {
    const existing = await this.prisma.userBankAccount.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Bank account not found');
    }

    return { success: true };
  }
}
