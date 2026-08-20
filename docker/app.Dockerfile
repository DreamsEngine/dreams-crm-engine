FROM oven/bun:1.3 AS build
WORKDIR /repo

COPY . .
RUN bun install --frozen-lockfile

# API_URL/APP_URL are inlined into the browser bundle at build time, so they
# must be build args, not runtime env.
ARG API_URL
ARG APP_URL
ENV API_URL=$API_URL APP_URL=$APP_URL NODE_ENV=production

RUN bun run --filter=app build

EXPOSE 3000
CMD ["bun", "run", "--filter=app", "start"]
