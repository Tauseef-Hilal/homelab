# --------------------------------
# Base stage (common to dev/prod)
# --------------------------------
FROM node:20-slim AS base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
  build-essential \
  libc6-dev \
  libjpeg-dev \
  libpng-dev \
  libwebp-dev \
  libavif-dev \
  libvips-dev \
  ffmpeg \
  poppler-utils \
  bash \
  curl \
  && rm -rf /var/lib/apt/lists/*

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
CMD ["pnpm", "--filter", "./packages/thumbnail-worker", "dev"]
