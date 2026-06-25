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

/** How the client authenticates. See config.resolveAuth(). */
export interface AnthropicAuth {
  kind: 'api-key' | 'oauth' | 'sdk-default';
  apiKey?: string;
  authToken?: string;
}

/** Beta header required when authenticating /v1/messages with an OAuth token. */
const OAUTH_BETA_HEADER = 'oauth-2025-04-20';

/**
 * Real client backed by `@anthropic-ai/sdk`. Imported lazily so that offline
 * runs (tests, `--offline`) never require the dependency or any credential.
 *
 * Supports three auth modes (resolved by config.resolveAuth):
 *  - 'api-key'     → metered ANTHROPIC_API_KEY
 *  - 'oauth'       → Claude Code subscription / `ant auth login` bearer token
 *                    (Authorization: Bearer + anthropic-beta: oauth-2025-04-20)
 *  - 'sdk-default' → let the SDK resolve an `ant auth login` profile from disk
 */
export class AnthropicClient implements LlmClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private readonly auth: AnthropicAuth;

  /** Accepts an auth descriptor, or a bare API key string for back-compat. */
  constructor(auth: AnthropicAuth | string) {
    this.auth = typeof auth === 'string' ? { kind: 'api-key', apiKey: auth } : auth;
    if (this.auth.kind === 'api-key' && !this.auth.apiKey) {
      throw new Error(
        'No Claude credentials. Set ANTHROPIC_API_KEY, or use the logged-in ' +
          'session: run `ant auth login` and set AIDEV_AUTH_MODE=oauth (or export ' +
          'ANTHROPIC_AUTH_TOKEN). See platform/README.md → "Use this Claude account".',
      );
    }
    if (this.auth.kind === 'oauth' && !this.auth.authToken) {
      throw new Error(
        'AIDEV_AUTH_MODE=oauth but no token found. Run `ant auth login`, then ' +
          '`eval "$(ant auth print-credentials --env)"` (or export ANTHROPIC_AUTH_TOKEN).',
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getClient(): Promise<any> {
    if (!this.client) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Anthropic = require('@anthropic-ai/sdk');
      const Ctor = Anthropic.default ?? Anthropic;
      if (this.auth.kind === 'oauth') {
        this.client = new Ctor({
          authToken: this.auth.authToken,
          // OAuth bearer tokens require this beta header on /v1/messages.
          defaultHeaders: { 'anthropic-beta': OAUTH_BETA_HEADER },
        });
      } else if (this.auth.kind === 'api-key') {
        this.client = new Ctor({ apiKey: this.auth.apiKey });
      } else {
        // sdk-default: SDK resolves ANTHROPIC_AUTH_TOKEN / `ant` profile itself.
        // Send the OAuth beta header defensively since the resolved credential
        // is most likely an OAuth token from a logged-in profile.
        this.client = new Ctor({ defaultHeaders: { 'anthropic-beta': OAUTH_BETA_HEADER } });
      }
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
