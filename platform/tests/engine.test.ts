import * as fs from 'fs';
import * as path from 'path';
import { Engine } from '../src/engine';
import { Logger } from '../src/logger';
import { ScaffoldStrategy } from '../src/strategy';
import { SPEC_DOMAINS } from '../src/types';
import { cleanup, makeTempConfig } from './helpers';

describe('Engine (offline scaffold strategy)', () => {
  it('drives feature -> build -> validate through the state machine', async () => {
    const cfg = makeTempConfig();
    try {
      const engine = new Engine(cfg, new Logger('test'), new ScaffoldStrategy(cfg));

      const specified = await engine.feature('Implement customer self-service password reset');
      expect(specified.status).toBe('SPECIFIED');
      // All six spec domains produced.
      for (const d of SPEC_DOMAINS) {
        expect(specified.specs[d]).toBeDefined();
        expect(fs.existsSync(path.join(cfg.repoRoot, specified.specs[d]!))).toBe(true);
      }

      const built = await engine.buildFeature(specified.id);
      expect(built.status).toBe('BUILT');
      expect(built.build!.touchedPaths.length).toBeGreaterThan(0);

      const validated = await engine.validateFeature(specified.id);
      expect(validated.status).toBe('VALIDATED');
      expect(validated.validation!.pass).toBe(true);
      expect(validated.tests!.paths.length).toBeGreaterThan(0);
    } finally {
      cleanup(cfg);
    }
  });

  it('enforces status preconditions (cannot build before specifying)', async () => {
    const cfg = makeTempConfig();
    try {
      const engine = new Engine(cfg, new Logger('test'), new ScaffoldStrategy(cfg));
      const m = await engine.feature('Feature A');
      await engine.buildFeature(m.id);
      await engine.validateFeature(m.id);
      // Re-building a VALIDATED feature is not an allowed transition.
      await expect(engine.buildFeature(m.id)).rejects.toThrow(/expected one of/);
    } finally {
      cleanup(cfg);
    }
  });

  it('routes feedback when validation fails (no tests authored)', async () => {
    const cfg = makeTempConfig();
    try {
      // Strategy whose validate() always fails, to exercise the feedback path.
      const strat = new ScaffoldStrategy(cfg);
      jest.spyOn(strat, 'validate').mockResolvedValue({
        pass: false,
        summary: 'forced failure',
        checks: [
          {
            name: 'x',
            dimension: 'security',
            pass: false,
            severity: 'error',
            detail: 'missing input validation',
          },
        ],
        feedback: [{ agent: 'backend', issues: ['Add DTO validation'] }],
      });
      const authorSpy = jest.spyOn(strat, 'authorTests');
      const engine = new Engine(cfg, new Logger('test'), strat);

      const m = await engine.feature('Feature B');
      await engine.buildFeature(m.id);
      const result = await engine.validateFeature(m.id);

      expect(result.status).toBe('VALIDATION_FAILED');
      expect(result.validation!.feedback[0].agent).toBe('backend');
      expect(authorSpy).not.toHaveBeenCalled();
    } finally {
      cleanup(cfg);
    }
  });
});

describe('Engine quality gates', () => {
  it('returns no gates when neither backend/ nor frontend/ exist', () => {
    const cfg = makeTempConfig();
    try {
      const engine = new Engine(cfg, new Logger('test'), new ScaffoldStrategy(cfg));
      expect(engine.qualityGates()).toHaveLength(0);
    } finally {
      cleanup(cfg);
    }
  });

  it('includes backend + frontend gates when those dirs exist', () => {
    const cfg = makeTempConfig();
    try {
      fs.mkdirSync(path.join(cfg.repoRoot, 'backend'), { recursive: true });
      fs.mkdirSync(path.join(cfg.repoRoot, 'frontend'), { recursive: true });
      const engine = new Engine(cfg, new Logger('test'), new ScaffoldStrategy(cfg));
      const names = engine.qualityGates().map((g) => g.name);
      expect(names).toEqual(
        expect.arrayContaining(['backend:lint', 'backend:type-check', 'frontend:typecheck']),
      );
    } finally {
      cleanup(cfg);
    }
  });
});
