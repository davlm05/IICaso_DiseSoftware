/**
 * Strategy layer. The engine drives the state machine and delegates the actual
 * "thinking" (spec authoring, code generation, validation, test authoring) to a
 * FeatureStrategy.
 *
 * - AgentStrategy (online) uses real Claude agents.
 * - ScaffoldStrategy (offline) produces deterministic, template-based artifacts
 *   so the whole pipeline is demonstrable and testable with no API key.
 */
import * as fs from 'fs';
import * as path from 'path';
import { PlatformConfig } from './config';
import {
  BuildRecord,
  FeatureManifest,
  SpecDomain,
  TestsRecord,
  ValidationReport,
} from './types';

export interface SpecResult {
  path: string;
  summary: string;
}

export interface FeatureStrategy {
  plan(manifest: FeatureManifest): Promise<{ summary: string }>;
  authorSpec(manifest: FeatureManifest, domain: SpecDomain): Promise<SpecResult>;
  build(manifest: FeatureManifest): Promise<BuildRecord>;
  validate(manifest: FeatureManifest): Promise<ValidationReport>;
  authorTests(manifest: FeatureManifest): Promise<TestsRecord>;
  releaseNotes(manifest: FeatureManifest): Promise<string>;
}

/** Relative path (from repo root) where a domain's spec for a feature lives. */
export function specPath(cfg: PlatformConfig, domain: SpecDomain, id: string): string {
  const abs = path.join(cfg.specsDir, domain, `${id}.md`);
  return path.relative(cfg.repoRoot, abs).replace(/\\/g, '/');
}

export function loadTemplate(cfg: PlatformConfig, name: string): string {
  const p = path.join(cfg.templatesDir, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

/** Fill {{TOKENS}} in a template string from the feature manifest. */
export function fillTokens(tpl: string, manifest: FeatureManifest): string {
  return tpl
    .replace(/{{TITLE}}/g, manifest.title)
    .replace(/{{ID}}/g, manifest.id)
    .replace(/{{DESCRIPTION}}/g, manifest.description)
    .replace(/{{DATE}}/g, new Date().toISOString().slice(0, 10));
}

export function renderReleaseNotes(cfg: PlatformConfig, manifest: FeatureManifest): string {
  const tpl =
    loadTemplate(cfg, 'release-notes.md') ||
    `# Release notes — {{TITLE}}\n\nFeature \`{{ID}}\`.\n\n{{DESCRIPTION}}\n`;
  const domains = Object.entries(manifest.specs)
    .map(([d, p]) => `- **${d}**: \`${p}\``)
    .join('\n');
  const tested = manifest.tests?.paths.map((p) => `- \`${p}\``).join('\n') ?? '- (none)';
  return fillTokens(tpl, manifest)
    .replace(/{{SPECS}}/g, domains || '- (none)')
    .replace(/{{TESTS}}/g, tested);
}

/**
 * Deterministic, no-LLM strategy. Fills the domain spec templates with the
 * feature description and writes minimal but real placeholder artifacts so the
 * end-to-end flow (spec -> build -> validate -> release) can be exercised
 * offline. Used by `--offline` and the platform test-suite.
 */
export class ScaffoldStrategy implements FeatureStrategy {
  constructor(private readonly cfg: PlatformConfig) {}

  private writeRepo(rel: string, content: string): string {
    const abs = path.join(this.cfg.repoRoot, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
    return rel.replace(/\\/g, '/');
  }

  async plan(manifest: FeatureManifest): Promise<{ summary: string }> {
    return { summary: `Offline scaffold plan for "${manifest.title}".` };
  }

  async authorSpec(manifest: FeatureManifest, domain: SpecDomain): Promise<SpecResult> {
    const tpl = loadTemplate(this.cfg, `spec-${domain}.md`);
    const header = `<!-- feature-id: ${manifest.id} | domain: ${domain} | generated offline -->\n`;
    const body = (tpl || `# ${domain} specification\n\n_TODO_\n`)
      .replace(/{{TITLE}}/g, manifest.title)
      .replace(/{{ID}}/g, manifest.id)
      .replace(/{{DESCRIPTION}}/g, manifest.description)
      .replace(/{{DATE}}/g, manifest.createdAt.slice(0, 10));
    const rel = specPath(this.cfg, domain, manifest.id);
    this.writeRepo(rel, header + body);
    return { path: rel, summary: `Scaffolded ${domain} spec.` };
  }

  async build(manifest: FeatureManifest): Promise<BuildRecord> {
    // Minimal placeholder so /build-feature produces a real, reviewable diff.
    const marker = `// AIDEV scaffold for feature ${manifest.id} — replace with real implementation.\n`;
    const fePath = this.writeRepo(
      `platform/workspace/${manifest.id}/build/frontend.placeholder.ts`,
      marker + `export const feature = ${JSON.stringify(manifest.title)};\n`,
    );
    const bePath = this.writeRepo(
      `platform/workspace/${manifest.id}/build/backend.placeholder.ts`,
      marker + `export const featureId = ${JSON.stringify(manifest.id)};\n`,
    );
    return {
      agents: ['frontend', 'backend', 'data', 'infra'],
      touchedPaths: [fePath, bePath],
      summary: 'Offline scaffold build (placeholders).',
    };
  }

  async validate(manifest: FeatureManifest): Promise<ValidationReport> {
    const specsPresent = Object.keys(manifest.specs).length >= 6;
    const built = !!manifest.build && manifest.build.touchedPaths.length > 0;
    const checks: ValidationReport['checks'] = [
      {
        name: 'All six spec domains present',
        dimension: 'specification',
        pass: specsPresent,
        severity: specsPresent ? 'info' : 'error',
        detail: `${Object.keys(manifest.specs).length}/6 specs found`,
      },
      {
        name: 'Build produced artifacts',
        dimension: 'functional',
        pass: built,
        severity: built ? 'info' : 'error',
        detail: built ? `${manifest.build!.touchedPaths.length} file(s)` : 'no build record',
      },
    ];
    const pass = checks.every((c) => c.pass);
    return {
      pass,
      summary: pass ? 'Offline validation passed.' : 'Offline validation failed.',
      checks,
      feedback: pass ? [] : [{ agent: 'orchestrator', issues: ['Run build before validate.'] }],
    };
  }

  async authorTests(manifest: FeatureManifest): Promise<TestsRecord> {
    const rel = this.writeRepo(
      `platform/workspace/${manifest.id}/tests/${manifest.id}.scaffold.test.ts`,
      `// AIDEV scaffold test for ${manifest.id}\n` +
        `describe(${JSON.stringify(manifest.title)}, () => {\n` +
        `  it('placeholder', () => { expect(true).toBe(true); });\n});\n`,
    );
    return { paths: [rel], summary: 'Offline scaffold tests.' };
  }

  async releaseNotes(manifest: FeatureManifest): Promise<string> {
    return renderReleaseNotes(this.cfg, manifest);
  }
}
