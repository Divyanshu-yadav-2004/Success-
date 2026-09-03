# ── Build Stage ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy package files first for layer caching
COPY package*.json ./
RUN npm ci

# Copy source and prisma schema
COPY . .

# Build NestJS (npm run build executes prisma generate && nest build)
RUN npm run build

# ── Production Stage ──────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema (needed for migrations and client at runtime)
COPY prisma ./prisma

# Copy built application and generated prisma artifacts from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Run prisma migrations on start and launch production NestJS server
CMD ["sh", "-c", "npx prisma migrate deploy && node build/src/main.js"]