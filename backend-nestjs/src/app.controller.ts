import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getInfo() {
    return {
      name: 'CryptoInvest API',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        auth: '/api/auth',
        users: '/api/me, /api/user',
        wallets: '/api/wallets',
        transactions: '/api/transactions',
        deposits: '/api/deposits',
        market: '/api/market',
        investments: '/api/investments',
        referrals: '/api/referrals',
        vip: '/api/vip',
        withdrawals: '/api/withdrawals',
        crypto: '/api/crypto',
      },
      documentation: 'See README.md for complete API documentation',
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
