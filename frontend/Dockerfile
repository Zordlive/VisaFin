# Frontend Dockerfile - Multi-stage build
FROM node:22-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Serve the build
CMD ["serve", "-s", "dist", "-l", "3000"]
