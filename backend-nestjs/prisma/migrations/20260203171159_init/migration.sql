-- CreateTable
CREATE TABLE "auth_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_investor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "phone" TEXT,
    "totalInvested" DECIMAL NOT NULL DEFAULT 0,
    "portfolioValue" DECIMAL NOT NULL DEFAULT 0,
    "vipLevel" INTEGER NOT NULL DEFAULT 0,
    "vipSince" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_investor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_wallet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "available" DECIMAL NOT NULL DEFAULT 0,
    "pending" DECIMAL NOT NULL DEFAULT 0,
    "gains" DECIMAL NOT NULL DEFAULT 0,
    "saleBalance" DECIMAL NOT NULL DEFAULT 0,
    "invested" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "api_wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_deposit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_marketoffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "priceOffered" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerId" TEXT NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "price" DECIMAL NOT NULL,
    "surplus" DECIMAL NOT NULL,
    "buyerInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_trade_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_referralcode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_referralcode_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_referral" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codeId" INTEGER NOT NULL,
    "referredUserId" INTEGER,
    "parentReferralId" INTEGER,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "firstDepositRewardProcessed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    CONSTRAINT "api_referral_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "api_referralcode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "api_referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "auth_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "api_referral_parentReferralId_fkey" FOREIGN KEY ("parentReferralId") REFERENCES "api_referral" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_investment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "walletId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "dailyRate" DECIMAL NOT NULL DEFAULT 0.025,
    "lastAccrual" DATETIME,
    "accrued" DECIMAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "api_investment_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "api_wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_hiddenoffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerId" INTEGER NOT NULL,
    "userId" INTEGER,
    "hiddenUntil" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "api_viplevel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "level" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL NOT NULL,
    "percentage" DECIMAL NOT NULL DEFAULT 0,
    "dailyGains" DECIMAL NOT NULL DEFAULT 0,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_uservipsubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "vipLevelId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_uservipsubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "api_uservipsubscription_vipLevelId_fkey" FOREIGN KEY ("vipLevelId") REFERENCES "api_viplevel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_operateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroAgent" TEXT NOT NULL,
    "nomAgent" TEXT NOT NULL,
    "operateur" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_userbankaccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_userbankaccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_withdrawal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_adminnotification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adminId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "notificationType" TEXT NOT NULL,
    "amount" DECIMAL,
    "accountInfo" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_adminnotification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_cryptoaddress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "coin" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_cryptoaddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_sociallinks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "twitter" TEXT,
    "linkedin" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_sociallinks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_user_email_key" ON "auth_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_user_username_key" ON "auth_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "api_investor_userId_key" ON "api_investor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "api_referralcode_code_key" ON "api_referralcode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "api_referralcode_referrerId_key" ON "api_referralcode"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "api_viplevel_level_key" ON "api_viplevel"("level");

-- CreateIndex
CREATE UNIQUE INDEX "api_uservipsubscription_userId_vipLevelId_key" ON "api_uservipsubscription"("userId", "vipLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "api_operateur_numeroAgent_key" ON "api_operateur"("numeroAgent");

-- CreateIndex
CREATE UNIQUE INDEX "api_operateur_numeroAgent_operateur_key" ON "api_operateur"("numeroAgent", "operateur");

-- CreateIndex
CREATE UNIQUE INDEX "api_sociallinks_userId_key" ON "api_sociallinks"("userId");
