# --- build stage
FROM node:20-alpine AS build
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy package files
COPY pnpm-*.yaml package.json ./
COPY packages ./packages
COPY services/executor ./services/executor

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build executor bundle
RUN pnpm --filter services/executor run build

# --- production stage (distroless)
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=4001

# Copy only the built bundle
COPY --from=build /app/services/executor/dist/bundle.cjs ./bundle.cjs

# Expose port
EXPOSE 4001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:4001/api/public/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]

# Start the application
CMD ["bundle.cjs"] 