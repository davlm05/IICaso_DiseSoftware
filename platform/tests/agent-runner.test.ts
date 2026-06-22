import * as fs from 'fs';
import * as path from 'path';
import { AgentDefinition, AgentRunner } from '../src/agent-runner';
import { CreateMessageParams, LlmClient, LlmResponse } from '../src/llm';
import { Logger } from '../src/logger';
import { cleanup, makeTempConfig } from './helpers';

/** Scripted LLM: writes a file, then submits a result. */
class FakeLlm implements LlmClient {
  private call = 0;
  async createMessage(_params: CreateMessageParams): Promise<LlmResponse> {
    this.call += 1;
    if (this.call === 1) {
      return {
        stopReason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tu_1',
            name: 'write_file',
            input: { path: 'frontend/src/generated.ts', content: 'export const x = 1;\n' },
          },
        ],
      };
    }
    return {
      stopReason: 'tool_use',
      content: [
        {
          type: 'tool_use',
          id: 'tu_2',
          name: 'submit_result',
          input: { summary: 'done', files: ['frontend/src/generated.ts'] },
        },
      ],
    };
  }
}

const def: AgentDefinition = {
  name: 'frontend',
  model: 'light',
  maxTokens: 1000,
  readmeSection: 'frontend',
  resultSchema: { type: 'object', properties: { summary: { type: 'string' } } },
  rolePrompt: 'Test role.',
};

describe('AgentRunner', () => {
  it('runs the tool loop, writes files, and returns the submitted result', async () => {
    const cfg = makeTempConfig();
    try {
      const runner = new AgentRunner(cfg, new FakeLlm(), new Logger('test'));
      const res = await runner.run(def, { task: 'do it', allowWrites: true });

      expect(res.result.summary).toBe('done');
      expect(res.edits.map((e) => e.path)).toContain('frontend/src/generated.ts');
      const written = fs.readFileSync(
        path.join(cfg.repoRoot, 'frontend/src/generated.ts'),
        'utf8',
      );
      expect(written).toContain('export const x = 1;');
    } finally {
      cleanup(cfg);
    }
  });

  it('respects allowWrites=false (records edits but touches no disk)', async () => {
    const cfg = makeTempConfig();
    try {
      const runner = new AgentRunner(cfg, new FakeLlm(), new Logger('test'));
      const res = await runner.run(def, { task: 'do it', allowWrites: false });
      expect(res.edits).toHaveLength(1);
      expect(fs.existsSync(path.join(cfg.repoRoot, 'frontend/src/generated.ts'))).toBe(false);
    } finally {
      cleanup(cfg);
    }
  });
});
