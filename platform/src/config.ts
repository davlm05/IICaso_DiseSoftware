/**
 * Platform configuration. Resolves repo/platform paths and model selection.
 *
 * Paths are derived from this file's location so the orchestrator works the same
 * on the host (`pnpm aidev ...`) and inside the Docker `orchestrator` container
 * (`docker compose exec orchestrator aidev ...`).
 */
import * as path from 'path';

export interface ModelConfig {
  /** Heavy reasoning: orchestrator, validation. */
  default: string;
  /** Lighter codegen / spec drafting. */
  light: string;
}

/**
 * How the orchestrator authenticates to Claude:
 * - 'api-key': use a metered ANTHROPIC_API_KEY.
 * - 'oauth':   use the logged-in Claude Code session / `ant auth login` OAuth
 *              token (the subscription), via ANTHROPIC_AUTH_TOKEN.
 * - 'auto':    prefer an explicit API key if present, else fall back to the
 *              OAuth token / an `ant` profile resolved by the SDK.
 */
export type AuthMode = 'auto' | 'api-key' | 'oauth';

/**
 * Which backend runs the agents:
 * - 'anthropic'   → raw Anthropic Messages API (needs an ANTHROPIC_API_KEY).
 * - 'claude-code' → the Claude Code CLI (`claude -p`), running on your Claude
 *                   Pro/Max subscription via CLAUDE_CODE_OAUTH_TOKEN.
 */
export type Provider = 'anthropic' | 'claude-code';

function resolveProvider(): Provider {
  const p = process.env.AIDEV_PROVIDER;
  if (p === 'claude-code' || p === 'anthropic') return p;
  // Auto: a subscription token + no API key means the raw API would 401, so use
  // Claude Code (which the token is actually valid for).
  const hasSubToken = !!(process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.ANTHROPIC_AUTH_TOKEN);
  return hasSubToken && !process.env.ANTHROPIC_API_KEY ? 'claude-code' : 'anthropic';
}

export interface PlatformConfig {
  repoRoot: string;
  platformRoot: string;
  specsDir: string;
  agentsDir: string;
  promptsDir: string;
  templatesDir: string;
  workspaceDir: string;
  readmePath: string;
  apiKey: string;
  /** OAuth bearer token (Claude Code subscription / `ant auth login`). */
  authToken: string;
  authMode: AuthMode;
  provider: Provider;
  models: ModelConfig;
  maxIterations: number;
  /** When true the engine never calls the LLM (used by tests and `--offline`). */
  offline: boolean;
  /** When true, /release-feature creates the branch + commit but does NOT push
   *  or open a PR (local-only release; avoids touching the remote). */
  skipPr: boolean;
}

/** Resolve which credential the LLM client should use, given the config. */
export function resolveAuth(cfg: PlatformConfig): {
  kind: 'api-key' | 'oauth' | 'sdk-default';
  apiKey?: string;
  authToken?: string;
} {
  if (cfg.authMode === 'api-key') return { kind: 'api-key', apiKey: cfg.apiKey };
  if (cfg.authMode === 'oauth') return { kind: 'oauth', authToken: cfg.authToken };
  // auto: explicit API key wins (matches SDK precedence), else OAuth token,
  // else let the SDK resolve an `ant auth login` profile from disk.
  if (cfg.apiKey) return { kind: 'api-key', apiKey: cfg.apiKey };
  if (cfg.authToken) return { kind: 'oauth', authToken: cfg.authToken };
  return { kind: 'sdk-default' };
}

export function loadConfig(overrides: Partial<PlatformConfig> = {}): PlatformConfig {
  // dist/ -> platform/ ; src/ -> platform/ (ts-node). Either way, one level up.
  const platformRoot = overrides.platformRoot ?? path.resolve(__dirname, '..');
  const repoRoot =
    overrides.repoRoot ?? process.env.REPO_ROOT ?? path.resolve(platformRoot, '..');

  return {
    platformRoot,
    repoRoot,
    specsDir: overrides.specsDir ?? path.join(platformRoot, 'specs'),
    agentsDir: overrides.agentsDir ?? path.join(platformRoot, 'agents'),
    promptsDir: overrides.promptsDir ?? path.join(platformRoot, 'prompts'),
    templatesDir: overrides.templatesDir ?? path.join(platformRoot, 'templates'),
    workspaceDir: overrides.workspaceDir ?? path.join(platformRoot, 'workspace'),
    readmePath: overrides.readmePath ?? path.join(repoRoot, 'README.md'),
    apiKey: overrides.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '',
    // Claude Code / `ant auth login` OAuth token reuses the subscription.
    // Use `||` (not `??`) so an env var set to an EMPTY string (e.g. Compose's
    // `${ANTHROPIC_AUTH_TOKEN:-}`) falls through to the next source.
    authToken:
      overrides.authToken ??
      (process.env.ANTHROPIC_AUTH_TOKEN ||
        process.env.CLAUDE_CODE_OAUTH_TOKEN ||
        ''),
    authMode: overrides.authMode ?? ((process.env.AIDEV_AUTH_MODE as AuthMode) || 'auto'),
    provider: overrides.provider ?? resolveProvider(),
    models: overrides.models ?? {
      default: process.env.AIDEV_MODEL ?? 'claude-opus-4-8',
      light: process.env.AIDEV_MODEL_LIGHT ?? 'claude-haiku-4-5-20251001',
    },
    maxIterations: overrides.maxIterations ?? Number(process.env.AIDEV_MAX_ITERATIONS ?? 24),
    offline: overrides.offline ?? process.env.AIDEV_OFFLINE === '1',
    skipPr: overrides.skipPr ?? process.env.AIDEV_SKIP_PR === '1',
  };
}
