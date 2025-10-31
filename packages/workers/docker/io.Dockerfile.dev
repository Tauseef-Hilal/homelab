# --------------------------------
# Base stage (common to dev/prod)
# --------------------------------
FROM node:20-slim AS base
WORKDIR /app

# Enable PNPM & install global tools
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root configs early for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Install root dependencies (monorepo-aware)
RUN pnpm install

# ------------------------
# Development stage
# ------------------------
FROM base AS dev

# Copy all source code into container
COPY . .

# Install all workspace dependencies
RUN pnpm install --recursive

# Start the worker in dev mode (replace with your actual entry command)
CMD ["pnpm", "--filter", "./packages/workers", "dev:io"]
