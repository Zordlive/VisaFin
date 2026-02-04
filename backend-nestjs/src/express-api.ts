import express, { Express, Request, Response, NextFunction, CorsOptions } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verify } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    if (origin === 'https://visafin-gest.org' || origin === 'https://www.visafin-gest.org') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
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
// JWT MIDDLEWARE
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
// ROOT ROUTES
// ============================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CryptoInvest API',
    version: '1.0.0',
    status: 'operational',
    framework: 'Express.js',
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

    const { AuthService } = await import('./auth/services/auth.service');
    const authService = new AuthService(prisma as any);
    const result = await authService.login({ email, password });
    
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Login failed' });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const { AuthService } = await import('./auth/services/auth.service');
    const authService = new AuthService(prisma as any);
    const result = await authService.register({ email, password, firstName, lastName });
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    
    const { AuthService } = await import('./auth/services/auth.service');
    const authService = new AuthService(prisma as any);
    const result = await authService.refreshToken(refresh_token);
    
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Token refresh failed' });
  }
});

app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    const { AuthService } = await import('./auth/services/auth.service');
    const authService = new AuthService(prisma as any);
    const result = await authService.loginWithGoogle(token);
    
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
    const { UsersService } = await import('./users/users.service');
    const usersService = new UsersService(prisma as any);
    const user = await usersService.getUserWithDetails(req.user?.id!);
    
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/user', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { UsersService } = await import('./users/users.service');
    const usersService = new UsersService(prisma as any);
    const user = await usersService.getUserWithDetails(req.user?.id!);
    
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/user', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { UsersService } = await import('./users/users.service');
    const usersService = new UsersService(prisma as any);
    const updatedUser = await usersService.updateUser(req.user?.id!, req.body);
    
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
    const { WalletsService } = await import('./wallets/wallets.service');
    const walletsService = new WalletsService(prisma as any);
    const wallets = await walletsService.getWalletsByUser(req.user?.id!);
    
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
    const { TransactionsService } = await import('./transactions/transactions.service');
    const txService = new TransactionsService(prisma as any);
    const transactions = await txService.getTransactionsByUser(req.user?.id!);
    
    res.json(transactions);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/transactions/clear', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { TransactionsService } = await import('./transactions/transactions.service');
    const txService = new TransactionsService(prisma as any);
    const result = await txService.clearUserTransactions(req.user?.id!);
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================
// DEPOSITS ROUTES
// ============================================

app.get('/api/deposits', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { DepositsService } = await import('./deposits/deposits.service');
    const depositsService = new DepositsService(prisma as any);
    const result = await (depositsService as any).getDepositsByUser?.(req.user?.id!) || [];
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/deposits', jwtAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { DepositsService } = await import('./deposits/deposits.service');
    const depositsService = new DepositsService(prisma as any);
    const result = await depositsService.initiateDeposit(req.user?.id!, req.body);
    
    res.status(201).json(result);
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
  console.error('❌ Server error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ============================================
// SERVER START
// ============================================

export const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected');

    const PORT = process.env.PORT || 3000;
    
    app.listen(PORT, () => {
      console.log(`✅ Express server running on http://localhost:${PORT}`);
      console.log(`🚀 API endpoint: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
};

export default app;
