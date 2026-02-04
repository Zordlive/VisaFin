import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verify } from 'jsonwebtoken';
import { services, prisma } from './services';

dotenv.config();

const app: Express = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    if (origin === 'https://visafin-gest.org' || origin === 'https://www.visafin-gest.org') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// TYPES
// ============================================

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; [key: string]: any };
    }
  }
}

// ============================================
// AUTH MIDDLEWARE (JWT Guard equivalent)
// ============================================

const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - No token' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded as any;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
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
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const result = await services.auth.login({ email, password });
    
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Login failed' });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    
    const result = await services.auth.register({ email, password, first_name, last_name });
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    
    const result = await services.auth.refreshToken(refresh_token);
    
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Token refresh failed' });
  }
});

app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    const result = await services.auth.loginWithGoogle(token);
    
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Google login failed' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', jwtAuthMiddleware, (req: Request, res: Response) => {
  res.json(req.user);
});

// ============================================
// USER ROUTES
// ============================================

app.get('/api/me', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await services.users.getUserWithDetails(req.user?.id!);
    
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/user', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await services.users.getUserWithDetails(req.user?.id!);
    
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/user', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const updatedUser = await services.users.updateUser(req.user?.id!, req.body);
    
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================
// WALLETS ROUTES
// ============================================

app.get('/api/wallets', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const wallets = await services.wallets.getWalletsByUser(req.user?.id!);
    
    res.json(wallets);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================
// TRANSACTIONS ROUTES
// ============================================

app.get('/api/transactions', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const transactions = await services.transactions.getTransactionsByUser(req.user?.id!);
    
    res.json(transactions);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/transactions/clear', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await services.transactions.clearUserTransactions(req.user?.id!);

    // ============================================
    // DEPOSITS ROUTES
    // ============================================

    app.get('/api/deposits', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const deposits = await services.deposits.getDepositsByUser(req.user?.id!);
        res.json(deposits);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    app.post('/api/deposits', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const result = await services.deposits.initiateDeposit(req.user?.id!, req.body);
        res.status(201).json(result);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // ============================================
    // MARKET ROUTES
    // ============================================

    app.get('/api/market', async (req: Request, res: Response) => {
      try {
        const marketData = await services.market.getMarketData();
        res.json(marketData);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // ============================================
    // INVESTMENTS ROUTES
    // ============================================

    app.get('/api/investments', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const investments = await services.investments.getInvestmentsByUser(req.user?.id!);
        res.json(investments);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    app.post('/api/investments', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const investment = await services.investments.createInvestment(req.user?.id!, req.body);
        res.status(201).json(investment);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // ============================================
    // REFERRALS ROUTES
    // ============================================

    app.get('/api/referrals', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const referrals = await services.referrals.getReferralsByUser(req.user?.id!);
        res.json(referrals);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // ============================================
    // VIP ROUTES
    // ============================================

    app.get('/api/vip', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const vipData = await services.vip.getVipStatus(req.user?.id!);
        res.json(vipData);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // ============================================
    // WITHDRAWALS ROUTES
    // ============================================

    app.get('/api/withdrawals', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const withdrawals = await services.withdrawals.getWithdrawalsByUser(req.user?.id!);
        res.json(withdrawals);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    app.post('/api/withdrawals', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const withdrawal = await services.withdrawals.initiateWithdrawal(req.user?.id!, req.body);
        res.status(201).json(withdrawal);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // ============================================
    // CRYPTO ROUTES
    // ============================================

    app.get('/api/crypto', async (req: Request, res: Response) => {
      try {
        const cryptoData = await services.crypto.getCryptoData();
        res.json(cryptoData);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // ============================================
    // BANK ACCOUNTS ROUTES
    // ============================================

    app.get('/api/bank-accounts', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const bankAccounts = await services.bankAccounts.getBankAccountsByUser(req.user?.id!);
        res.json(bankAccounts);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    app.post('/api/bank-accounts', jwtAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const bankAccount = await services.bankAccounts.createBankAccount(req.user?.id!, req.body);
        res.status(201).json(bankAccount);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // ============================================
    // SOCIAL LINKS ROUTES
    // ============================================

    app.get('/api/social-links', async (req: Request, res: Response) => {
      try {
        const socialLinks = await services.socialLinks.getSocialLinks();
        res.json(socialLinks);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.path}` });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 3000;

export const startServer = async () => {
  try {
    // Test Prisma connection
    await prisma.$connect();
    console.log('✅ Prisma connected');

    app.listen(PORT, () => {
      console.log(`✅ Express server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
};

export default app;
