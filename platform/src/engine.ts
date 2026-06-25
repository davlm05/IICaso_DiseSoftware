/**
 * The orchestrator engine. Owns the feature state machine and implements the
 * four Caso #2 commands by delegating the thinking to a FeatureStrategy:
 *
 *   feature         -> SPECIFIED
 *   build-feature   -> BUILT
 *   validate-feature-> VALIDATED   (or VALIDATION_FAILED + feedback)
 *   release-feature -> RELEASED    (or RELEASE_FAILED + feedback)
 */
import * as fs from 'fs';
import * as path from 'path';
import { PlatformConfig, resolveAuth } from './config';
import { FeatureStore } from './feature-store';
import { Git, openPullRequest } from './git';
import { Logger } from './logger';
import { AnthropicClient } from './llm';
import { run } from './runner';
import { AgentStrategy } from './agent-strategy';
import { FeatureStrategy, ScaffoldStrategy, renderReleaseNotes } from './strategy';
import { FeatureManifest, SPEC_DOMAINS } from './types';

export interface QualityGate {
  name: string;
  cwd: string;
  command: string;
  args: string[];
}

export class Engine {
  private store: FeatureStore;
  private git: Git;
  private _strategy?: FeatureStrategy;

  constructor(
    private readonly cfg: PlatformConfig,
    private readonly logger: Logger = new Logger('engine'),
    strategy?: FeatureStrategy,
  ) {
    this.store = new FeatureStore(cfg);
    this.git = new Git(cfg.repoRoot);
    this._strategy = strategy;
  }

  /**
   * Built lazily so read-only commands (`list`, `status`) work without an API
   * key. The online strategy only requires ANTHROPIC_API_KEY when first used.
   */
  private get strategy(): FeatureStrategy {
    if (!this._strategy) {
      this._strategy = this.cfg.offline
        ? new ScaffoldStrategy(this.cfg)
        : new AgentStrategy(this.cfg, new AnthropicClient(resolveAuth(this.cfg)), this.logger);
    }
    return this._strategy;
  }

  private workspace(id: string): string {
    return path.join(this.cfg.workspaceDir, id);
  }

  /** /feature "<description>" — Specification phase. */
  async feature(description: string): Promise<FeatureManifest> {
    const manifest = this.store.create(description, description);
    this.logger.info(`feature ${manifest.id}: specifying...`);
    await this.strategy.plan(manifest);
    for (const domain of SPEC_DOMAINS) {
      const spec = await this.strategy.authorSpec(manifest, domain);
      manifest.specs[domain] = spec.path;
      this.store.save(manifest);
      this.logger.info(`  spec[${domain}] -> ${spec.path}`);
    }
    this.store.setStatus(manifest, 'SPECIFIED', `${SPEC_DOMAINS.length} specs authored`);
    this.flush(manifest);
    return manifest;
  }

  /** /build-feature <id> — delegate implementation to domain agents. */
  async buildFeature(id: string): Promise<FeatureManifest> {
    const manifest = this.store.load(id);
    this.assertStatusIn(manifest, ['SPECIFIED', 'BUILD_FAILED', 'VALIDATION_FAILED']);
    this.logger.info(`feature ${id}: building...`);
    try {
      manifest.build = await this.strategy.build(manifest);
      this.store.save(manifest);
      this.store.setStatus(manifest, 'BUILT', manifest.build.summary);
    } catch (err) {
      this.store.setStatus(manifest, 'BUILD_FAILED', (err as Error).message);
      throw err;
    }
    this.flush(manifest);
    return manifest;
  }

  /** /validate-feature <id> — validation agent + (on pass) QA test authoring. */
  async validateFeature(id: string): Promise<FeatureManifest> {
    const manifest = this.store.load(id);
    this.assertStatusIn(manifest, ['BUILT', 'VALIDATION_FAILED']);
    this.logger.info(`feature ${id}: validating...`);
    const report = await this.strategy.validate(manifest);
    manifest.validation = report;
    this.store.save(manifest);

    if (!report.pass) {
      this.store.setStatus(manifest, 'VALIDATION_FAILED', report.summary);
      this.logger.warn(`validation failed: ${report.summary}`);
      for (const fb of report.feedback) {
        this.logger.warn(`  -> ${fb.agent}: ${fb.issues.join('; ')}`);
      }
      this.flush(manifest);
      return manifest;
    }

    manifest.tests = await this.strategy.authorTests(manifest);
    this.store.save(manifest);
    this.store.setStatus(manifest, 'VALIDATED', `validated + ${manifest.tests.paths.length} test(s)`);
    this.flush(manifest);
    return manifest;
  }

