#!/usr/bin/env bash
# Bootstrap the AI dev platform: install dependencies and build the CLI.
# Safe to run repeatedly. Used by the orchestrator container entrypoint and for
# local setup (`bash platform/scripts/bootstrap.sh`).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"

echo "[bootstrap] installing platform dependencies..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
else
  npm install
fi

echo "[bootstrap] building aidev CLI..."
npm run build

echo "[bootstrap] done. Run: node dist/cli.js list   (or: npm run aidev -- list)"
