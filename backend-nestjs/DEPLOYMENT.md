# Deployment Guide

## Hostinger Deployment

### Prerequisites

- Hostinger account with SSH access
- Domain name (optional but recommended)
- PostgreSQL database (recommended for production)

## Step 1: Prepare Application

### Build locally

```bash
npm run build
npm run lint
npm run test
```

### Create .env.production

```env
DATABASE_URL="postgresql://user:password@host:5432/cryptoinvest_db"
JWT_SECRET="your-long-random-secret-key-at-least-32-chars"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="production"
FRONTEND_URL="https://yourdomain.com"
```

## Step 2: Upload to Hostinger

### Option A: Git Deployment (Recommended)

1. Create GitHub/GitLab repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/cryptoinvest-backend.git
git push -u origin main
```

2. SSH into Hostinger server

```bash
ssh user@your-server-ip
```

3. Clone repository

```bash
cd ~/public_html  # or your preferred directory
git clone https://github.com/username/cryptoinvest-backend.git
cd cryptoinvest-backend
```

### Option B: Upload via FTP/cPanel

1. Download the repository as ZIP
2. Extract on your computer
3. Upload via FTP to Hostinger
4. Connect via SSH and navigate to directory

## Step 3: Install on Server

```bash
# Navigate to project
cd cryptoinvest-backend

# Install production dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Create .env file
nano .env
# Paste your production environment variables
```

## Step 4: Database Setup

### PostgreSQL on Hostinger

1. Access cPanel → MySQL/PostgreSQL
2. Create new database and user
3. Add to `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

4. Run migrations:

```bash
npx prisma migrate deploy
```

### SQLite (Simple, not recommended for production)

```bash
# Database will be created automatically
npx prisma migrate deploy
```

## Step 5: Build and Start

```bash
# Build TypeScript
npm run build

# Start with PM2 (persistent process manager)
npm install -g pm2
pm2 start dist/main.js --name cryptoinvest-api
pm2 save
pm2 startup
```

## Step 6: Configure Web Server

### If using Nginx

Create `/etc/nginx/sites-available/cryptoinvest-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Certificates (use Let's Encrypt via certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Reverse proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS handling
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cryptoinvest-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### If using Apache (cPanel)

1. Go to cPanel → Domains
2. Point your domain to the public directory
3. Create `.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
</IfModule>
```

4. Configure reverse proxy in cPanel (if available)

## Step 7: SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d api.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

## Step 8: Monitor and Maintain

### View application logs

```bash
pm2 logs cryptoinvest-api
```

### Monitor processes

```bash
pm2 monit
```

### Update application

```bash
cd ~/cryptoinvest-backend
git pull origin main
npm install
npm run build
pm2 restart cryptoinvest-api
```

### Restart on server reboot

```bash
pm2 startup
pm2 save
```

## Production Checklist

- [ ] Changed `JWT_SECRET` to long random string
- [ ] Set `NODE_ENV=production`
- [ ] Using PostgreSQL database
- [ ] SSL certificate installed
- [ ] CORS properly configured for frontend domain
- [ ] Database backups scheduled
- [ ] PM2 logs monitored
- [ ] Environment variables secured
- [ ] Rate limiting enabled (optional)
- [ ] Database connection pooling configured

## Troubleshooting

### Application won't start

```bash
pm2 logs cryptoinvest-api  # Check logs
pm2 delete cryptoinvest-api
pm2 start dist/main.js --name cryptoinvest-api
```

### Database connection error

```bash
# Verify .env DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
npx prisma db execute --stdin < test.sql
```

### CORS errors

Verify `FRONTEND_URL` in `.env` matches your frontend domain exactly.

### High memory usage

```bash
# Check PM2 processes
pm2 status

# Restart PM2
pm2 kill
pm2 start dist/main.js --name cryptoinvest-api
```

## Performance Optimization

### Add caching

Install Redis and implement caching in services:

```bash
npm install redis ioredis
```

### Database optimization

```sql
-- Create indexes
CREATE INDEX idx_user_email ON auth_user(email);
CREATE INDEX idx_transaction_user ON api_transaction(wallet_id);
CREATE INDEX idx_investment_user ON api_investment(user_id);
```

### Enable gzip compression in Nginx

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

## Backup Strategy

### Automated backups

```bash
# Daily database backup
0 2 * * * pg_dump cryptoinvest_db | gzip > ~/backups/db-$(date +\%Y\%m\%d).sql.gz
```

### Store in cloud

Use AWS S3, Google Cloud Storage, or similar for offsite backups.

---

**Deployment Complete!** Your API is now live on Hostinger 🎉
