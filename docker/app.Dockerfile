# Next.js builds and runs on Node here: Bun 1.3 segfaults (SIGILL) running
# `next build` on x64 linux. Bun is copied in only as the package installer.
FROM node:22-slim AS build
COPY --from=oven/bun:1.3 /usr/local/bin/bun /usr/local/bin/bun
COPY --from=oven/bun:1.3 /usr/local/bin/bunx /usr/local/bin/bunx
WORKDIR /repo

# prisma.config.ts resolves DATABASE_URL at load time, so `prisma generate`
# (postinstall) needs a value during the build. Compose overrides it at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY . .
RUN bun install --frozen-lockfile

# API_URL/APP_URL are inlined into the browser bundle at build time, so they
# must be build args, not runtime env.
ARG API_URL
ARG APP_URL
ARG LOCALE=en
ENV API_URL=$API_URL APP_URL=$APP_URL LOCALE=$LOCALE NODE_ENV=production

RUN cd apps/app && node node_modules/next/dist/bin/next build

EXPOSE 3000
CMD ["sh", "-c", "cd apps/app && node node_modules/next/dist/bin/next start -p 3000"]
