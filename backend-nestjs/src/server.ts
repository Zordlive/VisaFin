import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verify, sign } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();

// ============================================
// CONFIG
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRY = '24h';
const REFRESH_EXPIRY = '7d';

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin?.startsWith('http://localhost:')) return callback(null, true);
    if (origin === 'https://visafin-gest.org' || origin === 'https://www.visafin-gest.org') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// TYPES
// ============================================

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; username: string; is_staff?: boolean; [key: string]: any };
    }
  }
}

// ============================================
// JWT MIDDLEWARE
// ============================================

const jwtAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ============================================
// UTILS
// ============================================

const hashPassword = async (password: string) => bcrypt.hash(password, 10);
const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

const toNumber = (value: any) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value.toString());
};

const getOrCreateWallet = async (userId: number) => {
  let wallet = await prisma.wallet.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, currency: 'USDT' },
    });
  }

  return wallet;
};

const createTransaction = async (walletId: number, amount: number, type: string) => {
  return prisma.transaction.create({
    data: { walletId, amount, type },
  });
};

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isStaff: true },
    });

    if (!user?.isStaff) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const generateTokens = (userId: number, email: string, username: string, isStaff: boolean) => {
  const payload = { id: userId, email, username, is_staff: isStaff };
  
  return {
    access_token: sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY }),
    refresh_token: sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY }),
  };
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
    description: 'Cryptocurrency investment platform',
    endpoints: {
      auth: '/api/auth',
      users: '/api/me, /api/user',
      wallets: '/api/wallets',
      transactions: '/api/transactions',
      deposits: '/api/deposits',
      market: '/api/market',
    },
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
      },
    });

    // Create investor profile
    await prisma.investor.create({
      data: { userId: user.id },
    });

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.username, user.isStaff);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        is_staff: user.isStaff,
      },
      ...tokens,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, identifier, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password required' });
    }

    const loginIdentifier = email || identifier;
    if (!loginIdentifier) {
      return res.status(400).json({ message: 'Email or username required' });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: loginIdentifier }, { username: loginIdentifier }] },
      include: { investor: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.username, user.isStaff);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        is_staff: user.isStaff,
      },
      ...tokens,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = verify(refresh_token, JWT_REFRESH_SECRET) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const tokens = generateTokens(user.id, user.email, user.username, user.isStaff);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logout successful' });
});

app.get('/api/auth/me', jwtAuth, (req: Request, res: Response) => {
  res.json(req.user);
});

// ============================================
// USER ROUTES
// ============================================

