import { z } from 'zod';
import {
  RoleSchema,
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
  AuthTokensSchema,
  AuthUserSchema,
} from '../validation/auth.schemas';

/**
 * Auth-domain DTOs. Inferred from the Zod schemas (README §2.4 Data Contracts).
 * `Role` is the single canonical taxonomy shared with the frontend and Prisma.
 */

export type Role = z.infer<typeof RoleSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
