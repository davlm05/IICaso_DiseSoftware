import { z } from 'zod';

/**
 * Worker startup env validation (README §2.5 A10 SSRF, A02).
 * `AI_INFERENCE_URL` MUST be a valid HTTPS URL — a local/`http://` value fails
 * validation before the worker accepts any jobs, so no attacker-controlled URL
 * can be reached.
 */
export const workerEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // SSRF guard (README §2.5 A10): fixed, HTTPS-only inference endpoint.
  AI_INFERENCE_URL: z.string().url().startsWith('https://'),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function validateWorkerEnv(config: Record<string, unknown>): WorkerEnv {
  const parsed = workerEnvSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid worker environment (README §2.5 A10):\n${issues}`);
  }
  return parsed.data;
}
