FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist ./dist

# Copy Prisma schema
COPY prisma ./prisma

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]
