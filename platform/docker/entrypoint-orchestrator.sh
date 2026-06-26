#!/usr/bin/env bash
# Orchestrator startup:
#   1. install platform deps + build the aidev CLI
#   2. (optional) install backend + frontend deps so /release-feature's quality
#      gates (pnpm test:unit, npm test, ...) can run INSIDE this container
#   3. configure git for the bind-mounted repo
#   4. idle so `docker compose exec orchestrator aidev ...` works
set -euo pipefail

REPO=/workspace
cd "$REPO/platform"

echo "[orchestrator] installing platform dependencies..."
pnpm install

echo "[orchestrator] building aidev CLI..."
npm run build

# Make `aidev` available as a bare command inside the container.
ln -sf "$REPO/platform/dist/cli.js" /usr/local/bin/aidev
chmod +x "$REPO/platform/dist/cli.js" || true

# Git needs to trust the bind-mounted repo (uid mismatch) and have an identity
# so /release-feature can branch + commit.
git config --global --add safe.directory "$REPO" || true
git config --global user.email "${GIT_AUTHOR_EMAIL:-aidev@smartcart.local}" || true
git config --global user.name "${GIT_AUTHOR_NAME:-SmartCart AI Platform}" || true

# When a GH_TOKEN is provided, authenticate gh AND wire it as git's credential
# helper so /release-feature's `git push` over HTTPS works non-interactively
# (and `gh pr create` can open the real PR). No token => stays local-only.
if [ -n "${GH_TOKEN:-}" ]; then
  echo "[orchestrator] GH_TOKEN present — configuring gh + git credentials for PRs..."
  echo "$GH_TOKEN" | gh auth login --with-token >/dev/null 2>&1 \
    && gh auth setup-git >/dev/null 2>&1 \
    && echo "[orchestrator] gh authenticated; git push will use it." \
    || echo "[orchestrator] WARN: gh auth failed; PR creation may fall back to local-only."
fi

# Install app deps so the release quality gates can run in-container. Set
# AIDEV_INSTALL_APP_DEPS=0 to skip (faster startup; run gates on the host).
if [ "${AIDEV_INSTALL_APP_DEPS:-1}" != "0" ]; then
  if [ -d "$REPO/backend" ]; then
    echo "[orchestrator] installing backend dependencies (pnpm)..."
    (cd "$REPO/backend" && pnpm install && pnpm prisma:generate) || \
      echo "[orchestrator] WARN: backend install failed; gates may not run in-container"
  fi
  if [ -d "$REPO/frontend" ]; then
    echo "[orchestrator] installing frontend dependencies (npm)..."
    (cd "$REPO/frontend" && npm install) || \
      echo "[orchestrator] WARN: frontend install failed; gates may not run in-container"
  fi
fi

echo "[orchestrator] ready. Try: docker compose exec orchestrator aidev list"
# Keep the container alive.
tail -f /dev/null
