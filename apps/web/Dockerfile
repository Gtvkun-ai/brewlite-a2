FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy Web source
COPY apps/web ./apps/web

WORKDIR /app/apps/web

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

RUN npm ci --omit=dev

WORKDIR /app/apps/web

COPY --from=builder /app/apps/web/.next ./.next
# COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/node_modules ./../../node_modules

EXPOSE 3000

CMD ["npm", "start"]

