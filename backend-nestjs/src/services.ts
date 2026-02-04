import { PrismaClient } from '@prisma/client';

// Import all services
import { AuthService } from './auth/services/auth.service';
import { UsersService } from './users/users.service';
import { WalletsService } from './wallets/wallets.service';
import { TransactionsService } from './transactions/transactions.service';
import { DepositsService } from './deposits/deposits.service';
import { MarketService } from './market/market.service';
import { InvestmentsService } from './investments/investments.service';
import { ReferralsService } from './referrals/referrals.service';
import { VipService } from './vip/vip.service';
import { WithdrawalsService } from './withdrawals/withdrawals.service';
import { CryptoService } from './crypto/crypto.service';
import { OperateursService } from './operateurs/operateurs.service';
import { SocialLinksService } from './social-links/social-links.service';
import { BankAccountsService } from './bank-accounts/bank-accounts.service';

// Create Prisma instance
export const prisma = new PrismaClient();

// Service container
export const services = {
  auth: new AuthService(prisma),
  users: new UsersService(prisma),
  wallets: new WalletsService(prisma),
  transactions: new TransactionsService(prisma),
  deposits: new DepositsService(prisma),
  market: new MarketService(prisma),
  investments: new InvestmentsService(prisma),
  referrals: new ReferralsService(prisma),
  vip: new VipService(prisma),
  withdrawals: new WithdrawalsService(prisma),
  crypto: new CryptoService(prisma),
  operateurs: new OperateursService(prisma),
  socialLinks: new SocialLinksService(prisma),
  bankAccounts: new BankAccountsService(prisma),
};

export type Services = typeof services;
