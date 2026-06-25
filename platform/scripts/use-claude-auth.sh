#!/usr/bin/env bash
# Reuse the logged-in Claude Code session / `ant auth login` subscription for the
# AI dev platform — no metered API key required.
#
# Usage:   source platform/scripts/use-claude-auth.sh
# (must be SOURCED, not executed, so the exports land in your shell)
#
# It exports ANTHROPIC_AUTH_TOKEN (+ ANTHROPIC_BASE_URL if the profile sets one)
# from the active `ant` profile and forces AIDEV_AUTH_MODE=oauth so the
# orchestrator authenticates with the subscription OAuth token.
set -euo pipefail

if ! command -v ant >/dev/null 2>&1; then
  echo "The Anthropic CLI (\`ant\`) is not installed." >&2
  echo "Install it (see platform/README.md), run \`ant auth login\`, then re-source this." >&2
  return 1 2>/dev/null || exit 1
fi

# print-credentials refreshes the token if needed and emits KEY=value lines.
set -a
eval "$(ant auth print-credentials --env)"
set +a
export AIDEV_AUTH_MODE=oauth
# Don't let a stale API key shadow the OAuth token (SDK precedence).
unset ANTHROPIC_API_KEY || true

echo "[auth] Using the logged-in Claude session (AIDEV_AUTH_MODE=oauth)."
echo "[auth] ant auth status:"
ant auth status || true
