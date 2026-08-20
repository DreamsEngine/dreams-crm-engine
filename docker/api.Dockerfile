FROM oven/bun:1.3 AS build
WORKDIR /repo

# prisma.config.ts resolves DATABASE_URL at load time, so `prisma generate`
# (postinstall) needs a value during the build. Compose overrides it at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY . .
RUN bun install --frozen-lockfile
RUN bun run --filter=api build

ENV NODE_ENV=production
EXPOSE 3001

# Migrations run before boot so a fresh database is usable on first deploy.
CMD ["sh", "-c", "cd packages/db && bunx prisma migrate deploy && cd /repo && bun apps/api/dist/main.js"]
