#!/bin/sh
# Runs `pnpm install` when package.json or the lockfile changed between two refs.
# Usage: install-deps.sh <old-ref> <new-ref>
FILES="package.json pnpm-lock.yaml pnpm-workspace.yaml"

if git diff --name-only "$1" "$2" -- $FILES | grep -q .; then
    echo "📦 Dependencies changed (package.json / lockfile), running pnpm install..."
    pnpm install --frozen-lockfile || pnpm install
fi
