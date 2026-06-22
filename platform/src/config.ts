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
  models: ModelConfig;
  maxIterations: number;
  /** When true the engine never calls the LLM (used by tests and `--offline`). */
  offline: boolean;
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
    models: overrides.models ?? {
      default: process.env.AIDEV_MODEL ?? 'claude-opus-4-8',
      light: process.env.AIDEV_MODEL_LIGHT ?? 'claude-haiku-4-5-20251001',
    },
    maxIterations: overrides.maxIterations ?? Number(process.env.AIDEV_MAX_ITERATIONS ?? 24),
    offline: overrides.offline ?? process.env.AIDEV_OFFLINE === '1',
  };
}
