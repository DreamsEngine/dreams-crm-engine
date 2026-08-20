FROM oven/bun:1.3 AS build
WORKDIR /repo

COPY . .
RUN bun install --frozen-lockfile
RUN bun run --filter=api build

ENV NODE_ENV=production
EXPOSE 3001

# Migrations run before boot so a fresh database is usable on first deploy.
CMD ["sh", "-c", "bunx --cwd packages/db prisma migrate deploy && bun apps/api/dist/main.js"]
