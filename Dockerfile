# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# SI-PKL — Next.js 15 + Prisma + MySQL
#
# Target image:
#   runner   -> aplikasi produksi (dipakai service "app")
#   migrator -> Prisma CLI + schema + seed (dipakai service "migrator"/"seed")
# ---------------------------------------------------------------------------
ARG NODE_VERSION=22-bookworm-slim

FROM node:${NODE_VERSION} AS base
ENV NEXT_TELEMETRY_DISABLED=1
# openssl dibutuhkan Prisma; curl dipakai HEALTHCHECK.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------------------------------------------------------------------------
# Dependency installation (termasuk devDependencies untuk build & migrasi).
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# ---------------------------------------------------------------------------
# Build aplikasi Next.js (output standalone).
# ---------------------------------------------------------------------------
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate tidak membutuhkan koneksi DB, tetapi CLI meminta DATABASE_URL.
RUN DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" npx prisma generate
RUN DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" npm run build

# ---------------------------------------------------------------------------
# Image migrasi: `prisma migrate deploy` dan opsional `prisma db seed`.
# ---------------------------------------------------------------------------
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma
RUN DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" npx prisma generate
CMD ["npx", "prisma", "migrate", "deploy"]

# ---------------------------------------------------------------------------
# Runtime produksi.
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/app/uploads

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY docker/entrypoint.sh /usr/local/bin/si-pkl-entrypoint

RUN chmod +x /usr/local/bin/si-pkl-entrypoint \
    && mkdir -p /app/uploads \
    && chown -R nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
    CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/si-pkl-entrypoint"]
CMD ["node", "server.js"]
