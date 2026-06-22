"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
exports.EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    JWT_ACCESS_TTL: zod_1.z.string().default('15m'),
    JWT_REFRESH_TTL: zod_1.z.string().default('30d'),
    QR_SIGNING_SECRET: zod_1.z.string().min(32),
    POS_API_KEY: zod_1.z.string().min(1),
    B2B_API_KEY: zod_1.z.string().min(1),
    CORS_ORIGIN: zod_1.z.string().default('*'),
});
function validateEnv(config) {
    const parsed = exports.EnvSchema.safeParse(config);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(`Invalid environment configuration:\n${issues}`);
    }
    return parsed.data;
}
//# sourceMappingURL=env.validation.js.map