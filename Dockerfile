# One immutable image: runtime wiring comes from NUXT_* env vars
# and a mounted config.json — never baked in at build time.
FROM node:24-alpine AS build
WORKDIR /app
ENV CI=true
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# pnpm-workspace.yaml declares patchedDependencies, and pnpm hashes the patch
# files during install — they must land before it, not with the COPY . . below.
COPY patches ./patches
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
# Placeholder presentation config — the real file is mounted at deploy
# (NUXT_APP_CONFIG_PATH).
COPY --from=build /app/config ./config
EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]
