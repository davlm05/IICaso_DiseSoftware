/**
 * Online strategy: drives real Claude agents. Maps each spec domain and build
 * concern to the responsible agent, hands it the relevant template + spec
 * context, and records the files it writes.
 */
import * as fs from 'fs';
import * as path from 'path';
import { AgentDefinition, AgentRunner, loadAgentDefinition } from './agent-runner';
import { PlatformConfig } from './config';
import { Logger } from './logger';
import { LlmClient } from './llm';
import {
  FeatureStrategy,
  SpecResult,
  fillTokens,
  loadTemplate,
  renderReleaseNotes,
  specPath,
} from './strategy';
import {
  AgentName,
  BuildRecord,
  FeatureManifest,
  SpecDomain,
  TestsRecord,
  ValidationReport,
} from './types';

const DOMAIN_AGENT: Record<SpecDomain, AgentName> = {
  frontend: 'frontend',
  backend: 'backend',
  data: 'data',
  observability: 'infra',
  cicd: 'infra',
  testing: 'qa',
};

const BUILD_AGENTS: AgentName[] = ['backend', 'data', 'frontend', 'infra'];

export class AgentStrategy implements FeatureStrategy {
  private runner: AgentRunner;
  private defs = new Map<AgentName, AgentDefinition>();

  constructor(
    private readonly cfg: PlatformConfig,
    llm: LlmClient,
    private readonly logger: Logger,
  ) {
    this.runner = new AgentRunner(cfg, llm, logger);
  }

  private def(name: AgentName): AgentDefinition {
    let d = this.defs.get(name);
    if (!d) {
      d = loadAgentDefinition(this.cfg, name);
      this.defs.set(name, d);
    }
    return d;
  }

  private readSpec(rel: string): string {
    const abs = path.join(this.cfg.repoRoot, rel);
    return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  }

  private allSpecsContext(manifest: FeatureManifest): string {
    return Object.entries(manifest.specs)
      .map(([d, p]) => `### ${d} spec (${p})\n${this.readSpec(p as string)}`)
      .join('\n\n');
  }

  async plan(manifest: FeatureManifest): Promise<{ summary: string }> {
    const res = await this.runner.run(this.def('orchestrator'), {
      task:
        `Produce a concise cross-cutting plan for the feature "${manifest.title}". ` +
        `Identify the frontend, backend, data, observability, testing and CI/CD concerns ` +
        `and any risks. Do NOT write code or specs yet.`,
      context: `Feature description:\n${manifest.description}`,
      allowWrites: false,
    });
    return { summary: String(res.result.summary ?? 'Plan complete.') };
  }

  async authorSpec(manifest: FeatureManifest, domain: SpecDomain): Promise<SpecResult> {
    const agent = this.def(DOMAIN_AGENT[domain]);
    const rel = specPath(this.cfg, domain, manifest.id);
    const template = loadTemplate(this.cfg, `spec-${domain}.md`);
    const res = await this.runner.run(agent, {
      task:
        `Author the **${domain}** specification for the feature "${manifest.title}". ` +
        `Fill in the provided template, grounded in the existing codebase and your bound ` +
        `README design section. Write the completed spec with write_file to exactly: ${rel}. ` +
        `Then submit_result.`,
      context:
        `Feature description:\n${manifest.description}\n\n` +
        `## Template to fill (tokens already substituted where known)\n` +
        (template ? fillTokens(template, manifest) : '(no template found; use a sensible structure)'),
      allowWrites: true,
    });
    return { path: rel, summary: String(res.result.summary ?? `Authored ${domain} spec.`) };
  }

  async build(manifest: FeatureManifest): Promise<BuildRecord> {
    const touched: string[] = [];
    const specs = this.allSpecsContext(manifest);
    for (const name of BUILD_AGENTS) {
      const res = await this.runner.run(this.def(name), {
        task:
          `Implement the **${name}** portion of the feature "${manifest.title}" according to the ` +
          `approved specifications. Write production-ready code into the real source tree ` +
          `(frontend/ or backend/) following existing conventions, then submit_result.`,
        context: `Approved specifications:\n${specs}`,
        allowWrites: true,
      });
      touched.push(...res.edits.map((e) => e.path));
      this.logger.info(`build: ${name} wrote ${res.edits.length} file(s)`);
    }
    return {
      agents: BUILD_AGENTS,
      touchedPaths: Array.from(new Set(touched)),
      summary: `Implemented by ${BUILD_AGENTS.join(', ')}.`,
    };
  }

  async validate(manifest: FeatureManifest): Promise<ValidationReport> {
    const touched = manifest.build?.touchedPaths ?? [];
    const diff = touched
      .map((p) => `### ${p}\n${this.readSpec(p)}`)
      .join('\n\n')
      .slice(0, 40_000);
    const res = await this.runner.run(this.def('validation'), {
      task:
        `Validate the implementation of "${manifest.title}" against its specifications and the ` +
        `binding README design sections. Check functional requirements, architectural compliance, ` +
        `specification compliance, security (OWASP), and coding standards. Return a structured ` +
        `report via submit_result. On any failure, populate "feedback" with the responsible agent ` +
        `and concrete issues.`,
      context:
        `Specifications:\n${this.allSpecsContext(manifest)}\n\n` +
        `Implemented files:\n${diff || '(none recorded)'}`,
      allowWrites: false,
    });
    return res.result as unknown as ValidationReport;
  }

  async authorTests(manifest: FeatureManifest): Promise<TestsRecord> {
    const res = await this.runner.run(this.def('qa'), {
      task:
        `Author unit, integration and contract tests for "${manifest.title}" using the existing ` +
        `Jest setups (backend apps/api/jest.*.config.ts and the frontend jest-expo config). ` +
        `Write the test files with write_file, then submit_result with the list of paths.`,
      context:
        `Specifications:\n${this.allSpecsContext(manifest)}\n\n` +
        `Implemented files:\n${(manifest.build?.touchedPaths ?? []).join('\n')}`,
      allowWrites: true,
    });
    const paths = (res.result.paths as string[]) ?? res.edits.map((e) => e.path);
    return { paths, summary: String(res.result.summary ?? 'Tests authored.') };
  }

  async releaseNotes(manifest: FeatureManifest): Promise<string> {
    // Deterministic, reliable rendering from the manifest + template.
    return renderReleaseNotes(this.cfg, manifest);
  }
}
