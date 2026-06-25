#!/usr/bin/env bash
# Reuse your Claude subscription for the AI dev platform — no metered API key.
#
# Usage:   source platform/scripts/use-claude-auth.sh
# (must be SOURCED, not executed, so the exports land in your shell)
#
# Resolves a subscription OAuth token in this order:
#   1. CLAUDE_CODE_OAUTH_TOKEN / ANTHROPIC_AUTH_TOKEN already in your env
#   2. `claude setup-token`  (Claude Code's own long-lived token — no `ant` needed)
#   3. `ant auth print-credentials` (only if the Anthropic CLI is installed)
# then forces AIDEV_AUTH_MODE=oauth and clears AIDEV_OFFLINE so real agents run.
set -uo pipefail

_token="${CLAUDE_CODE_OAUTH_TOKEN:-${ANTHROPIC_AUTH_TOKEN:-}}"

if [ -z "$_token" ] && command -v claude >/dev/null 2>&1; then
  echo "[auth] No token in env. Launching \`claude setup-token\` (opens a browser)..." >&2
  echo "[auth] When it prints a token, it will be captured automatically." >&2
  # setup-token prints the long-lived token (sk-ant-oat...) on the last line.
  _token="$(claude setup-token 2>/dev/null | grep -oE 'sk-ant-[A-Za-z0-9_-]+' | tail -1)"
fi

if [ -z "$_token" ] && command -v ant >/dev/null 2>&1; then
  set -a; eval "$(ant auth print-credentials --env)"; set +a
  _token="${ANTHROPIC_AUTH_TOKEN:-}"
fi

if [ -z "$_token" ]; then
  echo "[auth] Could not obtain a subscription token." >&2
  echo "       Run:  claude setup-token   then:  export CLAUDE_CODE_OAUTH_TOKEN=<token>" >&2
  echo "       and re-source this script. (Or just set ANTHROPIC_API_KEY for a metered key.)" >&2
  return 1 2>/dev/null || exit 1
fi

export CLAUDE_CODE_OAUTH_TOKEN="$_token"
export ANTHROPIC_AUTH_TOKEN="$_token"
export AIDEV_AUTH_MODE=oauth
export AIDEV_OFFLINE=0
unset ANTHROPIC_API_KEY || true   # don't let a stale key shadow the OAuth token

echo "[auth] Using your Claude subscription (AIDEV_AUTH_MODE=oauth, AIDEV_OFFLINE=0)."
echo "[auth] Token length: ${#_token} chars. The agents will now use this account."
