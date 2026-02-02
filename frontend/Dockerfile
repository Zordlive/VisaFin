# Frontend Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend code
COPY . .

# Build the app
RUN npm run build

# Use serve to run the built app
RUN npm install -g serve

EXPOSE 3000

# Serve the build
CMD ["serve", "-s", "dist", "-l", "3000"]
