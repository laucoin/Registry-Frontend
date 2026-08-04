# One immutable image (ADR 010/023): runtime wiring comes from NUXT_* env vars
# and a mounted config.json — never baked in at build time.
FROM node:24-alpine AS build
WORKDIR /app
ENV CI=true
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
# Placeholder presentation config — the real file is mounted at deploy
# (NUXT_APP_CONFIG_PATH) per ADR 023.
COPY --from=build /app/config ./config
EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]
