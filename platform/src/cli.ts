#!/usr/bin/env node
/**
 * `aidev` CLI + REPL. Exposes the four Caso #2 commands:
 *
 *   aidev feature "Implement customer self-service password reset"
 *   aidev build-feature <id>
 *   aidev validate-feature <id>
 *   aidev release-feature <id>
 *
 * Plus: list, status <id>, and an interactive `repl` that accepts the literal
 * slash syntax (`/feature "..."`). Add `--offline` to run the deterministic,
 * no-API-key scaffold strategy.
 */
import * as readline from 'readline';
import { loadConfig, PlatformConfig } from './config';
import { Engine } from './engine';
import { Logger } from './logger';
import { FeatureManifest } from './types';

function printManifest(m: FeatureManifest): void {
  // eslint-disable-next-line no-console
  console.log(
    `\n  ${m.id}\n  status: ${m.status}\n  title : ${m.title}\n  specs : ${Object.keys(m.specs).join(', ') || '(none)'}` +
      (m.release?.prUrl ? `\n  PR    : ${m.release.prUrl}` : '') +
      '\n',
  );
}

async function dispatch(engine: Engine, argv: string[]): Promise<void> {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'feature': {
      const desc = rest.join(' ').replace(/^["']|["']$/g, '').trim();
      if (!desc) throw new Error('Usage: aidev feature "<description>"');
      printManifest(await engine.feature(desc));
      break;
    }
    case 'build-feature':
      printManifest(await engine.buildFeature(requireId(rest)));
      break;
    case 'validate-feature':
      printManifest(await engine.validateFeature(requireId(rest)));
      break;
    case 'release-feature':
      printManifest(await engine.releaseFeature(requireId(rest)));
      break;
    case 'status':
      printManifest(engine.status(requireId(rest)));
      break;
    case 'list': {
      const items = engine.list();
      if (items.length === 0) {
        // eslint-disable-next-line no-console
        console.log('No features yet. Try: aidev feature "..."');
      }
      items.forEach((m) => {
        // eslint-disable-next-line no-console
        console.log(`  ${m.status.padEnd(18)} ${m.id}  — ${m.title}`);
      });
      break;
    }
    default:
      printHelp();
  }
}

function requireId(rest: string[]): string {
  const id = rest[0];
  if (!id) throw new Error('A <feature-id> is required (see `aidev list`).');
  return id;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(`SmartCart AI dev platform — aidev

  aidev feature "<description>"     Generate cross-domain specifications
  aidev build-feature <id>          Implement the feature via domain agents
  aidev validate-feature <id>       Validate + author tests
  aidev release-feature <id>        Tests, gates, release notes, branch, PR
  aidev list                        List all features and their status
  aidev status <id>                 Show one feature
  aidev repl                        Interactive shell ( /feature "..." )

Flags: --offline (no API key; deterministic scaffold)`);
}

async function repl(cfg: PlatformConfig): Promise<void> {
  const engine = new Engine(cfg, new Logger('repl'));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'aidev> ' });
  // eslint-disable-next-line no-console
  console.log('aidev REPL — type /feature "..." or `help`, `exit`.');
  rl.prompt();
  rl.on('line', async (line) => {
    const input = line.trim().replace(/^\//, ''); // accept /feature and feature alike
    if (!input) return rl.prompt();
    if (input === 'exit' || input === 'quit') return rl.close();
    if (input === 'help') {
      printHelp();
      return rl.prompt();
    }
    try {
      await dispatch(engine, tokenize(input));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`error: ${(err as Error).message}`);
    }
    rl.prompt();
  });
  rl.on('close', () => process.exit(0));
}

/** Split a line into args, honoring quoted feature descriptions. */
function tokenize(line: string): string[] {
  const match = line.match(/"([^"]*)"|'([^']*)'|(\S+)/g) ?? [];
  return match.map((t) => t.replace(/^["']|["']$/g, ''));
}

async function main(): Promise<void> {
  const raw = process.argv.slice(2);
  const offline = raw.includes('--offline');
  const argv = raw.filter((a) => a !== '--offline');
  const cfg = loadConfig({ offline: offline || undefined });

  if (argv[0] === 'repl' || argv.length === 0) {
    if (argv[0] === 'repl') return repl(cfg);
    printHelp();
    return;
  }

  const engine = new Engine(cfg, new Logger('aidev'));
  await dispatch(engine, argv);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`\n✖ ${(err as Error).message}\n`);
  process.exit(1);
});
