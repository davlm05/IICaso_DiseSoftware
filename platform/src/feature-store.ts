/**
 * Feature manifest persistence. One JSON file per feature at
 * platform/specs/<feature-id>/feature.json is the single source of truth for a
 * feature's status and artifacts, making every run traceable and resumable.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PlatformConfig } from './config';
import { FeatureManifest, FeatureStatus, HistoryEntry } from './types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (e.g. á -> a)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/** feature-id = slug + short content hash, so ids are stable yet collision-safe. */
export function makeFeatureId(title: string): string {
  const slug = slugify(title) || 'feature';
  const hash = crypto.createHash('sha1').update(title).digest('hex').slice(0, 6);
  return `${slug}-${hash}`;
}

export class FeatureStore {
  constructor(private readonly cfg: PlatformConfig) {}

  private dir(id: string): string {
    return path.join(this.cfg.specsDir, id);
  }

  private manifestPath(id: string): string {
    return path.join(this.dir(id), 'feature.json');
  }

  exists(id: string): boolean {
    return fs.existsSync(this.manifestPath(id));
  }

  create(title: string, description: string): FeatureManifest {
    const id = makeFeatureId(title);
    const now = new Date().toISOString();
    const manifest: FeatureManifest = {
      id,
      title,
      description,
      status: 'SPECIFIED',
      createdAt: now,
      updatedAt: now,
      specs: {},
      history: [{ at: now, event: 'created' }],
    };
    this.save(manifest);
    return manifest;
  }

  load(id: string): FeatureManifest {
    if (!this.exists(id)) {
      throw new Error(`Unknown feature-id "${id}". Run \`aidev feature "..."\` first.`);
    }
    return JSON.parse(fs.readFileSync(this.manifestPath(id), 'utf8')) as FeatureManifest;
  }

  save(manifest: FeatureManifest): void {
    manifest.updatedAt = new Date().toISOString();
    fs.mkdirSync(this.dir(manifest.id), { recursive: true });
    fs.writeFileSync(this.manifestPath(manifest.id), JSON.stringify(manifest, null, 2), 'utf8');
  }

  setStatus(manifest: FeatureManifest, status: FeatureStatus, detail?: string): FeatureManifest {
    manifest.status = status;
    const entry: HistoryEntry = { at: new Date().toISOString(), event: status, detail };
    manifest.history.push(entry);
    this.save(manifest);
    return manifest;
  }

  list(): FeatureManifest[] {
    if (!fs.existsSync(this.cfg.specsDir)) return [];
    return fs
      .readdirSync(this.cfg.specsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(this.cfg.specsDir, e.name, 'feature.json'))
      .filter((p) => fs.existsSync(p))
      .map((p) => JSON.parse(fs.readFileSync(p, 'utf8')) as FeatureManifest)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
