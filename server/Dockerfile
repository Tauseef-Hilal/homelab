# -------- Base Layer --------
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# -------- Dependencies Layer --------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
RUN if [ "$NODE_ENV" = "development" ]; then \
      pnpm install; \
    else \
      pnpm install --frozen-lockfile --prod; \
    fi

# -------- Build Layer (for TS/Next.js/etc) --------
FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN pnpm run build

# -------- Final Runtime Layer --------
FROM base AS runner
WORKDIR /app

# Don't run as root
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -G appgroup -u 1001
USER appuser

COPY --chown=appuser:appgroup --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup . .

EXPOSE 3000
CMD ["pnpm", "run", "start"]
