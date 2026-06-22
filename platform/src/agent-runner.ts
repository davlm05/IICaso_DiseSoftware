/**
 * Generic agent runner: loads an agent definition, assembles its system prompt
 * (shared preamble + bound README section + agent role), and drives a tool-use
 * loop until the agent calls `submit_result` (its structured output) or the
 * iteration budget is exhausted.
 */
import * as fs from 'fs';
import * as path from 'path';
import { PlatformConfig } from './config';
import { Logger } from './logger';
import {
  ContentBlock,
  LlmClient,
  LlmMessage,
  ToolDefinition,
  ToolResultBlock,
  ToolUseBlock,
} from './llm';
import { loadReadmeSection, ReadmeSection } from './readme';
import { baseTools, dispatchTool, RegisteredTool, ToolContext } from './tools';
import { AgentName, FileEdit } from './types';

export interface AgentDefinition {
  name: AgentName;
  model: 'default' | 'light';
  maxTokens: number;
  readmeSection: ReadmeSection;
  /** JSON schema for this agent's `submit_result` payload. */
  resultSchema: Record<string, unknown>;
  /** prompt.md contents (role + responsibilities + guardrails). */
  rolePrompt: string;
}

export interface AgentRunInput {
  /** The task description handed to the agent. */
  task: string;
  /** Extra context appended to the user message (specs, prior feedback, diff). */
  context?: string;
  /** Write outputs to disk (false for validation, which only reads). */
  allowWrites?: boolean;
}

export interface AgentRunResult {
  agent: AgentName;
  /** Parsed `submit_result` payload (schema-validated by instruction). */
  result: Record<string, unknown>;
  edits: FileEdit[];
  transcript: string;
  usage: { inputTokens: number; outputTokens: number };
}

const SHARED_PREAMBLE = `You are a specialized engineering agent in the SmartCart automated development platform.
SmartCart is a supermarket loyalty-points mobile app: a React Native + Expo frontend and a NestJS
modular-monolith backend (Prisma + PostgreSQL, Redis + BullMQ, full OpenTelemetry/Prometheus
observability) in a pnpm monorepo.

Rules:
- Study the existing code with read_file / list_dir BEFORE writing anything. Match the surrounding
  conventions, file layout, naming, and patterns exactly. Reuse existing utilities and components.
- Make the smallest change that fully satisfies the task. Do not rewrite unrelated code.
- When you have completed the task, call the submit_result tool with a structured summary. Do not
  end the turn with plain text — always finish via submit_result.`;

export function loadAgentDefinition(cfg: PlatformConfig, name: AgentName): AgentDefinition {
  const dir = path.join(cfg.agentsDir, name);
  const rolePrompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'agent.json'), 'utf8'));
  return {
    name,
    model: meta.model ?? 'default',
    maxTokens: meta.maxTokens ?? 8000,
    readmeSection: meta.readmeSection ?? 'none',
    resultSchema: meta.resultSchema ?? { type: 'object' },
    rolePrompt,
  };
}

function buildSystemPrompt(cfg: PlatformConfig, def: AgentDefinition): string {
  const parts = [SHARED_PREAMBLE, `\n## Your role: ${def.name} agent\n${def.rolePrompt}`];
  const grounding = loadReadmeSection(cfg.readmePath, def.readmeSection);
  if (grounding) {
    const label = def.readmeSection === 'frontend' ? '§1 Frontend Design' : '§2 Backend Design';
    parts.push(
      `\n## BINDING DESIGN GROUNDING — README.md ${label}\n` +
        `This section is authoritative. Every artifact you produce MUST comply with it. ` +
        `The validation agent will score your output against it.\n\n${grounding}`,
    );
  }
  return parts.join('\n');
}

function submitResultTool(def: AgentDefinition): RegisteredTool {
  return {
    def: {
      name: 'submit_result',
      description:
        'Submit your final structured result and end the task. Call this exactly once when finished.',
      input_schema: def.resultSchema,
    },
    // Handled specially by the loop (terminates); never actually invoked here.
    handler: () => 'OK',
  };
}

export class AgentRunner {
  constructor(
    private readonly cfg: PlatformConfig,
    private readonly llm: LlmClient,
    private readonly logger: Logger,
  ) {}

  async run(def: AgentDefinition, input: AgentRunInput): Promise<AgentRunResult> {
    const system = buildSystemPrompt(this.cfg, def);
    const tools: RegisteredTool[] = [...baseTools, submitResultTool(def)];
    const toolDefs: ToolDefinition[] = tools.map((t) => t.def);
    const ctx: ToolContext = {
      repoRoot: this.cfg.repoRoot,
      edits: [],
      readOnly: input.allowWrites === false,
    };

    const userMsg = [input.task, input.context ? `\n\n## Context\n${input.context}` : '']
      .join('')
      .trim();
    const messages: LlmMessage[] = [{ role: 'user', content: userMsg }];

    const model = def.model === 'light' ? this.cfg.models.light : this.cfg.models.default;
    const usage = { inputTokens: 0, outputTokens: 0 };
    const transcript: string[] = [`### ${def.name} agent\nTASK: ${input.task}`];

    for (let i = 0; i < this.cfg.maxIterations; i++) {
      const resp = await this.llm.createMessage({
        model,
        system,
        messages,
        tools: toolDefs,
        maxTokens: def.maxTokens,
      });
      if (resp.usage) {
        usage.inputTokens += resp.usage.inputTokens;
        usage.outputTokens += resp.usage.outputTokens;
      }

      messages.push({ role: 'assistant', content: resp.content });

      const toolUses = resp.content.filter(
        (b): b is ToolUseBlock => b.type === 'tool_use',
      );
      for (const block of resp.content) {
        if (block.type === 'text' && block.text.trim()) {
          transcript.push(`[assistant] ${block.text.trim()}`);
        }
      }

      // No tool call: nudge once, then bail to avoid an infinite stall.
      if (toolUses.length === 0) {
        messages.push({
          role: 'user',
          content: 'Reminder: finish by calling submit_result with your structured result.',
        });
        continue;
      }

      const submit = toolUses.find((t) => t.name === 'submit_result');
      if (submit) {
        this.logger.info(
          `${def.name}: submitted result (${ctx.edits.length} file(s) written)`,
        );
        transcript.push(`[submit_result] ${JSON.stringify(submit.input)}`);
        return {
          agent: def.name,
          result: submit.input,
          edits: ctx.edits,
          transcript: transcript.join('\n'),
          usage,
        };
      }

      const results: ToolResultBlock[] = [];
      for (const tu of toolUses) {
        const out = await dispatchTool(tools, tu.name, tu.input, ctx);
        transcript.push(`[tool ${tu.name}] ${JSON.stringify(tu.input).slice(0, 200)}`);
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: String(out) });
      }
      messages.push({ role: 'user', content: results });
    }

    throw new Error(
      `${def.name} agent did not call submit_result within ${this.cfg.maxIterations} iterations`,
    );
  }
}

/** Helper to read assistant text blocks (used by tests / fakes). */
export function textOf(content: ContentBlock[]): string {
  return content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}
