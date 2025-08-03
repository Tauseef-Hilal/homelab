# --------------------------------
# Base stage (common to dev/prod)
# --------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# Enable PNPM & install global tools
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root configs early for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Install root deps (workspace layout aware)
RUN pnpm install

# ------------------------
# Development stage
# ------------------------
FROM base AS dev
COPY . .

# Install workspace dependencies
RUN pnpm install --recursive

# Start the server in dev mode
CMD ["pnpm", "--filter", "./packages/server", "dev"]