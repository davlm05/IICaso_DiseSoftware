import { z } from 'zod';

/**
 * Auth-domain Zod schemas. Source of truth: README §2.4 (auth endpoints),
 * §2.5 (Authentication / RBAC) and §2.8 Workflow 3. Token transport is
 * response-body + expo-secure-store (no cookies) per README §2.5.
 */

// Canonical role set — identical to the frontend taxonomy and the Prisma `Role` enum.
export const RoleSchema = z.enum([
  'USER',
  'BACKOFFICE_OPERATOR',
  'CATALOG_MANAGER',
  'STORE_ADMIN',
  'SUPER_ADMIN',
]);

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  // README does not specify a minimum length for user passwords (bcrypt cost is a
  // server concern, §2.5 A02); kept permissive here to avoid inventing a rule.
  password: z.string().min(1),
  fullName: z.string().min(1),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
});
