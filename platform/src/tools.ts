/**
 * Repo-scoped tools exposed to agents during their tool-use loop.
 *
 * Every path is resolved against, and confined to, the repo root — an agent
 * cannot read or write outside the project. `write_file` records each edit so
 * the engine can report exactly which files a build/qa run touched.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ToolDefinition } from './llm';
import { FileEdit } from './types';

export interface ToolContext {
  repoRoot: string;
  /** Populated by write_file; surfaced in the build/test manifest. */
  edits: FileEdit[];
  /** When true, write_file validates + records but does not touch disk. */
  readOnly?: boolean;
}

export type ToolHandler = (
  input: Record<string, unknown>,
  ctx: ToolContext,
) => Promise<string> | string;

export interface RegisteredTool {
  def: ToolDefinition;
  handler: ToolHandler;
}

function resolveSafe(repoRoot: string, rel: string): string {
  const abs = path.resolve(repoRoot, rel);
  const normalizedRoot = path.resolve(repoRoot);
  if (abs !== normalizedRoot && !abs.startsWith(normalizedRoot + path.sep)) {
    throw new Error(`Path escapes repo root: ${rel}`);
  }
  return abs;
}

export const readFileTool: RegisteredTool = {
  def: {
    name: 'read_file',
    description:
      'Read a UTF-8 text file relative to the repository root. Use this to study existing code, specs, and conventions before writing.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Path relative to repo root' } },
      required: ['path'],
    },
  },
  handler: (input, ctx) => {
    const abs = resolveSafe(ctx.repoRoot, String(input.path));
    if (!fs.existsSync(abs)) return `ERROR: file not found: ${input.path}`;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) return `ERROR: ${input.path} is a directory; use list_dir`;
    const text = fs.readFileSync(abs, 'utf8');
    // Guard against dumping huge files into context.
    const MAX = 60_000;
    return text.length > MAX ? text.slice(0, MAX) + '\n... [truncated]' : text;
  },
};

export const listDirTool: RegisteredTool = {
  def: {
    name: 'list_dir',
    description: 'List the entries of a directory relative to the repository root.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Directory path relative to repo root' } },
      required: ['path'],
    },
  },
  handler: (input, ctx) => {
    const abs = resolveSafe(ctx.repoRoot, String(input.path || '.'));
    if (!fs.existsSync(abs)) return `ERROR: directory not found: ${input.path}`;
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    return entries
      .filter((e) => e.name !== 'node_modules' && e.name !== '.git')
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
      .join('\n');
  },
};

export const writeFileTool: RegisteredTool = {
  def: {
    name: 'write_file',
    description:
      'Create or overwrite a UTF-8 text file relative to the repository root. Parent directories are created automatically. Use this for specs, source code, and tests.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path relative to repo root' },
        content: { type: 'string', description: 'Full file contents' },
      },
      required: ['path', 'content'],
    },
  },
  handler: (input, ctx) => {
    const rel = String(input.path);
    const content = String(input.content ?? '');
    const abs = resolveSafe(ctx.repoRoot, rel);
    ctx.edits.push({ path: rel.replace(/\\/g, '/'), content });
    if (!ctx.readOnly) {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, 'utf8');
    }
    return `OK: wrote ${content.length} bytes to ${rel}`;
  },
};

/** Base toolset for agents that read context and write outputs. */
export const baseTools: RegisteredTool[] = [readFileTool, listDirTool, writeFileTool];

export function dispatchTool(
  tools: RegisteredTool[],
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> | string {
  const tool = tools.find((t) => t.def.name === name);
  if (!tool) return `ERROR: unknown tool ${name}`;
  try {
    return tool.handler(input, ctx);
  } catch (err) {
    return `ERROR: ${(err as Error).message}`;
  }
}
