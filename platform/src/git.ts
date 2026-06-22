/**
 * Git + GitHub helpers for the release stage. Pure shell wrappers; the engine
 * decides policy (e.g. degrade to branch+commit when no remote/gh is available).
 */
import { run, CommandResult } from './runner';

export class Git {
  constructor(private readonly repoRoot: string) {}

  private git(...args: string[]): CommandResult {
    return run('git', args, { cwd: this.repoRoot });
  }

  currentBranch(): string {
    return this.git('rev-parse', '--abbrev-ref', 'HEAD').output.trim();
  }

  hasRemote(): boolean {
    return this.git('remote').output.trim().length > 0;
  }

  createBranch(name: string): CommandResult {
    return this.git('checkout', '-b', name);
  }

  add(paths: string[]): CommandResult {
    return this.git('add', ...paths);
  }

  commit(message: string): CommandResult {
    return this.git('commit', '-m', message);
  }

  push(branch: string): CommandResult {
    return this.git('push', '-u', 'origin', branch);
  }
}

export interface PrInput {
  repoRoot: string;
  branch: string;
  title: string;
  bodyFile: string;
  base?: string;
}

/** Returns the PR URL on success, or null when gh is unavailable/unauthenticated. */
export function openPullRequest(input: PrInput): { url: string | null; output: string } {
  const ghCheck = run('gh', ['--version'], { cwd: input.repoRoot });
  if (!ghCheck.ok) {
    return { url: null, output: 'gh CLI not available; skipping PR creation.' };
  }
  const res = run(
    'gh',
    [
      'pr',
      'create',
      '--head',
      input.branch,
      '--base',
      input.base ?? 'main',
      '--title',
      input.title,
      '--body-file',
      input.bodyFile,
    ],
    { cwd: input.repoRoot },
  );
  // gh prints the PR URL on success.
  const url = res.ok ? res.output.split(/\s+/).find((t) => t.startsWith('http')) ?? null : null;
  return { url, output: res.output };
}
