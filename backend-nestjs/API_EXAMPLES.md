# API Examples

Collection of curl examples for testing the CryptoInvest API.

## Authentication

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "username": "alice_smith",
    "password": "SecurePassword123!",
    "firstName": "Alice",
    "lastName": "Smith"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePassword123!"
  }'
```

**Save the access_token for subsequent requests:**
```bash
TOKEN="your_access_token_here"
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer $TOKEN"
```

### Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## Users

### Get User Profile

```bash
curl -X GET http://localhost:3000/api/user \
  -H "Authorization: Bearer $TOKEN"
```

### Update User Profile

```bash
curl -X PUT http://localhost:3000/api/user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "phone": "+1234567890"
  }'
```

## Wallets

### List Wallets

```bash
curl -X GET http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN"
```

### Transfer Gains to Available

```bash
curl -X POST http://localhost:3000/api/wallets/1/transfer_gains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.50",
    "source": "gains"
  }'
```

### Transfer Sale Balance (30-day locked funds)

```bash
curl -X POST http://localhost:3000/api/wallets/1/transfer_gains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "500.00",
    "source": "sale"
  }'
```

## Transactions

### List All Transactions

```bash
curl -X GET http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN"
```

## Deposits

### Initiate Deposit

```bash
curl -X POST http://localhost:3000/api/deposits/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "500.00",
    "currency": "XAF",
    "operateur": "orange",
    "phone": "+237671234567",
    "type": "FIAT"
  }'
```

### Check Deposit Status

```bash
curl -X GET http://localhost:3000/api/deposits/1/status \
  -H "Authorization: Bearer $TOKEN"
```

## Market

### List All Offers

```bash
curl -X GET http://localhost:3000/api/market/offers
```

### List Offers by Status

```bash
curl -X GET "http://localhost:3000/api/market/offers?status=open"
```

### Get Offer Details

```bash
curl -X GET http://localhost:3000/api/market/offers/1
```

## Investments

### List Investments

```bash
curl -X GET http://localhost:3000/api/investments \
  -H "Authorization: Bearer $TOKEN"
```

### Create Investment

```bash
curl -X POST http://localhost:3000/api/investments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1000.00",
    "currency": "USDT",
    "daily_rate": "0.025"
  }'
```

### Accrue Interest (Daily)

```bash
curl -X POST http://localhost:3000/api/investments/1/accrue \
  -H "Authorization: Bearer $TOKEN"
```

Response includes accrued interest calculated for days passed since last accrual.

### Encash Investment (Claim Interest)

```bash
curl -X POST http://localhost:3000/api/investments/1/encash \
  -H "Authorization: Bearer $TOKEN"
```

This moves accrued interest to wallet gains and deactivates the investment.

## Referrals

### Get Your Referral Code

```bash
curl -X GET http://localhost:3000/api/referrals/me \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "code": "REF_1_1234567890",
  "referrals": [
    {
      "id": 1,
      "referred_user": {
        "id": 2,
        "username": "bob_smith",
        "email": "bob@example.com"
      },
      "generation": 1,
      "status": "used",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## VIP

### List VIP Levels

```bash
curl -X GET http://localhost:3000/api/vip/levels
```

### Get Your VIP Subscriptions

```bash
curl -X GET http://localhost:3000/api/vip/subscriptions/me \
  -H "Authorization: Bearer $TOKEN"
```

### Purchase VIP Level

```bash
curl -X POST http://localhost:3000/api/vip/subscriptions/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vip_level_id": 2
  }'
```

## Withdrawals

### List Withdrawals

```bash
curl -X GET http://localhost:3000/api/withdrawals \
  -H "Authorization: Bearer $TOKEN"
```

### Create Withdrawal

```bash
curl -X POST http://localhost:3000/api/withdrawals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "200.00",
    "currency": "USDT"
  }'
```

## Crypto

### List Crypto Addresses

```bash
curl -X GET http://localhost:3000/api/crypto/addresses \
  -H "Authorization: Bearer $TOKEN"
```

### Add Crypto Address

```bash
curl -X POST http://localhost:3000/api/crypto/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coin": "BTC",
    "address": "1A1z7agoat8Bt16ySrx3otQeSKzexXvxomH"
  }'
```

## Advanced Examples

### Complete Investment Workflow

```bash
#!/bin/bash

# 1. Register
REGISTER=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investor@example.com",
    "username": "investor",
    "password": "Password123!"
  }')

TOKEN=$(echo $REGISTER | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

# 2. Check wallet
curl -s -X GET http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN" | jq .

# 3. Create investment (assuming balance available)
INVEST=$(curl -s -X POST http://localhost:3000/api/investments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1000",
    "currency": "USDT",
    "daily_rate": "0.025"
  }')

INV_ID=$(echo $INVEST | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Investment ID: $INV_ID"

# 4. Accrue interest
curl -s -X POST http://localhost:3000/api/investments/$INV_ID/accrue \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Encash
curl -s -X POST http://localhost:3000/api/investments/$INV_ID/encash \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## Error Handling

All endpoints return standard HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (access denied)
- **404**: Not Found
- **500**: Server Error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Insufficient available balance",
  "error": "Bad Request"
}
```

---

**Tip**: Use `jq` to format JSON responses: `curl ... | jq .`
