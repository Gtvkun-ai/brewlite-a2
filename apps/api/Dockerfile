FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Copy API source and schema before install so postinstall prisma generate can run if needed
COPY apps/api ./apps/api

# Install dependencies and build
RUN npm ci

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

WORKDIR /app/apps/api

# Copy pre-built production node_modules, compiled dist and prisma schema from builder
COPY --from=builder /app/node_modules ./../../node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
