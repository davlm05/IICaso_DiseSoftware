import { z } from 'zod';

/**
 * Environment validation (README §2.3 QR rules — secret >= 32 chars; §2.5 config).
 * The app fails to boot if any required variable is missing or malformed.
 */
export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  // README §2.3: QR signing secret must be at least 32 characters.
  QR_SIGNING_SECRET: z.string().min(32),

  POS_API_KEY: z.string().min(1),
  B2B_API_KEY: z.string().min(1),

  CORS_ORIGIN: z.string().default('*'),
});

export type Env = z.infer<typeof EnvSchema>;

/** NestJS ConfigModule `validate` hook. */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
