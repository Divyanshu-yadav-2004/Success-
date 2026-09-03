# ── Build Stage ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy package files first for layer caching
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client (must happen before build)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder_db"
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ── Production Stage ──────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema (needed for migrations at runtime)
COPY prisma ./prisma

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Generate Prisma client in production image
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder_db" npx prisma generate

# Expose port
EXPOSE 3000

# Run prisma migrations on start and launch production NestJS server
CMD ["sh", "-c", "npx prisma migrate deploy && node build/src/main.js"]