# Multi-stage build for Executor service
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/executor/package.json ./services/executor/
COPY packages/*/package.json ./packages/*/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build types and executor
RUN corepack enable pnpm && pnpm run build:types
RUN cd services/executor && pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 executor

# Copy built application
COPY --from=builder --chown=executor:nodejs /app/services/executor/dist ./dist
COPY --from=builder --chown=executor:nodejs /app/packages ./packages

USER executor

EXPOSE 4001

ENV PORT 4001

CMD ["node", "dist/index.cjs"]