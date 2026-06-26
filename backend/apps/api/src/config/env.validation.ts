import { z } from 'zod';

/**
 * Startup environment validation (README §2.5 A02 / Secrets Management).
 * The app fails fast at boot if any secret is missing or too weak — it never
 * silently falls back to a default. Wired into NestJS via `ConfigModule.forRoot`
 * `validate` (see `app.module.ts`).
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // README §2.5 A02 — secrets must be ≥ 32 chars; DB URL must be a valid URL.
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  QR_SIGNING_SECRET: z.string().min(32),

  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // POS / B2B surfaces authenticate with API keys, not JWT (README §2.5 Authorization).
  POS_API_KEY: z.string().min(1).optional(),
  B2B_API_KEY: z.string().min(1).optional(),

  // README §2.5 Rate Limiting — global default 100 req/min.
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  CORS_ORIGIN: z.string().default('*'),

  // README §2.5 A04/A05 — mock checkout endpoint (POST /sessions/:id/qr/pay) is a
  // dev/demo affordance only. Defaults to false so it 404s in production and can
  // never substitute for the API-key-scoped POS validation path.
  MOCK_PAY_ENABLED: z.coerce.boolean().default(false),

  // Observability (README §2.6) — all optional; absence disables the exporter.
  SENTRY_DSN: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  APP_VERSION: z.string().default('0.0.0'),
});

export type Env = z.infer<typeof envSchema>;

/** ConfigModule `validate` callback — throws (fail-fast) on invalid config. */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration (README §2.5 A02):\n${issues}`,
    );
  }
  return parsed.data;
}
