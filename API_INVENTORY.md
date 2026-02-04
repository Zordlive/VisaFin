# 📚 API Inventory (Django / DRF)

Base URL (dev): http://localhost:8000/api

Auth header (protected endpoints):
```
Authorization: Bearer <access_token>
```

> Notes:
> - Most endpoints require auth unless stated.
> - Trailing slashes may be enabled by DRF router; if you get 301/404, add or remove `/`.

---

## ✅ Auth

### POST /auth/login (public)
**Body**
```json
{
  "identifier": "username_or_email_or_phone",
  "password": "your-password"
}
```
**Response**
```json
{
  "user": { "id": 1, "username": "demo", "first_name": "Demo", "email": "demo@mail.com", "phone": null, "vip_level": 0, "vip_since": null, "total_invested": 0 },
  "access_token": "...",
  "refresh_token": "..."
}
```

### POST /auth/register (public)
**Body**
```json
{
  "name": "John",
  "email": "john@mail.com",
  "phone": "650000000",
  "countryCode": "+243",
  "password": "secret123",
  "ref": "REFCODE" 
}
```
**Response**
```json
{
  "user": { "id": 2, "username": "john@mail.com", "first_name": "John", "email": "john@mail.com", "phone": "+243650000000", "vip_level": 0, "vip_since": null, "total_invested": 0 },
  "access_token": "...",
  "refresh_token": "...",
  "investor_created": true,
  "referral_bonus": 0
}
```

### POST /auth/google-login (public)
**Body**
```json
{ "token": "<google-id-token>" }
```
**Response**: same as login.

### POST /auth/refresh (public)
**Body**
```json
{ "refresh": "<refresh_token>" }
```
**Response**
```json
{ "access_token": "..." }
```

### POST /auth/logout
**Response**
```json
{ "message": "logged out" }
```

### POST /auth/register-email (public)
**Body**
```json
{ "email": "user@mail.com" }
```

### GET /auth/verify-email/:uidb64/:token (public)
Returns tokens if valid.

### POST /auth/set-password (public)
**Body**
```json
{ "uidb64": "...", "token": "...", "password": "NewPassword123" }
```

### POST /auth/token (public, SimpleJWT)
**Body**
```json
{ "username": "user", "password": "pass" }
```

### POST /auth/token/refresh (public, SimpleJWT)
**Body**
```json
{ "refresh": "<refresh_token>" }
```

---

## 👤 User

### GET /me
Returns current user.

### GET /user
Same as `/me`.

### PUT /user
**Body**
```json
{ "first_name": "NewName", "email": "new@mail.com", "password": "newpass", "phone": "+243650000000" }
```

---

## 💼 Wallets

### GET /wallets
List user wallets.

### POST /wallets/:id/transfer_gains
**Body**
```json
{ "amount": "25.00", "source": "gains" }
```
`source` can be `gains` or `sale`.

---

## 💳 Transactions

### GET /transactions
List user transactions.

### POST /transactions
**Body**
```json
{ "wallet": 1, "amount": "10.00", "type": "deposit" }
```

### POST /transactions/sell
**Body**
```json
{ "offer_id": "123", "amount": "100", "currency": "USDT" }
```

### DELETE /transactions/clear
Deletes all user transactions.

---

## 📈 Market

### GET /market/offers (public)
List market offers.

### GET /market/offers/:id (public)
Offer details.

---

## 💰 Deposits

### POST /deposits/initiate
**Body**
```json
{ "amount": "5000", "currency": "CDF", "operateur": "orange", "phone": "650000000", "type": "FIAT" }
```

### GET /deposits/:id/status
Returns deposit status.

---

## 📦 Investments

### GET /investments
List user investments.

### POST /investments
**Body**
```json
{ "amount": "100.00", "offer_id": 12 }
```

### POST /investments/:id/accrue
Accrue interest for a single investment.

### POST /investments/:id/encash
Encash accrued interest into available balance.

---

## 🤝 Referrals

### GET /referrals/me
Returns referral code, referrals list, and stats.

### GET /referrals/all (admin)
All referrals with stats.

---

## ⭐ VIP

### GET /vip-levels (public)
List VIP levels.

### GET /vip-subscriptions/me
List user active VIP subscriptions.

### POST /vip-subscriptions/purchase
**Body**
```json
{ "level_id": 3 }
```

---

## 🧮 Quantification

### GET /quantification/gains
Returns VIP + investment gains summary.

### POST /quantification/claim
Claims gains into wallet `gains`.

---

## 🏦 Bank Accounts

### GET /bank-accounts
List user bank/operator accounts.

### POST /bank-accounts
**Body**
```json
{
  "account_type": "bank",
  "bank_name": "MyBank",
  "account_number": "123456",
  "account_holder_name": "John Doe",
  "is_default": true
}
```

### POST /bank-accounts/:id/set_default
Sets an account as default.

---

## 💸 Withdrawals

### GET /withdrawals
List withdrawals (admin sees all).

### POST /withdrawals
**Body**
```json
{ "amount": "50", "bank": "Orange", "account": "650000000" }
```

### POST /withdrawals/:id/process (admin)
**Body**
```json
{ "action": "complete" }
```
or
```json
{ "action": "reject", "reason": "Insufficient funds" }
```

---

## 🔔 Admin Notifications (admin)

### GET /admin-notifications
List admin notifications.

### POST /admin-notifications/:id/mark_as_read
Marks one as read.

### POST /admin-notifications/mark_all_as_read
Marks all as read.

---

## 🪙 Crypto Addresses (public)

### GET /crypto-addresses
Returns active crypto addresses.

---

## 🌐 Social Links (public)

### GET /social-links
Returns WhatsApp/Telegram links.

---

## Sources
- Routes: backend/api/urls.py
- Logic: backend/api/views.py
- Payload fields: backend/api/serializers.py
