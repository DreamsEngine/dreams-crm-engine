FROM oven/bun:1.3 AS build
WORKDIR /repo

# prisma generate (postinstall) and `eve build` both evaluate modules that
# resolve DATABASE_URL at load time. Compose overrides it at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV CRM_TELEMETRY_DISABLED="1"

COPY . .
RUN bun install --frozen-lockfile
RUN bun run --filter=agent build

ENV NODE_ENV=production
EXPOSE 2000
CMD ["bun", "run", "--filter=agent", "start"]