app.get('/api/me', jwtAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isStaff: true,
        createdAt: true,
        investor: true,
        wallets: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      ...user,
      is_staff: user.isStaff,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/user', jwtAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        investor: true,
        wallets: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      ...user,
      is_staff: user.isStaff,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/user', jwtAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { firstName, lastName, email } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// WALLETS ROUTES
// ============================================

app.get('/api/wallets', jwtAuth, async (req: Request, res: Response) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.user?.id },
    });

    const formatted = wallets.map(w => ({
      id: w.id,
      user_id: w.userId,
      currency: w.currency,
      available: toNumber(w.available),
      pending: toNumber(w.pending),
      gains: toNumber(w.gains),
      sale_balance: toNumber(w.saleBalance),
      invested: toNumber(w.invested),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// TRANSACTIONS ROUTES
// ============================================

app.get('/api/transactions', jwtAuth, async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: { userId: req.user?.id },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = transactions.map(tx => ({
      id: tx.id,
      wallet_id: tx.walletId,
      amount: toNumber(tx.amount),
      type: tx.type,
      created_at: tx.createdAt,
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/transactions/clear', jwtAuth, async (req: Request, res: Response) => {
  try {
    const result = await prisma.transaction.deleteMany({
      where: {
        wallet: { userId: req.user?.id },
      },
    });

    res.json({ message: 'History cleared', count: result.count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// DEPOSITS ROUTES
// ============================================

app.get('/api/deposits', jwtAuth, async (req: Request, res: Response) => {
  try {
    const deposits = await prisma.deposit.findMany({
      where: { userId: req.user?.id },
    });

    const formatted = deposits.map(d => ({
      id: d.id,
      amount: toNumber(d.amount),
      currency: d.currency,
      status: d.status,
      created_at: d.createdAt,
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/deposits', jwtAuth, async (req: Request, res: Response) => {
  try {
    const { amount, currency } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount required' });
    }

    const userId = req.user?.id!;
    const amountValue = parseFloat(amount);

    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amount: amountValue,
        currency: currency || 'USD',
        status: 'pending',
      },
    });

    const wallet = await getOrCreateWallet(userId);
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        available: toNumber(wallet.available) + amountValue,
      },
    });
    await createTransaction(wallet.id, amountValue, 'deposit');

    res.status(201).json({
      deposit_id: deposit.id,
      status: deposit.status,
      amount: toNumber(deposit.amount),
      currency: deposit.currency,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/deposits/initiate', jwtAuth, async (req: Request, res: Response) => {
  try {
    const amountValue = Number(req.body?.amount);
    if (!amountValue || Number.isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({ message: 'Amount required' });
    }

    const userId = req.user?.id!;
    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amount: amountValue,
        currency: req.body?.currency || 'USD',
        status: 'pending',
        externalId: req.body?.external_id || null,
      },
    });

    const wallet = await getOrCreateWallet(userId);
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        available: toNumber(wallet.available) + amountValue,
      },
    });
    await createTransaction(wallet.id, amountValue, 'deposit');

    res.status(201).json({
      deposit_id: deposit.id,
      status: deposit.status,
      amount: toNumber(deposit.amount),
      currency: deposit.currency,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// MARKET ROUTES
// ============================================

app.get('/api/market', async (req: Request, res: Response) => {
  try {
    // Placeholder - return mock data
    res.json({
      bitcoin: { price: 45000, change24h: 2.5 },
      ethereum: { price: 2500, change24h: 1.8 },
      usdt: { price: 1, change24h: 0 },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/market/offers', async (req: Request, res: Response) => {
  try {
    const offers = await prisma.marketOffer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formatted = offers.map(o => ({
      id: o.id,
      title: o.title,
      description: o.description,
      price_offered: toNumber(o.priceOffered),
      status: o.status,
      availability_hours: o.availabilityHours ?? null,
      created_at: o.createdAt,
      expires_at: o.expiresAt,
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/market/offers/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    const offer = await prisma.marketOffer.findUnique({ where: { id } });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    res.json({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      price_offered: toNumber(offer.priceOffered),
      status: offer.status,
      availability_hours: offer.availabilityHours ?? null,
      created_at: offer.createdAt,
      expires_at: offer.expiresAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/market/offers', jwtAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, price_offered, status, availability_hours, expires_at } = req.body || {};
    const price = Number(price_offered);
    if (!title || !price || Number.isNaN(price)) {
      return res.status(400).json({ message: 'title and price_offered are required' });
    }

    const hours = availability_hours !== undefined && availability_hours !== null
      ? Number(availability_hours)
      : null;

    let expiresAt: Date | null = null;
    if (expires_at) {
      const parsed = new Date(expires_at);
      if (!Number.isNaN(parsed.getTime())) expiresAt = parsed;
    } else if (hours && hours > 0) {
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    const offer = await prisma.marketOffer.create({
      data: {
        title,
        description: description || '',
        priceOffered: price,
        status: status || 'open',
        availabilityHours: hours,
        expiresAt,
      },
    });

    res.status(201).json({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      price_offered: toNumber(offer.priceOffered),
      status: offer.status,
      availability_hours: offer.availabilityHours ?? null,
      created_at: offer.createdAt,
      expires_at: offer.expiresAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/market/offers/:id', jwtAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    const { title, description, price_offered, status, availability_hours, expires_at } = req.body || {};
    const data: any = {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    if (price_offered !== undefined) {
      const price = Number(price_offered);
      if (!price || Number.isNaN(price)) {
        return res.status(400).json({ message: 'Invalid price_offered' });
      }
      data.priceOffered = price;
    }

    if (availability_hours !== undefined) {
      const hours = availability_hours === null ? null : Number(availability_hours);
      data.availabilityHours = hours;
      if (hours && hours > 0) {
        data.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      }
    }

    if (expires_at !== undefined) {
      const parsed = expires_at ? new Date(expires_at) : null;
      data.expiresAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }

    const offer = await prisma.marketOffer.update({
      where: { id },
      data,
    });

    res.json({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      price_offered: toNumber(offer.priceOffered),
      status: offer.status,
      availability_hours: offer.availabilityHours ?? null,
      created_at: offer.createdAt,
      expires_at: offer.expiresAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// CRYPTO ADDRESSES
// ============================================

app.get('/api/crypto/addresses', jwtAuth, async (req: Request, res: Response) => {
  try {
    const addresses = await prisma.cryptoAddress.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = addresses.map(a => ({
      id: a.id,
      network: a.coin,
      network_display: a.coin,
      address: a.address,
      is_active: true,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// REFERRALS
// ============================================

app.get('/api/referrals/me', jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let code = await prisma.referralCode.findUnique({
      where: { referrerId: userId },
    });

    if (!code) {
      const generated = `REF${userId}${Date.now().toString().slice(-4)}`;
      code = await prisma.referralCode.create({
        data: { referrerId: userId, code: generated },
      });
    }

    const referrals = await prisma.referral.findMany({
      where: { codeId: code.id },
      orderBy: { createdAt: 'desc' },
    });

    const total = referrals.length;
    const used = referrals.filter(r => r.status === 'used').length;
    const pending = referrals.filter(r => r.status === 'pending').length;

    res.json({
      code,
      referrals,
      stats: {
        total_referred: total,
        used,
        pending,
        vip_breakdown: {},
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// INVESTMENTS
// ============================================

app.get('/api/investments', jwtAuth, async (req: Request, res: Response) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = investments.map(inv => ({
      id: inv.id,
      title: `Investissement #${inv.id}`,
      amount: toNumber(inv.amount),
      daily_rate: toNumber(inv.dailyRate),
      last_collected_at: inv.lastAccrual || inv.createdAt,
      description: 'Investissement standard',
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/investments', jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const amount = Number(req.body?.amount);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const wallet = await getOrCreateWallet(userId);
    if (toNumber(wallet.available) < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.investment.create({
        data: {
          userId,
          walletId: wallet!.id,
          amount,
          dailyRate: 0.025,
          active: true,
        },
      });

      await tx.wallet.update({
        where: { id: wallet!.id },
        data: {
          available: toNumber(wallet!.available) - amount,
          invested: toNumber(wallet!.invested) + amount,
        },
      });

      await tx.transaction.create({
        data: { walletId: wallet!.id, amount, type: 'trade' },
      });

      return created;
    });

    res.status(201).json({
      id: result.id,
      amount: toNumber(result.amount),
      daily_rate: toNumber(result.dailyRate),
      status: 'active',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/investments/:id/collect', jwtAuth, async (req: Request, res: Response) => {
  try {
    const investmentId = Number(req.params.id);
    if (!investmentId || Number.isNaN(investmentId)) {
      return res.status(400).json({ message: 'Invalid investment id' });
    }

    const inv = await prisma.investment.findFirst({
      where: { id: investmentId, userId: req.user?.id },
    });

    if (!inv) return res.status(404).json({ message: 'Investment not found' });

    await prisma.investment.update({
      where: { id: investmentId },
      data: { lastAccrual: new Date() },
    });

    res.json({ message: 'Gains collected', collected_at: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// OPERATEURS
// ============================================

app.get('/api/operateurs', async (req: Request, res: Response) => {
  try {
    const operateur = (req.query.operateur as string | undefined)?.toLowerCase();
    const where = operateur ? { operateur } : undefined;
    const ops = await prisma.operateur.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(ops);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// BANK ACCOUNTS
// ============================================

const parseAccountType = (bankName: string | null | undefined) => {
  if (!bankName) return { account_type: 'bank', bank_name: '', operator_name: '' };
  if (bankName.startsWith('operator:')) {
    return { account_type: 'operator', bank_name: '', operator_name: bankName.replace('operator:', '') };
  }
  return { account_type: 'bank', bank_name: bankName, operator_name: '' };
};

const buildBankName = (payload: any) => {
  if (payload?.account_type === 'operator') {
    return `operator:${payload.operator_name || ''}`;
  }
  return payload?.bank_name || '';
};

app.get('/api/bank-accounts', jwtAuth, async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.userBankAccount.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = accounts.map(a => {
      const parsed = parseAccountType(a.bankName);
      return {
        id: a.id,
        account_type: parsed.account_type,
        bank_name: parsed.bank_name || undefined,
        operator_name: parsed.operator_name || undefined,
        account_number: a.accountNumber,
        account_holder_name: a.accountHolder,
        is_active: true,
        is_default: false,
        created_at: a.createdAt,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/bank-accounts', jwtAuth, async (req: Request, res: Response) => {
  try {
    const { account_number, account_holder_name } = req.body || {};
    if (!account_number || !account_holder_name) {
      return res.status(400).json({ message: 'account_number and account_holder_name required' });
    }

    const created = await prisma.userBankAccount.create({
      data: {
        userId: req.user?.id!,
        bankName: buildBankName(req.body),
        accountNumber: account_number,
        accountHolder: account_holder_name,
      },
    });

    const parsed = parseAccountType(created.bankName);
    res.status(201).json({
      id: created.id,
      account_type: parsed.account_type,
      bank_name: parsed.bank_name || undefined,
      operator_name: parsed.operator_name || undefined,
      account_number: created.accountNumber,
      account_holder_name: created.accountHolder,
      is_active: true,
      is_default: false,
      created_at: created.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/bank-accounts/:id', jwtAuth, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const updated = await prisma.userBankAccount.update({
      where: { id },
      data: {
        bankName: req.body ? buildBankName(req.body) : undefined,
        accountNumber: req.body?.account_number,
        accountHolder: req.body?.account_holder_name,
      },
    });

    const parsed = parseAccountType(updated.bankName);
    res.json({
      id: updated.id,
      account_type: parsed.account_type,
      bank_name: parsed.bank_name || undefined,
      operator_name: parsed.operator_name || undefined,
      account_number: updated.accountNumber,
      account_holder_name: updated.accountHolder,
      is_active: true,
      is_default: false,
      created_at: updated.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/bank-accounts/:id', jwtAuth, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    await prisma.userBankAccount.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/bank-accounts/:id/set_default', jwtAuth, async (req: Request, res: Response) => {
  try {
    res.json({ message: 'Default updated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// WALLET TRANSFERS
// ============================================

app.post('/api/wallets/:id/transfer_gains', jwtAuth, async (req: Request, res: Response) => {
  try {
    const walletId = Number(req.params.id);
    const amount = Number(req.body?.amount);
    const source = (req.body?.source as 'gains' | 'sale') || 'gains';

    if (!walletId || Number.isNaN(walletId)) {
      return res.status(400).json({ message: 'Invalid wallet id' });
    }
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId: req.user?.id },
    });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    if (source === 'gains' && toNumber(wallet.gains) < amount) {
      return res.status(400).json({ message: 'Insufficient gains' });
    }
    if (source === 'sale' && toNumber(wallet.invested) < amount) {
      return res.status(400).json({ message: 'Insufficient invested balance' });
    }

    const updated = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        gains: source === 'gains' ? toNumber(wallet.gains) - amount : wallet.gains,
        invested: source === 'sale' ? toNumber(wallet.invested) - amount : wallet.invested,
        available: toNumber(wallet.available) + amount,
      },
    });

    await createTransaction(walletId, amount, 'transfer');

    res.json({
      message: 'Transfer completed',
      wallet: {
        id: updated.id,
        available: toNumber(updated.available),
        gains: toNumber(updated.gains),
        invested: toNumber(updated.invested),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// VIP
// ============================================

app.get('/api/vip/levels', async (req: Request, res: Response) => {
  try {
    const levels = await prisma.vIPLevel.findMany({
      orderBy: { level: 'asc' },
    });
    const formatted = levels.map(l => ({
      id: l.id,
      level: l.level,
      title: l.title,
      price: toNumber(l.price),
      percentage: toNumber(l.percentage),
      daily_gains: toNumber(l.dailyGains),
      delay_days: l.delayDays,
      description: l.description,
      created_at: l.createdAt,
      updated_at: l.updatedAt,
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/vip/subscriptions/me', jwtAuth, async (req: Request, res: Response) => {
  try {
    const subs = await prisma.userVIPSubscription.findMany({
      where: { userId: req.user?.id },
      include: { vipLevel: true },
      orderBy: { purchasedAt: 'desc' },
    });
    const formatted = subs.map(s => ({
      id: s.id,
      user_id: s.userId,
      vip_level: {
        id: s.vipLevel.id,
        level: s.vipLevel.level,
        title: s.vipLevel.title,
        price: toNumber(s.vipLevel.price),
        percentage: toNumber(s.vipLevel.percentage),
        daily_gains: toNumber(s.vipLevel.dailyGains),
        delay_days: s.vipLevel.delayDays,
        description: s.vipLevel.description,
      },
      active: s.active,
      purchased_at: s.purchasedAt,
      updated_at: s.updatedAt,
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/vip/subscriptions/purchase', jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const vipLevelId = Number(req.body?.vip_level_id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!vipLevelId || Number.isNaN(vipLevelId)) {
      return res.status(400).json({ message: 'Invalid vip_level_id' });
    }

    const level = await prisma.vIPLevel.findUnique({
      where: { id: vipLevelId },
    });
    if (!level) return res.status(404).json({ message: 'VIP level not found' });

    const wallet = await getOrCreateWallet(userId);
    const price = toNumber(level.price);

    // Check if user has enough balance
    if (toNumber(wallet.available) < price) {
      return res.status(400).json({ message: 'Insufficient funds for VIP purchase' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create or update subscription
      const sub = await tx.userVIPSubscription.upsert({
        where: {
          userId_vipLevelId: { userId, vipLevelId },
        },
        create: { userId, vipLevelId, active: true, purchasedAt: new Date() },
        update: { active: true, updatedAt: new Date() },
      });

      // Update wallet: deduct from available, add to invested
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          available: toNumber(wallet.available) - price,
          invested: toNumber(wallet.invested) + price,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: { walletId: wallet.id, amount: price, type: 'trade' },
      });

      return { sub, wallet: updated };
    });

    res.json({
      id: result.sub.id,
      user_id: result.sub.userId,
      vip_level: {
        id: level.id,
        level: level.level,
        title: level.title,
        price: price,
      },
      active: result.sub.active,
      purchased_at: result.sub.purchasedAt,
      wallet: {
        available: toNumber(result.wallet.available),
        invested: toNumber(result.wallet.invested),
        gains: toNumber(result.wallet.gains),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// SOCIAL LINKS
// ============================================

app.get('/api/social-links', jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const links = await prisma.socialLinks.findUnique({
      where: { userId },
    });

    res.json({
      id: links?.id,
      whatsapp_channel: links?.twitter || null,
      whatsapp_group: links?.linkedin || null,
      telegram_channel: links?.facebook || null,
      telegram_group: links?.instagram || null,
      created_at: links?.createdAt,
      updated_at: links?.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/social-links', jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const data = {
      twitter: req.body?.whatsapp_channel ?? null,
      linkedin: req.body?.whatsapp_group ?? null,
      facebook: req.body?.telegram_channel ?? null,
      instagram: req.body?.telegram_group ?? null,
    };

    const updated = await prisma.socialLinks.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });

    res.json({
      id: updated.id,
      whatsapp_channel: updated.twitter || null,
      whatsapp_group: updated.linkedin || null,
      telegram_channel: updated.facebook || null,
      telegram_group: updated.instagram || null,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// WITHDRAWALS
// ============================================

app.get('/api/withdrawals', jwtAuth, async (req: Request, res: Response) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = withdrawals.map(w => ({
      id: w.id,
      amount: toNumber(w.amount),
      status: w.status,
      created_at: w.createdAt,
      updated_at: w.updatedAt,
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/withdrawals', jwtAuth, async (req: Request, res: Response) => {
  try {
    const amount = Number(req.body?.amount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const userId = req.user?.id!;
    const wallet = await getOrCreateWallet(userId);
    if (toNumber(wallet.available) < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        status: 'pending',
      },
    });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        available: toNumber(wallet.available) - amount,
      },
    });
    await createTransaction(wallet.id, amount, 'withdraw');

    res.status(201).json({
      id: withdrawal.id,
      amount: toNumber(withdrawal.amount),
      status: withdrawal.status,
      created_at: withdrawal.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// QUANTIFICATION
// ============================================

app.get('/api/quantification/gains', jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const investments = await prisma.investment.findMany({
      where: { userId, active: true },
    });

    const subscriptions = await prisma.userVIPSubscription.findMany({
      where: { userId, active: true },
      include: { vipLevel: true },
    });

    const investmentTotal = investments.reduce((sum, inv) => {
      return sum + toNumber(inv.amount) * toNumber(inv.dailyRate);
    }, 0);

    const vipGains: Record<string, number> = {};
    let vipTotal = 0;
    subscriptions.forEach((sub) => {
      const amount = toNumber(sub.vipLevel.dailyGains) || (toNumber(sub.vipLevel.percentage) * 0.01);
      vipGains[`VIP_Level_${sub.vipLevel.level}`] = (vipGains[`VIP_Level_${sub.vipLevel.level}`] || 0) + amount;
      vipTotal += amount;
    });

    res.json({
      vip_gains: vipGains,
      vip_gains_total: vipTotal,
      investment_gains: {
        total: investmentTotal,
      },
      total_gains: vipTotal + investmentTotal,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/quantification/claim', jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const investments = await prisma.investment.findMany({
      where: { userId, active: true },
    });
    const subscriptions = await prisma.userVIPSubscription.findMany({
      where: { userId, active: true },
      include: { vipLevel: true },
    });

    const investmentTotal = investments.reduce((sum, inv) => {
      return sum + toNumber(inv.amount) * toNumber(inv.dailyRate);
    }, 0);

    const vipGains: Record<string, number> = {};
    let vipTotal = 0;
    subscriptions.forEach((sub) => {
      const amount = toNumber(sub.vipLevel.dailyGains) || (toNumber(sub.vipLevel.percentage) * 0.01);
      vipGains[`VIP_Level_${sub.vipLevel.level}`] = (vipGains[`VIP_Level_${sub.vipLevel.level}`] || 0) + amount;
      vipTotal += amount;
    });

    const total = vipTotal + investmentTotal;
    const wallet = await getOrCreateWallet(userId);

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          gains: toNumber(wallet.gains) + total,
        },
      });

      await tx.transaction.create({
        data: { walletId: wallet.id, amount: total, type: 'encash' },
      });

      await tx.investment.updateMany({
        where: { userId, active: true },
        data: { lastAccrual: new Date() },
      });
    });

    res.json({
      amount: total,
      vip_gains: vipGains,
      vip_gains_total: vipTotal,
      investment_gains: {
        total: investmentTotal,
      },
      total_gains: total,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 404 & ERROR HANDLING
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.path}` });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 3000;

export const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected');

    app.listen(PORT, () => {
      console.log(`✅ Express server running on http://localhost:${PORT}`);
      console.log(`🚀 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
};

export default app;
