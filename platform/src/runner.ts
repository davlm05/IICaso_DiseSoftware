/**
 * Thin wrapper around child_process for running quality gates and tests.
 * Captures combined output and never throws on a non-zero exit — callers branch
 * on `.ok` so a failing gate becomes feedback, not a crash.
 */
import { spawnSync } from 'child_process';

export interface CommandResult {
  ok: boolean;
  code: number | null;
  output: string;
  command: string;
}

export interface RunOptions {
  cwd: string;
  /** Hard cap so a hung test run can't stall the whole pipeline. */
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export function run(command: string, args: string[], opts: RunOptions): CommandResult {
  const display = `${command} ${args.join(' ')}`.trim();
  const res = spawnSync(command, args, {
    cwd: opts.cwd,
    timeout: opts.timeoutMs ?? 15 * 60_000,
    env: { ...process.env, ...opts.env },
    encoding: 'utf8',
    shell: process.platform === 'win32', // resolve .cmd shims (pnpm/npm) on Windows
  });
  const output = `${res.stdout ?? ''}${res.stderr ?? ''}`.trim();
  return {
    ok: res.status === 0,
    code: res.status,
    output,
    command: display,
  };
}
