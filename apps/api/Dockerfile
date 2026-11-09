FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy API source and schema
COPY apps/api ./apps/api

WORKDIR /app/apps/api

# Generate Prisma Client & Build NestJS
RUN npx prisma generate
RUN npm run build

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm ci --omit=dev

WORKDIR /app/apps/api

COPY --from=builder /app/node_modules ./../../node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

