import { loadReadmeSection } from '../src/readme';
import { cleanup, makeTempConfig } from './helpers';

describe('loadReadmeSection', () => {
  it('extracts §1 Frontend Design up to the next top-level header', () => {
    const cfg = makeTempConfig();
    try {
      const fe = loadReadmeSection(cfg.readmePath, 'frontend');
      expect(fe).toContain('# Frontend Design');
      expect(fe).toContain('React Native + Expo');
      expect(fe).not.toContain('Backend Design');
      expect(fe).not.toContain('# Appendix');
    } finally {
      cleanup(cfg);
    }
  });

  it('extracts §2 Backend Design up to the next top-level header', () => {
    const cfg = makeTempConfig();
    try {
      const be = loadReadmeSection(cfg.readmePath, 'backend');
      expect(be).toContain('# 2. Backend Design');
      expect(be).toContain('NestJS + Prisma');
      expect(be).not.toContain('Frontend Design');
      expect(be).not.toContain('# Appendix');
    } finally {
      cleanup(cfg);
    }
  });

  it('returns empty string for section "none"', () => {
    const cfg = makeTempConfig();
    try {
      expect(loadReadmeSection(cfg.readmePath, 'none')).toBe('');
    } finally {
      cleanup(cfg);
    }
  });
});
