# ------------------------
# Base (shared for dev/prod)
# ------------------------
FROM node:20-alpine AS base
WORKDIR /app

# Enable PNPM
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root config for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Install root dependencies
RUN pnpm install

# ------------------------
# Development
# ------------------------
FROM base AS dev

# Copy entire monorepo
COPY . .

# Reinstall to get all workspace dependencies
RUN pnpm install --recursive

# Expose client port (optional but good)
EXPOSE 3000

# Start dev server
CMD ["pnpm", "--filter", "client", "dev"]
