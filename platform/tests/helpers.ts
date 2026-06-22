/** Shared test helpers: build an isolated temp repo + config. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadConfig, PlatformConfig } from '../src/config';

const REAL_TEMPLATES = path.resolve(__dirname, '..', 'templates');

export function makeTempConfig(overrides: Partial<PlatformConfig> = {}): PlatformConfig {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aidev-test-'));
  const platformRoot = path.join(repoRoot, 'platform');
  fs.mkdirSync(platformRoot, { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, 'README.md'),
    [
      '# UX Analysis',
      'intro',
      '# Frontend Design',
      '## 1.1. Technology Stack',
      'React Native + Expo.',
      '# 2. Backend Design',
      '## 2.1. Technology Stack',
      'NestJS + Prisma.',
      '# Appendix',
      'end',
    ].join('\n'),
    'utf8',
  );

  return loadConfig({
    repoRoot,
    platformRoot,
    specsDir: path.join(platformRoot, 'specs'),
    agentsDir: path.join(platformRoot, 'agents'),
    promptsDir: path.join(platformRoot, 'prompts'),
    templatesDir: REAL_TEMPLATES, // reuse the real spec templates
    workspaceDir: path.join(platformRoot, 'workspace'),
    readmePath: path.join(repoRoot, 'README.md'),
    offline: true,
    apiKey: '',
    ...overrides,
  });
}

export function cleanup(cfg: PlatformConfig): void {
  try {
    fs.rmSync(cfg.repoRoot, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}
