import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DepositsModule } from './deposits/deposits.module';
import { MarketModule } from './market/market.module';
import { InvestmentsModule } from './investments/investments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { VipModule } from './vip/vip.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { CryptoModule } from './crypto/crypto.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    TransactionsModule,
    DepositsModule,
    MarketModule,
    InvestmentsModule,
    ReferralsModule,
    VipModule,
    WithdrawalsModule,
    CryptoModule,
  ],
})
export class AppModule {}
