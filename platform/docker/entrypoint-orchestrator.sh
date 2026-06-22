#!/usr/bin/env bash
# Orchestrator startup: install platform deps, build the CLI, expose it on PATH,
# then idle so `docker compose exec orchestrator aidev ...` works.
set -euo pipefail

cd /workspace/platform

echo "[orchestrator] installing platform dependencies..."
pnpm install

echo "[orchestrator] building aidev CLI..."
npm run build

# Make `aidev` available as a bare command inside the container.
ln -sf /workspace/platform/dist/cli.js /usr/local/bin/aidev
chmod +x /workspace/platform/dist/cli.js || true

echo "[orchestrator] ready. Try: docker compose exec orchestrator aidev list"
# Keep the container alive.
tail -f /dev/null
