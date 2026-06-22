/**
 * LLM abstraction. The agent runner depends only on the `LlmClient` interface,
 * so the engine can run fully offline in tests with a scripted fake, and against
 * the real Claude API in production. (Plan: Anthropic SDK integration — the
 * swappable interface is what keeps the Agent-SDK-vs-raw-SDK choice cheap.)
 */

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type ContentBlock = TextBlock | ToolUseBlock;

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type MessageContent = string | Array<ContentBlock | ToolResultBlock>;

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: MessageContent;
}

export interface CreateMessageParams {
  model: string;
  system: string;
  messages: LlmMessage[];
  tools: ToolDefinition[];
  maxTokens: number;
}

export interface LlmResponse {
  stopReason: string | null;
  content: ContentBlock[];
  usage?: { inputTokens: number; outputTokens: number };
}

export interface LlmClient {
  createMessage(params: CreateMessageParams): Promise<LlmResponse>;
}

/**
 * Real client backed by `@anthropic-ai/sdk`. Imported lazily so that offline
 * runs (tests, `--offline`) never require the dependency or an API key.
 */
export class AnthropicClient implements LlmClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Export it (or add it to .env) before running agents.',
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getClient(): Promise<any> {
    if (!this.client) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Anthropic = require('@anthropic-ai/sdk');
      const Ctor = Anthropic.default ?? Anthropic;
      this.client = new Ctor({ apiKey: this.apiKey });
    }
    return this.client;
  }

  async createMessage(params: CreateMessageParams): Promise<LlmResponse> {
    const client = await this.getClient();
    const resp = await client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: params.messages,
      tools: params.tools,
    });
    return {
      stopReason: resp.stop_reason ?? null,
      content: resp.content as ContentBlock[],
      usage: resp.usage
        ? { inputTokens: resp.usage.input_tokens, outputTokens: resp.usage.output_tokens }
        : undefined,
    };
  }
}
