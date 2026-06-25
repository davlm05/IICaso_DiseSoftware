/**
 * Runs each agent through the **Claude Code CLI** (`claude -p`) instead of the
 * raw Anthropic API. This is what lets the platform run on a **Claude Pro/Max
 * subscription**: a `claude setup-token` OAuth token authenticates Claude Code
 * (via CLAUDE_CODE_OAUTH_TOKEN) but is rejected by the public Messages API.
 *
 * Claude Code uses its own Read/Write/Edit tools to do the work in the repo, so
 * there is no custom tool loop here — we hand it the system prompt + task, let
 * it operate on the files, and parse the structured JSON it prints at the end.
 */
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  AgentDefinition,
  AgentRunInput,
  AgentRunResult,
  Runner,
  buildAgentSystemPrompt,
} from './agent-runner';
import { PlatformConfig } from './config';
import { Logger } from './logger';

const CLAUDE_CODE_INSTRUCTIONS = `

## Execution mode: Claude Code CLI
- Use your Read / Glob / Grep tools to study the repository, and Write / Edit to
  create or modify files (paths are relative to the repository root). Do not ask
  for permission — just do the work.
- When you are completely finished, end your reply with **exactly one JSON
  object** and nothing after it. Always include a "summary" string. If you wrote
  files, include "files": [paths]. For a validation report, include the full
  object (pass, summary, checks, feedback).`;

/** Pull the last balanced JSON object out of free-form model text. */
function extractJson(text: string): Record<string, unknown> | null {
  const start = text.lastIndexOf('{');
  if (start === -1) return null;
  // Walk forward from each candidate '{' (last first) to find a parseable block.
  for (let i = start; i >= 0; i = text.lastIndexOf('{', i - 1)) {
    const slice = text.slice(i);
    try {
      return JSON.parse(slice) as Record<string, unknown>;
    } catch {
      /* try an earlier brace */
    }
    if (i === 0) break;
  }
  return null;
}

export class ClaudeCodeRunner implements Runner {
  constructor(
    private readonly cfg: PlatformConfig,
    private readonly logger: Logger,
  ) {}

  async run(def: AgentDefinition, input: AgentRunInput): Promise<AgentRunResult> {
    const system = buildAgentSystemPrompt(this.cfg, def) + CLAUDE_CODE_INSTRUCTIONS;
    const model = def.model === 'light' ? this.cfg.models.light : this.cfg.models.default;
    const prompt = [input.task, input.context ? `\n\n## Context\n${input.context}` : '']
      .join('')
      .trim();

    // System prompt can be large (an injected README section) — pass via file.
    const sysFile = path.join(os.tmpdir(), `aidev-sys-${def.name}-${process.pid}.txt`);
    fs.writeFileSync(sysFile, system, 'utf8');

    const readOnly = input.allowWrites === false;
    const tools = readOnly
      ? ['Read', 'Glob', 'Grep']
      : ['Read', 'Glob', 'Grep', 'Write', 'Edit'];
    const args = [
      '-p',
      '--system-prompt-file',
      sysFile,
      '--output-format',
      'json',
      '--model',
      model,
      '--permission-mode',
      'bypassPermissions',
      '--add-dir',
      this.cfg.repoRoot,
      '--allowedTools',
      ...tools,
    ];

    const claude = process.platform === 'win32' ? 'claude.cmd' : 'claude';
    this.logger.info(`${def.name}: invoking Claude Code (model ${model})`);
    const res = spawnSync(claude, args, {
      cwd: this.cfg.repoRoot,
      input: prompt,
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 64 * 1024 * 1024,
      timeout: 12 * 60_000,
      shell: process.platform === 'win32',
    });
    fs.rmSync(sysFile, { force: true });

    if (res.error) throw new Error(`Could not run \`claude\`: ${res.error.message}`);
    if (res.status !== 0) {
      throw new Error(
        `claude -p exited ${res.status} for ${def.name}: ${(res.stderr || res.stdout || '').slice(0, 500)}`,
      );
    }

    let envelope: { result?: string; is_error?: boolean; usage?: Record<string, number> };
    try {
      envelope = JSON.parse(res.stdout);
    } catch {
      throw new Error(`Unparseable claude output for ${def.name}: ${res.stdout.slice(0, 300)}`);
    }
    if (envelope.is_error) throw new Error(`Claude Code error for ${def.name}: ${envelope.result}`);

    const text = envelope.result ?? '';
    const result = extractJson(text) ?? { summary: text.slice(0, 800) };
    return {
      agent: def.name,
      result,
      // Files are written directly by Claude Code's tools; the engine derives
      // touched paths from the manifest/specs rather than from this list.
      edits: [],
      transcript: text,
      usage: {
        inputTokens: envelope.usage?.input_tokens ?? 0,
        outputTokens: envelope.usage?.output_tokens ?? 0,
      },
    };
  }
}
