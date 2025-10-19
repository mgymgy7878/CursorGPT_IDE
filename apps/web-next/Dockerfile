FROM node:18-bullseye

WORKDIR /app

# Corepack ve pnpm cache setup
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    corepack enable && corepack prepare pnpm@10.18.3 --activate

ENV PNPM_HOME=/root/.local/share/pnpm \
    PNPM_CONFIG_STORE_DIR=/root/.local/share/pnpm/store \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=1

# Copy package files
COPY package*.json pnpm-lock.yaml ./
COPY apps/web-next/package*.json ./apps/web-next/

# Install dependencies with cache
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
WORKDIR /app/apps/web-next
RUN pnpm build

EXPOSE 3003

ENV HOST=0.0.0.0
ENV PORT=3003

CMD ["pnpm", "start"]