  /** /release-feature <id> — tests, gates, CI, release notes, branch, PR. */
  async releaseFeature(id: string): Promise<FeatureManifest> {
    const manifest = this.store.load(id);
    this.assertStatusIn(manifest, ['VALIDATED', 'RELEASE_FAILED']);
    this.logger.info(`feature ${id}: releasing...`);

    // 1-3. Tests + quality gates + CI parity (the same commands CI runs).
    const gates = this.qualityGates();
    const failures: string[] = [];
    for (const gate of gates) {
      const res = run(gate.command, gate.args, { cwd: gate.cwd });
      this.appendLog(manifest, `gate:${gate.name}`, res.output);
      if (!res.ok) {
        failures.push(`${gate.name} (${res.command}) exited ${res.code}`);
        this.logger.warn(`gate failed: ${gate.name}`);
      } else {
        this.logger.info(`gate ok: ${gate.name}`);
      }
    }

    if (failures.length > 0) {
      manifest.release = {
        branch: `feature/${id}`,
        testsPassed: false,
        qualityGatesPassed: false,
        notes: `Quality gates failed: ${failures.join('; ')}`,
      };
      this.store.setStatus(manifest, 'RELEASE_FAILED', failures.join('; '));
      this.flush(manifest);
      return manifest;
    }

    // 4. Release notes.
    const notes = await this.strategy.releaseNotes(manifest);
    const notesRel = `platform/specs/${id}/RELEASE_NOTES.md`;
    fs.writeFileSync(path.join(this.cfg.repoRoot, notesRel), notes, 'utf8');

    // 5-6. Branch, commit, (push), PR.
    const branch = `feature/${id}`;
    const release = {
      branch,
      releaseNotesPath: notesRel,
      testsPassed: true,
      qualityGatesPassed: true,
      prUrl: undefined as string | undefined,
      notes: 'Released.',
    };

    this.git.createBranch(branch);
    this.git.add(['.']);
    this.git.commit(`feat: ${manifest.title}\n\nFeature ${id}. See ${notesRel}.`);

    if (this.git.hasRemote()) {
      this.git.push(branch);
      const pr = openPullRequest({
        repoRoot: this.cfg.repoRoot,
        branch,
        title: `feat: ${manifest.title}`,
        bodyFile: path.join(this.cfg.repoRoot, notesRel),
      });
      release.prUrl = pr.url ?? undefined;
      release.notes = pr.url ? `PR opened: ${pr.url}` : `Branch pushed; PR skipped: ${pr.output}`;
    } else {
      release.notes = 'No git remote configured; created local branch + commit, PR skipped.';
      this.logger.warn(release.notes);
    }

    manifest.release = release;
    this.store.setStatus(manifest, 'RELEASED', release.notes);
    this.flush(manifest);
    return manifest;
  }

  /** The quality gates / CI-parity commands run by /release-feature. */
  qualityGates(): QualityGate[] {
    const backend = path.join(this.cfg.repoRoot, 'backend');
    const frontend = path.join(this.cfg.repoRoot, 'frontend');
    const pm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const gates: QualityGate[] = [];
    if (fs.existsSync(backend)) {
      gates.push(
        { name: 'backend:lint', cwd: backend, command: pm, args: ['lint'] },
        { name: 'backend:type-check', cwd: backend, command: pm, args: ['type-check'] },
        // --passWithNoTests: a frontend-only feature must not fail just because
        // the backend has no spec for it. Real backend specs still run + gate.
        // NB: pnpm forwards trailing flags WITHOUT a `--` separator (npm needs
        // one); passing `--` here makes jest treat the flag as a path pattern.
        {
          name: 'backend:test:unit',
          cwd: backend,
          command: pm,
          args: ['test:unit', '--passWithNoTests'],
        },
      );
    }
    if (fs.existsSync(frontend)) {
      gates.push(
        { name: 'frontend:typecheck', cwd: frontend, command: npm, args: ['run', 'typecheck'] },
        {
          name: 'frontend:test',
          cwd: frontend,
          command: npm,
          args: ['test', '--', '--passWithNoTests'],
        },
      );
    }
    return gates;
  }

  list(): FeatureManifest[] {
    return this.store.list();
  }

  status(id: string): FeatureManifest {
    return this.store.load(id);
  }

  // --- helpers ---

  private assertStatusIn(manifest: FeatureManifest, allowed: FeatureManifest['status'][]): void {
    if (!allowed.includes(manifest.status)) {
      throw new Error(
        `Feature ${manifest.id} is ${manifest.status}; expected one of ${allowed.join(', ')}.`,
      );
    }
  }

  private appendLog(manifest: FeatureManifest, label: string, content: string): void {
    const file = path.join(this.workspace(manifest.id), 'release.log');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `\n=== ${label} ===\n${content}\n`, 'utf8');
  }

  private flush(manifest: FeatureManifest): void {
    this.logger.flushTo(path.join(this.workspace(manifest.id), 'engine.log'));
  }
}

export { renderReleaseNotes };
