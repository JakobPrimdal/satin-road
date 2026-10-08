ARG BUN_VERSION=1.3.14

FROM oven/bun:${BUN_VERSION}-slim AS base

WORKDIR /app

ENV NODE_ENV=production

FROM base AS build

ARG BUN_PUBLIC_API_URL
ENV BUN_PUBLIC_API_URL=$BUN_PUBLIC_API_URL

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    pkg-config \
    python-is-python3

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM base AS runtime

WORKDIR /app

COPY --from=build /app /app

EXPOSE 3000

USER bun

CMD ["bun", "run", "start"]