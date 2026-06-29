# syntax=docker/dockerfile:1.7
# Build context expected: monorepo root (the parent of `backend/`)

FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# ----- Builder stage -----
FROM base AS builder

COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY backend ./backend

RUN bun --filter=@linvnix/shared run build
RUN bun --filter=backend run build

# ----- Runner stage -----
FROM base AS runner

ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile --production

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/src/infrastructure/mail/templates ./backend/src/infrastructure/mail/templates

WORKDIR /app/backend

RUN mkdir -p uploads logs \
    && chown -R bun:bun /app

# Drop root privileges — the oven/bun alpine image ships a non-root `bun` user.
USER bun

EXPOSE 3000

# Liveness probe hits the @Public() /health endpoint under the global API
# prefix. wget is available in alpine; --spider checks the URL without saving.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- --spider http://127.0.0.1:3000/api/v1/health || exit 1

CMD ["bun", "dist/main.js"]
