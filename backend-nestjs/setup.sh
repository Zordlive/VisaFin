#!/bin/bash

# CryptoInvest NestJS Backend - Installation Script
# This script automates the setup process

set -e

echo "=========================================="
echo "CryptoInvest Backend Setup"
echo "=========================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup environment
if [ ! -f .env ]; then
    echo ""
    echo "🔧 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
fi

# Generate Prisma client
echo ""
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Build
echo ""
echo "🏗️  Building application..."
npm run build

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Run 'npm run start:dev' to start development server"
echo "3. Visit http://localhost:3000 in your browser"
echo ""
