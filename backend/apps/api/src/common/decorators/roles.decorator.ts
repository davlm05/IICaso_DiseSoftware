import { SetMetadata } from '@nestjs/common';
import type { Role } from '@smartcart/shared-types';

export const ROLES_KEY = 'roles';

/**
 * `@Roles('SUPER_ADMIN')` — RBAC metadata read by RolesGuard (README §2.5 RBAC).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
