import { FeatureStore, makeFeatureId, slugify } from '../src/feature-store';
import { cleanup, makeTempConfig } from './helpers';

describe('feature id + slug', () => {
  it('slugifies titles, strips diacritics, and caps length', () => {
    expect(slugify('Implement Password Reset')).toBe('implement-password-reset');
    expect(slugify('Añadir cupón!!')).toBe('anadir-cupon');
  });

  it('makeFeatureId is deterministic for the same title', () => {
    expect(makeFeatureId('Reset password')).toBe(makeFeatureId('Reset password'));
    expect(makeFeatureId('A')).not.toBe(makeFeatureId('B'));
  });

  it('feature id = slug + 6-char hash', () => {
    expect(makeFeatureId('Reset password')).toMatch(/^reset-password-[0-9a-f]{6}$/);
  });
});

describe('FeatureStore', () => {
  it('creates, loads, transitions status, and lists features', () => {
    const cfg = makeTempConfig();
    try {
      const store = new FeatureStore(cfg);
      const m = store.create('Reset password', 'desc');
      expect(m.status).toBe('SPECIFIED');
      expect(store.exists(m.id)).toBe(true);

      store.setStatus(m, 'BUILT', 'built it');
      const reloaded = store.load(m.id);
      expect(reloaded.status).toBe('BUILT');
      expect(reloaded.history.map((h) => h.event)).toContain('BUILT');

      expect(store.list().map((f) => f.id)).toContain(m.id);
    } finally {
      cleanup(cfg);
    }
  });

  it('throws on unknown feature id', () => {
    const cfg = makeTempConfig();
    try {
      expect(() => new FeatureStore(cfg).load('nope-000000')).toThrow(/Unknown feature-id/);
    } finally {
      cleanup(cfg);
    }
  });
});
