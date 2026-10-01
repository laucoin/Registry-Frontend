# syntax=docker/dockerfile:1

# ── base ──────────────────────────────────────────────────────────────────
# Debian-based (not alpine) to stay glibc-compatible with the distroless
# runtime image below. pnpm itself comes from `packageManager` in package.json
# via corepack — no separate version pin needed here.
FROM node:24-slim AS base
WORKDIR /app
RUN corepack enable

# ── deps ──────────────────────────────────────────────────────────────────
# Full install (incl. devDependencies) — needed to run `ng build`.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── build ─────────────────────────────────────────────────────────────────
# Produces dist/registry-frontend/{browser,server}. The real runtime config
# still comes entirely from the orchestrator's env vars (server.ts reads
# process.env fresh on every server start) — these placeholders exist only
# because `ng build` briefly boots server.ts in-process to extract the route
# manifest, and readRequiredEnv() would otherwise abort that throwaway run.
FROM deps AS build
COPY . .
ENV BACKEND_URL=http://build-placeholder.invalid \
    ORGANIZATION_NAME=build-placeholder \
    CREATOR_NAME=build-placeholder \
    CREATOR_EMAIL=build-placeholder@example.com \
    NODE_OPTIONS=--dns-result-order=ipv4first
# The route-extraction step ng build runs internally binds a throwaway server to
# `localhost`, then self-probes it by URL over `localhost` too — two independent DNS
# lookups. In this glibc/Debian image "localhost" can resolve to ::1 for one and
# 127.0.0.1 for the other, so the self-probe connects to a socket nothing is
# listening on. Forcing IPv4-first resolution makes both lookups agree.
RUN pnpm run build

# ── prod-deps ─────────────────────────────────────────────────────────────
# A second, separate `pnpm install` rather than pruning `deps`' node_modules:
# simpler, and pnpm's node_modules is self-contained (relative symlinks into
# its own node_modules/.pnpm), so this directory copies cleanly into the
# runtime stage below without dragging devDependencies along.
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# ── runtime ───────────────────────────────────────────────────────────────
# Distroless: no shell, no package manager, no OS userland — only the Node
# runtime and our app. `:nonroot` runs as uid/gid 65532 (never root).
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=prod-deps --chown=65532:65532 /app/node_modules ./node_modules
COPY --from=build --chown=65532:65532 /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 4000

# Required at runtime (BACKEND_URL, ORGANIZATION_NAME, CREATOR_NAME, CREATOR_EMAIL, ...)
# are intentionally not declared/defaulted here — see .env.example and server.ts's
# readRequiredEnv/readOptionalEnv. The orchestrator (Docker, k8s, PM2, ...) supplies them.
CMD ["dist/registry-frontend/server/server.mjs"]
